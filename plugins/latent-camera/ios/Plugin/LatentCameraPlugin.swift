import Capacitor
import Foundation
import WebKit

@objc(LatentCameraPlugin)
public class LatentCameraPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LatentCameraPlugin"
    public let jsName = "LatentCamera"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startPreview", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updatePreviewLayout", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopPreview", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "captureFrame", returnType: CAPPluginReturnPromise)
    ]

    private let implementation = LatentCameraImplementation()

    @objc func startPreview(_ call: CAPPluginCall) {
        guard let webView = bridge?.webView else {
            call.reject("Web view unavailable")
            return
        }

        do {
            let options = try parsePreviewOptions(call)
            implementation.startPreview(options: options, webView: webView) { result in
                DispatchQueue.main.async {
                    switch result {
                    case .success:
                        call.resolve()
                    case .failure(let error):
                        call.reject(error.localizedDescription)
                    }
                }
            }
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    @objc func updatePreviewLayout(_ call: CAPPluginCall) {
        guard let webView = bridge?.webView else {
            call.reject("Web view unavailable")
            return
        }

        guard let layoutObject = call.getObject("layout") else {
            call.reject("layout is required")
            return
        }

        do {
            let layout = try parseLayout(layoutObject)
            implementation.updatePreviewLayout(layout, webView: webView)
            call.resolve()
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    @objc func stopPreview(_ call: CAPPluginCall) {
        implementation.stopPreview { result in
            DispatchQueue.main.async {
                switch result {
                case .success:
                    call.resolve()
                case .failure(let error):
                    call.reject(error.localizedDescription)
                }
            }
        }
    }

    @objc func captureFrame(_ call: CAPPluginCall) {
        guard let lensId = call.getString("lensId") else {
            call.reject("lensId is required")
            return
        }

        implementation.captureFrame(lensId: lensId) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let payload):
                    call.resolve(payload)
                case .failure(let error):
                    call.reject(error.localizedDescription)
                }
            }
        }
    }

    private func parsePreviewOptions(_ call: CAPPluginCall) throws -> LatentPreviewOptions {
        guard let layoutObject = call.getObject("layout") else {
            throw LatentCameraError.invalidArguments("layout is required")
        }

        let layout = try parseLayout(layoutObject)
        let cameraPreferenceRaw = call.getString("cameraPreference") ?? "rearPrimary"

        let distortionObject = call.getObject("distortion")
        let distortionEnabled = distortionObject?["enabled"] as? Bool ?? true
        let strengthValue = distortionObject?["strength"]
        let strength = Self.parseDistortionStrength(strengthValue)

        return LatentPreviewOptions(
            layout: layout,
            cameraPreference: LatentCameraPreference(rawValue: cameraPreferenceRaw) ?? .rearPrimary,
            distortionEnabled: distortionEnabled,
            distortionStrength: strength
        )
    }

    private func parseLayout(_ object: JSObject) throws -> LatentPreviewLayout {
        guard let x = object["x"] as? Double,
              let y = object["y"] as? Double,
              let width = object["width"] as? Double,
              let height = object["height"] as? Double else {
            throw LatentCameraError.invalidArguments("layout must include x, y, width, and height")
        }

        let scale = (object["scale"] as? Double) ?? 1
        let cornerRadius = (object["cornerRadius"] as? Double) ?? 0

        return LatentPreviewLayout(
            x: CGFloat(x),
            y: CGFloat(y),
            width: CGFloat(width),
            height: CGFloat(height),
            scale: CGFloat(scale),
            cornerRadius: CGFloat(cornerRadius)
        )
    }

    private static func parseDistortionStrength(_ value: Any?) -> Float {
        if let strength = value as? NSNumber {
            return clampStrength(strength.floatValue)
        }

        if let label = value as? String {
            switch label.lowercased() {
            case "low":
                return 0.04
            case "high":
                return 0.12
            default:
                return 0.08
            }
        }

        return 0.08
    }

    private static func clampStrength(_ value: Float) -> Float {
        min(max(value, 0), 0.3)
    }
}
