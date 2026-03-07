import Capacitor

@objc(LatentCameraPlugin)
public class LatentCameraPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LatentCameraPlugin"
    public let jsName = "LatentCamera"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "captureFrame", returnType: CAPPluginReturnPromise)
    ]

    private let implementation = LatentCameraImplementation()

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
}
