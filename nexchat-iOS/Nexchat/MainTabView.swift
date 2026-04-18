import NexchatCore
import SwiftUI

struct MainTabView: View {
    @ObservedObject var sessionStore: AppSessionStore
    let conversationService: any ConversationServiceProtocol
    let messageService: any MessageServiceProtocol

    var body: some View {
        TabView {
            ConversationListView(
                conversationService: conversationService,
                messageService: messageService,
                sessionStore: sessionStore
            )
            .tabItem {
                Label("会话", systemImage: "message")
            }

            MinePlaceholderView(sessionStore: sessionStore)
                .tabItem {
                    Label("我的", systemImage: "person")
                }
        }
    }
}
