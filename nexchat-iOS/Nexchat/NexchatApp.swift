import NexchatCore
import SwiftUI

@main
struct NexchatApp: App {
    @StateObject private var sessionStore = AppSessionStore()
    private let dependencies = AppDependencies.live

    var body: some Scene {
        WindowGroup {
            ContentView(sessionStore: sessionStore, dependencies: dependencies)
        }
    }
}
