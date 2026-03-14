import AVFoundation
import CoreImage
import Metal
import MetalPetal
import UIKit
import WebKit

enum LatentCameraPreference: String {
    case rearPrimary
}

struct LatentPreviewLayout {
    let x: CGFloat
    let y: CGFloat
    let width: CGFloat
    let height: CGFloat
    let scale: CGFloat
    let cornerRadius: CGFloat
}

struct LatentPreviewOptions {
    let layout: LatentPreviewLayout
    let cameraPreference: LatentCameraPreference
    let distortionEnabled: Bool
    let distortionStrength: Float
}

enum LatentCameraError: LocalizedError {
    case permissionDenied
    case invalidArguments(String)
    case configuration(String)

    var errorDescription: String? {
        switch self {
        case .permissionDenied:
            return "Camera permission denied"
        case .invalidArguments(let message):
            return message
        case .configuration(let message):
            return message
        }
    }
}

final class LatentCameraImplementation: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
    private let session = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()
    private let videoOutput = AVCaptureVideoDataOutput()
    private let lensProcessor = LatentLensProcessor()
    private let previewFilter = LatentPreviewWarpFilter()
    private let sessionQueue = DispatchQueue(label: "com.latent.camera.session", qos: .userInitiated)
    private var configured = false
    private var previewActive = false
    private var previewDistortionEnabled = true
    private var previewDistortionStrength: Float = 0.08
    private var previewView: MTIImageView?
    private var inFlightCaptureProcessors: [LatentPhotoCaptureProcessor] = []

    private lazy var renderContext: MTIContext? = {
        guard let device = MTLCreateSystemDefaultDevice() else {
            return nil
        }
        return try? MTIContext(device: device)
    }()

    override init() {
        super.init()
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleApplicationWillResignActive),
            name: UIApplication.willResignActiveNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleApplicationDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    func startPreview(options: LatentPreviewOptions, webView: WKWebView, completion: @escaping (Result<Void, Error>) -> Void) {
        ensureCameraPermission { [weak self] granted in
            guard let self else { return }
            guard granted else {
                completion(.failure(LatentCameraError.permissionDenied))
                return
            }

            self.sessionQueue.async {
                do {
                    try self.configureIfNeeded(cameraPreference: options.cameraPreference)
                    self.previewActive = true
                    self.previewDistortionEnabled = options.distortionEnabled
                    self.previewDistortionStrength = options.distortionStrength
                    self.applyVideoOrientation()

                    if self.session.isRunning == false {
                        self.session.startRunning()
                    }

                    DispatchQueue.main.async {
                        self.attachPreviewViewIfNeeded(to: webView)
                        self.applyPreviewLayout(options.layout, webView: webView)
                        completion(.success(()))
                    }
                } catch {
                    completion(.failure(error))
                }
            }
        }
    }

    func updatePreviewLayout(_ layout: LatentPreviewLayout, webView: WKWebView) {
        DispatchQueue.main.async {
            self.applyPreviewLayout(layout, webView: webView)
        }
    }

    func stopPreview(completion: @escaping (Result<Void, Error>) -> Void) {
        sessionQueue.async {
            self.previewActive = false
            if self.session.isRunning {
                self.session.stopRunning()
            }

            DispatchQueue.main.async {
                self.previewView?.image = nil
                self.previewView?.removeFromSuperview()
                self.previewView = nil
                completion(.success(()))
            }
        }
    }

    func captureFrame(lensId: String, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        ensureCameraPermission { [weak self] granted in
            guard let self else { return }
            guard granted else {
                completion(.failure(LatentCameraError.permissionDenied))
                return
            }

            self.sessionQueue.async {
                do {
                    try self.configureIfNeeded(cameraPreference: .rearPrimary)
                    self.applyVideoOrientation()
                    if self.session.isRunning == false {
                        self.session.startRunning()
                    }

                    let settings = AVCapturePhotoSettings()
                    settings.flashMode = .off

                    let captureID = UUID()
                    let processor = LatentPhotoCaptureProcessor(id: captureID) { [weak self] result in
                        guard let self else { return }
                        self.sessionQueue.async {
                            self.inFlightCaptureProcessors.removeAll { $0.id == captureID }
                        }

                        switch result {
                        case .failure(let error):
                            completion(.failure(error))
                        case .success(let photo):
                            do {
                                guard let data = photo.fileDataRepresentation(),
                                      let ciImage = CIImage(data: data) else {
                                    throw LatentCameraError.configuration("Photo data unavailable")
                                }

                                let processed = try self.lensProcessor.render(lensId: lensId, from: ciImage)
                                let files = try self.lensProcessor.write(image: processed, quality: 0.85)

                                let payload: [String: Any] = [
                                    "masterUri": files.masterUri,
                                    "derivativeUri": files.derivativeUri,
                                    "width": Int(processed.extent.width),
                                    "height": Int(processed.extent.height)
                                ]
                                completion(.success(payload))
                            } catch {
                                completion(.failure(error))
                            }
                        }
                    }

                    self.inFlightCaptureProcessors.append(processor)
                    self.photoOutput.capturePhoto(with: settings, delegate: processor)
                } catch {
                    completion(.failure(error))
                }
            }
        }
    }

    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard output == videoOutput, previewActive else {
            return
        }

        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
            return
        }

        var image = MTIImage(cvPixelBuffer: pixelBuffer, alphaType: .alphaIsOne)
        if connection.isVideoMirrored {
            image = image.oriented(.upMirrored)
        }

        let outputImage: MTIImage
        if previewDistortionEnabled {
            previewFilter.inputImage = image
            previewFilter.strength = previewDistortionStrength
            outputImage = previewFilter.outputImage ?? image
        } else {
            outputImage = image
        }

        DispatchQueue.main.async { [weak self] in
            self?.previewView?.image = outputImage
        }
    }

    @objc private func handleApplicationWillResignActive() {
        sessionQueue.async {
            if self.session.isRunning {
                self.session.stopRunning()
            }
        }
    }

    @objc private func handleApplicationDidBecomeActive() {
        sessionQueue.async {
            guard self.previewActive, self.session.isRunning == false else {
                return
            }
            self.applyVideoOrientation()
            self.session.startRunning()
        }
    }

    private func ensureCameraPermission(_ completion: @escaping (Bool) -> Void) {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            completion(true)
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                completion(granted)
            }
        default:
            completion(false)
        }
    }

    private func configureIfNeeded(cameraPreference: LatentCameraPreference) throws {
        if configured {
            return
        }

        guard renderContext != nil else {
            throw LatentCameraError.configuration("Metal unavailable on this device")
        }

        session.beginConfiguration()
        session.sessionPreset = .photo

        guard let device = preferredBackCamera(for: cameraPreference) else {
            session.commitConfiguration()
            throw LatentCameraError.configuration("Back camera unavailable")
        }

        let input = try AVCaptureDeviceInput(device: device)
        guard session.canAddInput(input) else {
            session.commitConfiguration()
            throw LatentCameraError.configuration("Cannot add camera input")
        }

        guard session.canAddOutput(photoOutput) else {
            session.commitConfiguration()
            throw LatentCameraError.configuration("Cannot add photo output")
        }

        guard session.canAddOutput(videoOutput) else {
            session.commitConfiguration()
            throw LatentCameraError.configuration("Cannot add video output")
        }

        videoOutput.alwaysDiscardsLateVideoFrames = true
        videoOutput.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarFullRange]
        videoOutput.setSampleBufferDelegate(self, queue: sessionQueue)

        session.addInput(input)
        session.addOutput(photoOutput)
        session.addOutput(videoOutput)

        session.commitConfiguration()
        configured = true
    }

    private func preferredBackCamera(for preference: LatentCameraPreference) -> AVCaptureDevice? {
        if preference == .rearPrimary,
           let wide = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) {
            return wide
        }

        let discovery = AVCaptureDevice.DiscoverySession(
            deviceTypes: [
                .builtInWideAngleCamera,
                .builtInDualWideCamera,
                .builtInDualCamera,
                .builtInTripleCamera,
                .builtInUltraWideCamera,
                .builtInTelephotoCamera
            ],
            mediaType: .video,
            position: .back
        )

        return discovery.devices.first
    }

    private func attachPreviewViewIfNeeded(to webView: WKWebView) {
        if previewView == nil {
            let imageView = MTIImageView(frame: .zero)
            imageView.backgroundColor = .black
            imageView.isOpaque = true
            imageView.clipsToBounds = true
            imageView.isUserInteractionEnabled = false
            imageView.resizingMode = .aspectFill
            imageView.context = renderContext
            previewView = imageView
        }

        guard let previewView else {
            return
        }

        let hostView = webView.superview ?? webView
        if previewView.superview !== hostView {
            previewView.removeFromSuperview()
            hostView.addSubview(previewView)
        }
    }

    private func applyPreviewLayout(_ layout: LatentPreviewLayout, webView: WKWebView) {
        guard let previewView else {
            return
        }

        let scale = layout.scale > 0 ? layout.scale : UIScreen.main.scale
        let alignedRect = CGRect(
            x: round(layout.x * scale) / scale,
            y: round(layout.y * scale) / scale,
            width: round(layout.width * scale) / scale,
            height: round(layout.height * scale) / scale
        )

        let frame: CGRect
        if let hostView = webView.superview {
            frame = webView.convert(alignedRect, to: hostView)
        } else {
            frame = alignedRect
        }

        previewView.frame = frame
        previewView.layer.cornerRadius = max(layout.cornerRadius, 0)
        if #available(iOS 13.0, *) {
            previewView.layer.cornerCurve = .continuous
        }
    }

    private func applyVideoOrientation() {
        let orientation = currentVideoOrientation()

        if let videoConnection = videoOutput.connection(with: .video), videoConnection.isVideoOrientationSupported {
            videoConnection.videoOrientation = orientation
        }

        if let photoConnection = photoOutput.connection(with: .video), photoConnection.isVideoOrientationSupported {
            photoConnection.videoOrientation = orientation
        }
    }

    private func currentVideoOrientation() -> AVCaptureVideoOrientation {
        let interfaceOrientation: UIInterfaceOrientation

        if Thread.isMainThread {
            interfaceOrientation = currentInterfaceOrientation()
        } else {
            var resolved: UIInterfaceOrientation = .landscapeRight
            DispatchQueue.main.sync {
                resolved = self.currentInterfaceOrientation()
            }
            interfaceOrientation = resolved
        }

        switch interfaceOrientation {
        case .landscapeLeft:
            return .landscapeLeft
        case .portrait:
            return .portrait
        case .portraitUpsideDown:
            return .portraitUpsideDown
        default:
            return .landscapeRight
        }
    }

    private func currentInterfaceOrientation() -> UIInterfaceOrientation {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first?
            .interfaceOrientation ?? .landscapeRight
    }
}
