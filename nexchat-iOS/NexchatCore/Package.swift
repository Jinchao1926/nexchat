// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "NexchatCore",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "NexchatCore",
            targets: ["NexchatCore"]
        )
    ],
    dependencies: [
        .package(path: "../Vendor/Alamofire")
    ],
    targets: [
        .target(
            name: "NexchatCore",
            dependencies: [
                .product(name: "Alamofire", package: "Alamofire")
            ]
        ),
        .testTarget(
            name: "NexchatCoreTests",
            dependencies: ["NexchatCore"]
        )
    ]
)
