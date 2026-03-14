// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "LatentCamera",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "LatentCamera",
            targets: ["LatentCameraPlugin"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0"),
        .package(url: "https://github.com/MetalPetal/MetalPetal.git", branch: "master")
    ],
    targets: [
        .target(
            name: "LatentCameraPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "MetalPetal", package: "MetalPetal")
            ],
            path: "ios/Plugin"
        )
    ]
)
