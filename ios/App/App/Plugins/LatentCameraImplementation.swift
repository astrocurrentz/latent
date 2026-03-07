import AVFoundation
import CoreImage

final class LatentCameraImplementation {
    private let session = AVCaptureSession()
    private let output = AVCapturePhotoOutput()
    private let lensProcessor = LatentLensProcessor()
    private let queue = DispatchQueue(label: "com.latent.camera.capture")
    private var configured = false

    private func configureIfNeeded() throws {
        if configured {
            return
        }

        session.beginConfiguration()
        session.sessionPreset = .photo

        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
            throw NSError(domain: "LatentCamera", code: -10, userInfo: [NSLocalizedDescriptionKey: "Back camera unavailable"])
        }

        let input = try AVCaptureDeviceInput(device: device)
        guard session.canAddInput(input) else {
            throw NSError(domain: "LatentCamera", code: -11, userInfo: [NSLocalizedDescriptionKey: "Cannot add camera input"])
        }

        guard session.canAddOutput(output) else {
            throw NSError(domain: "LatentCamera", code: -12, userInfo: [NSLocalizedDescriptionKey: "Cannot add camera output"])
        }

        session.addInput(input)
        session.addOutput(output)
        session.commitConfiguration()
        session.startRunning()
        configured = true
    }

    func captureFrame(lensId: String, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        queue.async {
            do {
                try self.configureIfNeeded()

                let settings = AVCapturePhotoSettings()
                settings.flashMode = .off

                let processor = LatentPhotoCaptureProcessor { result in
                    switch result {
                    case .failure(let error):
                        completion(.failure(error))
                    case .success(let photo):
                        do {
                            guard let data = photo.fileDataRepresentation(),
                                  let ciImage = CIImage(data: data) else {
                                throw NSError(domain: "LatentCamera", code: -20, userInfo: [NSLocalizedDescriptionKey: "Photo data unavailable"])
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

                self.output.capturePhoto(with: settings, delegate: processor)
            } catch {
                completion(.failure(error))
            }
        }
    }
}
