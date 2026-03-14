import Foundation
import Metal
import MetalPetal

final class LatentOverlayCompositeFilter: NSObject, MTIFilter {
    var inputImage: MTIImage?
    var overlayImage: MTIImage?
    var outputPixelFormat: MTLPixelFormat = .unspecified

    private static let kernel: MTIRenderPipelineKernel = {
        MTIRenderPipelineKernel(
            vertexFunctionDescriptor: .passthroughVertex,
            fragmentFunctionDescriptor: MTIFunctionDescriptor(name: "latentCompositeOverlay", in: shaderBundle)
        )
    }()

    private static var shaderBundle: Bundle {
        #if SWIFT_PACKAGE
        return .module
        #else
        return .main
        #endif
    }

    var outputImage: MTIImage? {
        guard let inputImage else {
            return nil
        }

        guard let overlayImage else {
            return inputImage
        }

        return Self.kernel.apply(
            to: [inputImage, overlayImage],
            parameters: [:],
            outputDimensions: inputImage.dimensions,
            outputPixelFormat: outputPixelFormat
        )
    }
}
