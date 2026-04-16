import NexchatCore
import SwiftUI

struct MainTabView: View {
    let conversationService: any ConversationServiceProtocol
    let messageService: any MessageServiceProtocol

    var body: some View {
        TabView {
            ConversationListView(
                conversationService: conversationService,
                messageService: messageService
            )
            .tabItem {
                Label("会话", systemImage: "message")
            }

            MinePlaceholderView()
                .tabItem {
                    Label("我的", systemImage: "person")
                }
        }
    }
}
