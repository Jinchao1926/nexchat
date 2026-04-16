import Foundation
import Testing
@testable import NexchatCore

@MainActor
@Suite("View models")
struct ViewModelTests {
    @Test("auth view model signs in and updates session store")
    func authSubmitSuccess() async throws {
        let sessionStore = AppSessionStore()
        let service = MockAuthService(
            signInHandler: { email, password in
                #expect(email == "user@example.com")
                #expect(password == "123456")
                return AppSession(user: AppUser(email: "user@example.com", name: "User", image: nil))
            }
        )
        let viewModel = AuthViewModel(authService: service, sessionStore: sessionStore)
        viewModel.email = "user@example.com"
        viewModel.password = "123456"

        await viewModel.submit()

        #expect(sessionStore.isAuthenticated)
        #expect(sessionStore.session?.user.email == "user@example.com")
        #expect(viewModel.errorMessage == nil)
    }

    @Test("conversation list view model loads conversations")
    func loadConversations() async throws {
        let service = MockConversationService(
            fetchHandler: {
                [Conversation(id: "1", userID: "u1", title: "Inbox", createdAt: "2026-04-16T09:00:00Z", updatedAt: "2026-04-16T10:00:00Z")]
            }
        )
        let viewModel = ConversationListViewModel(service: service)

        await viewModel.loadConversations()

        #expect(viewModel.conversations.count == 1)
        #expect(viewModel.errorMessage == nil)
    }

    @Test("creating a conversation stores pending navigation id")
    func createConversation() async throws {
        let service = MockConversationService(
            createHandler: { title in
                #expect(title == "New chat")
                return Conversation(
                    id: "12",
                    userID: "u1",
                    title: title,
                    createdAt: "2026-04-16T09:00:00Z",
                    updatedAt: "2026-04-16T10:00:00Z"
                )
            }
        )
        let viewModel = ConversationListViewModel(service: service)
        viewModel.newConversationTitle = "New chat"

        await viewModel.createConversation()

        #expect(viewModel.pendingNavigationConversationID == "12")
        #expect(viewModel.conversations.first?.title == "New chat")
    }

    @Test("message list view model loads messages for conversation")
    func loadMessages() async throws {
        let service = MockMessageService(
            fetchHandler: { conversationID in
                #expect(conversationID == "42")
                return [
                    ConversationMessage(
                        id: "99",
                        conversationID: "42",
                        userID: "u1",
                        role: .assistant,
                        content: "Hi there",
                        status: .completed,
                        provider: nil,
                        model: nil,
                        error: nil,
                        createdAt: "2026-04-16T10:00:00Z",
                        updatedAt: "2026-04-16T10:00:00Z"
                    )
                ]
            }
        )
        let viewModel = MessageListViewModel(service: service, conversation: .init(id: "42", userID: "u1", title: "Inbox", createdAt: "2026-04-16T09:00:00Z", updatedAt: "2026-04-16T10:00:00Z"))

        await viewModel.loadMessages()

        #expect(viewModel.messages.count == 1)
        #expect(viewModel.messages.first?.content == "Hi there")
    }
}
