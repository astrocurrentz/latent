import CoreGraphics
import Foundation
import MetalPetal

final class LatentViewfinderOverlayRenderer {
    private let markAlpha: CGFloat = 0.58
    private var cachedSize: CGSize = .zero
    private var cachedImage: MTIImage?

    func overlayImage(width: Int, height: Int) -> MTIImage? {
        guard width > 0, height > 0 else {
            return nil
        }

        let size = CGSize(width: width, height: height)
        if size == cachedSize, let cachedImage {
            return cachedImage
        }

        guard let image = makeOverlayImage(size: size) else {
            return nil
        }

        cachedSize = size
        cachedImage = image
        return image
    }

    func reset() {
        cachedSize = .zero
        cachedImage = nil
    }

    private func makeOverlayImage(size: CGSize) -> MTIImage? {
        let width = max(Int(size.width.rounded(.up)), 1)
        let height = max(Int(size.height.rounded(.up)), 1)
        let renderSize = CGSize(width: width, height: height)

        guard
            let context = CGContext(
                data: nil,
                width: width,
                height: height,
                bitsPerComponent: 8,
                bytesPerRow: 0,
                space: CGColorSpaceCreateDeviceRGB(),
                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
            )
        else {
            return nil
        }

        // Align CoreGraphics drawing coordinates with the top-left origin
        // expected by our normalized overlay geometry.
        context.translateBy(x: 0, y: renderSize.height)
        context.scaleBy(x: 1, y: -1)
        context.clear(CGRect(origin: .zero, size: renderSize))
        context.setFillColor(red: 1, green: 1, blue: 1, alpha: markAlpha)
        drawMarks(in: context, size: renderSize)

        guard let cgImage = context.makeImage() else {
            return nil
        }

        return MTIImage(cgImage: cgImage, options: [:], isOpaque: false)
    }

    private func drawMarks(in context: CGContext, size: CGSize) {
        let verticalOffset = (66.0 / 1440.0) * size.height
        context.saveGState()
        context.translateBy(x: 0, y: verticalOffset)

        let baseRects = [
            // Outer guide marks
            normalizedRect(x: 420.0 / 1920.0, y: 60.0 / 1440.0, width: 1080.0 / 1920.0, height: 18.0 / 1440.0, size: size),
            normalizedRect(x: 80.0 / 1920.0, y: 300.0 / 1440.0, width: 26.0 / 1920.0, height: 760.0 / 1440.0, size: size),
            normalizedRect(x: 1814.0 / 1920.0, y: 300.0 / 1440.0, width: 26.0 / 1920.0, height: 760.0 / 1440.0, size: size),

            // Center framing marks
            normalizedRect(x: 832.0 / 1920.0, y: 525.0 / 1440.0, width: 256.0 / 1920.0, height: 12.0 / 1440.0, size: size),
            normalizedRect(x: 628.0 / 1920.0, y: 615.0 / 1440.0, width: 8.0 / 1920.0, height: 240.0 / 1440.0, size: size),
            normalizedRect(x: 1284.0 / 1920.0, y: 615.0 / 1440.0, width: 8.0 / 1920.0, height: 240.0 / 1440.0, size: size),
            normalizedRect(x: 885.0 / 1920.0, y: 690.0 / 1440.0, width: 150.0 / 1920.0, height: 90.0 / 1440.0, size: size),
            normalizedRect(x: 832.0 / 1920.0, y: 930.0 / 1440.0, width: 256.0 / 1920.0, height: 12.0 / 1440.0, size: size),

            // Bottom alignment marks
            normalizedRect(x: 420.0 / 1920.0, y: 1230.0 / 1440.0, width: 230.0 / 1920.0, height: 18.0 / 1440.0, size: size),
            normalizedRect(x: 1270.0 / 1920.0, y: 1230.0 / 1440.0, width: 230.0 / 1920.0, height: 18.0 / 1440.0, size: size)
        ]

        context.fill(baseRects)

        context.fillEllipse(in: normalizedCircleRect(
            centerX: 960.0 / 1920.0,
            centerY: 1146.0 / 1440.0,
            radius: 22.0 / 1920.0,
            size: size
        ))

        let leftTriangle = CGMutablePath()
        leftTriangle.move(to: normalizedPoint(x: 858.0 / 1920.0, y: 1146.0 / 1440.0, size: size))
        leftTriangle.addLine(to: normalizedPoint(x: 898.0 / 1920.0, y: 1124.0 / 1440.0, size: size))
        leftTriangle.addLine(to: normalizedPoint(x: 898.0 / 1920.0, y: 1168.0 / 1440.0, size: size))
        leftTriangle.closeSubpath()
        context.addPath(leftTriangle)
        context.fillPath()

        let rightTriangle = CGMutablePath()
        rightTriangle.move(to: normalizedPoint(x: 1062.0 / 1920.0, y: 1146.0 / 1440.0, size: size))
        rightTriangle.addLine(to: normalizedPoint(x: 1022.0 / 1920.0, y: 1124.0 / 1440.0, size: size))
        rightTriangle.addLine(to: normalizedPoint(x: 1022.0 / 1920.0, y: 1168.0 / 1440.0, size: size))
        rightTriangle.closeSubpath()
        context.addPath(rightTriangle)
        context.fillPath()

        context.restoreGState()
    }

    private func normalizedRect(x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat, size: CGSize) -> CGRect {
        CGRect(
            x: x * size.width,
            y: y * size.height,
            width: width * size.width,
            height: height * size.height
        )
    }

    private func normalizedPoint(x: CGFloat, y: CGFloat, size: CGSize) -> CGPoint {
        CGPoint(x: x * size.width, y: y * size.height)
    }

    private func normalizedCircleRect(centerX: CGFloat, centerY: CGFloat, radius: CGFloat, size: CGSize) -> CGRect {
        let radiusX = radius * size.width
        return CGRect(
            x: centerX * size.width - radiusX,
            y: centerY * size.height - radiusX,
            width: radiusX * 2,
            height: radiusX * 2
        )
    }
}
