import Foundation
import Metal
import MetalPetal

final class LatentPreviewWarpFilter: NSObject, MTIFilter {
    var inputImage: MTIImage?
    var strength: Float = 0.08
    var outputPixelFormat: MTLPixelFormat = .unspecified

    private static let kernel: MTIRenderPipelineKernel = {
        MTIRenderPipelineKernel(
            vertexFunctionDescriptor: .passthroughVertex,
            fragmentFunctionDescriptor: MTIFunctionDescriptor(name: "latentViewfinderWarp", in: shaderBundle)
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

        return Self.kernel.apply(
            to: inputImage,
            parameters: ["strength": strength],
            outputDimensions: inputImage.dimensions,
            outputPixelFormat: outputPixelFormat
        )
    }
}
