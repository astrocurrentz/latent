import CoreImage
import CoreImage.CIFilterBuiltins
import UIKit

final class LatentLensProcessor {
    private let context = CIContext(options: nil)

    func render(lensId: String, from image: CIImage) throws -> CIImage {
        switch lensId {
        case "plain":
            return image
        case "kodak_gold":
            let sepia = CIFilter.sepiaTone()
            sepia.inputImage = image
            sepia.intensity = 0.62
            return sepia.outputImage ?? image
        case "bw":
            let mono = CIFilter.photoEffectNoir()
            mono.inputImage = image
            return mono.outputImage ?? image
        case "ascii":
            let pixellate = CIFilter.pixellate()
            pixellate.inputImage = image
            pixellate.scale = 18
            return pixellate.outputImage ?? image
        case "glitch":
            let colorClamp = CIFilter.colorClamp()
            colorClamp.inputImage = image
            colorClamp.minComponents = CIVector(x: 0.05, y: 0.08, z: 0.18, w: 0.0)
            colorClamp.maxComponents = CIVector(x: 0.92, y: 0.96, z: 1.0, w: 1.0)
            return colorClamp.outputImage ?? image
        case "thermal":
            let falseColor = CIFilter.falseColor()
            falseColor.inputImage = image
            falseColor.color0 = CIColor(red: 0.02, green: 0.03, blue: 0.2)
            falseColor.color1 = CIColor(red: 1.0, green: 0.56, blue: 0.08)
            return falseColor.outputImage ?? image
        default:
            return image
        }
    }

    func write(image: CIImage, quality: CGFloat) throws -> (masterUri: String, derivativeUri: String) {
        guard let cgImage = context.createCGImage(image, from: image.extent) else {
            throw LatentCameraError.configuration("Failed to render image")
        }

        let uiImage = UIImage(cgImage: cgImage)
        guard let pngData = uiImage.pngData(),
              let jpegData = uiImage.jpegData(compressionQuality: quality) else {
            throw LatentCameraError.configuration("Failed to encode image data")
        }

        let temporaryDirectory = FileManager.default.temporaryDirectory
        let baseName = UUID().uuidString
        let masterURL = temporaryDirectory.appendingPathComponent("\(baseName)-master.png")
        let derivativeURL = temporaryDirectory.appendingPathComponent("\(baseName)-derivative.jpg")

        try pngData.write(to: masterURL, options: .atomic)
        try jpegData.write(to: derivativeURL, options: .atomic)

        return (masterURL.absoluteString, derivativeURL.absoluteString)
    }
}
