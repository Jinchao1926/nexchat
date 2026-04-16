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

    @Test("message list view model sends first message and upgrades draft conversation")
    func sendFirstMessage() async throws {
        var upsertedConversation: Conversation?
        let service = MockMessageService(
            streamHandler: { content, conversationID in
                #expect(content == "Hello from draft")
                #expect(conversationID == nil)

                return AsyncThrowingStream { continuation in
                    continuation.yield(
                        .start(
                            conversationID: "42",
                            userMessageID: "201",
                            assistantMessageID: "202",
                            provider: "ollama",
                            model: "qwen3"
                        )
                    )
                    continuation.yield(.delta("Hi"))
                    continuation.yield(.delta(" there"))
                    continuation.yield(.done(assistantMessageID: "202"))
                    continuation.finish()
                }
            }
        )
        let viewModel = MessageListViewModel(
            service: service,
            conversation: .draft(),
            onConversationUpsert: { conversation in
                upsertedConversation = conversation
            }
        )
        viewModel.composerText = "Hello from draft"

        await viewModel.sendMessage()

        #expect(viewModel.conversation.id == "42")
        #expect(viewModel.conversation.title == "Hello from draft")
        #expect(upsertedConversation?.id == "42")
        #expect(viewModel.messages.count == 2)
        #expect(viewModel.messages[0].id == "201")
        #expect(viewModel.messages[0].role == .user)
        #expect(viewModel.messages[1].id == "202")
        #expect(viewModel.messages[1].role == .assistant)
        #expect(viewModel.messages[1].content == "Hi there")
        #expect(viewModel.messages[1].status == .completed)
        #expect(viewModel.isSending == false)
        #expect(viewModel.composerText.isEmpty)
    }

    @Test("message list view model keeps failed assistant bubble with inline error")
    func sendMessageFailure() async throws {
        let service = MockMessageService(
            streamHandler: { _, _ in
                AsyncThrowingStream { continuation in
                    continuation.yield(
                        .start(
                            conversationID: "42",
                            userMessageID: "301",
                            assistantMessageID: "302",
                            provider: "ollama",
                            model: "qwen3"
                        )
                    )
                    continuation.yield(.delta("partial"))
                    continuation.finish(throwing: APIError.transport(message: "stream failed"))
                }
            }
        )
        let viewModel = MessageListViewModel(
            service: service,
            conversation: .init(id: "42", userID: "u1", title: "Inbox", createdAt: "2026-04-16T09:00:00Z", updatedAt: "2026-04-16T10:00:00Z")
        )
        viewModel.composerText = "hello"

        await viewModel.sendMessage()

        #expect(viewModel.messages.count == 2)
        #expect(viewModel.messages[1].status == .failed)
        #expect(viewModel.messages[1].content == "partial")
        #expect(viewModel.messages[1].error == "stream failed")
        #expect(viewModel.isSending == false)
    }

    @Test("message list view model explains ollama connection failures")
    func sendMessageOllamaConnectionFailure() async throws {
        let service = MockMessageService(
            streamHandler: { _, _ in
                AsyncThrowingStream { continuation in
                    continuation.yield(.error("fetch failed"))
                    continuation.finish()
                }
            }
        )
        let viewModel = MessageListViewModel(
            service: service,
            conversation: .init(id: "42", userID: "u1", title: "Inbox", createdAt: "2026-04-16T09:00:00Z", updatedAt: "2026-04-16T10:00:00Z")
        )
        viewModel.composerText = "hello"

        await viewModel.sendMessage()

        #expect(viewModel.messages.count == 2)
        #expect(viewModel.messages[1].status == .failed)
        #expect(viewModel.messages[1].error == "无法连接 Ollama 服务，请确认 Ollama 已启动后再试。")
    }
}
