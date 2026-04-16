import NexchatCore
import SwiftUI

struct ContentView: View {
    @ObservedObject var sessionStore: AppSessionStore
    let dependencies: AppDependencies

    var body: some View {
        Group {
            if sessionStore.isAuthenticated {
                MainTabView(
                    conversationService: dependencies.conversationService,
                    messageService: dependencies.messageService
                )
            } else {
                AuthView(
                    authService: dependencies.authService,
                    sessionStore: sessionStore
                )
            }
        }
        .animation(.smooth, value: sessionStore.isAuthenticated)
    }
}
