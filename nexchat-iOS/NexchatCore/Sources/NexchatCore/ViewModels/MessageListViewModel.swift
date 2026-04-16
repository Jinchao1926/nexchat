import Combine
import Foundation

@MainActor
public final class MessageListViewModel: ObservableObject {
    @Published public private(set) var messages: [ConversationMessage] = []
    @Published public private(set) var isLoading = false
    @Published public private(set) var isSending = false
    @Published public private(set) var errorMessage: String?
    @Published public var composerText = ""

    @Published public private(set) var conversation: Conversation

    private let service: MessageServiceProtocol
    private let onConversationUpsert: ((Conversation) -> Void)?

    public init(
        service: MessageServiceProtocol,
        conversation: Conversation,
        onConversationUpsert: ((Conversation) -> Void)? = nil
    ) {
        self.service = service
        self.conversation = conversation
        self.onConversationUpsert = onConversationUpsert
    }

    public func loadMessages() async {
        guard !conversation.isDraft else {
            messages = []
            errorMessage = nil
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            messages = try await service.fetchMessages(conversationID: conversation.id).reversed()
            errorMessage = nil
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    public func sendMessage() async {
        let content = composerText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !content.isEmpty, !isSending else {
            return
        }

        isSending = true
        composerText = ""

        let currentConversationID = conversation.id
        let timestamp = Self.timestampString()
        let userMessage = ConversationMessage(
            id: "local-user-\(UUID().uuidString)",
            conversationID: currentConversationID,
            userID: conversation.userID,
            role: .user,
            content: content,
            status: .completed,
            provider: nil,
            model: nil,
            error: nil,
            createdAt: timestamp,
            updatedAt: timestamp
        )
        let assistantMessage = ConversationMessage(
            id: "local-assistant-\(UUID().uuidString)",
            conversationID: currentConversationID,
            userID: conversation.userID,
            role: .assistant,
            content: "",
            status: .streaming,
            provider: nil,
            model: nil,
            error: nil,
            createdAt: timestamp,
            updatedAt: timestamp
        )

        messages.append(userMessage)
        messages.append(assistantMessage)

        do {
            let stream = try service.streamMessage(
                content: content,
                conversationID: conversation.isDraft ? nil : conversation.id
            )

            for try await event in stream {
                switch event {
                case let .start(conversationID, userMessageID, assistantMessageID, provider, model):
                    handleStartEvent(
                        conversationID: conversationID,
                        titleSource: content,
                        userMessageID: userMessageID,
                        assistantMessageID: assistantMessageID,
                        provider: provider,
                        model: model
                    )
                case let .delta(delta):
                    updateAssistantMessage { message in
                        ConversationMessage(
                            id: message.id,
                            conversationID: message.conversationID,
                            userID: message.userID,
                            role: message.role,
                            content: message.content + delta,
                            status: .streaming,
                            provider: message.provider,
                            model: message.model,
                            error: nil,
                            createdAt: message.createdAt,
                            updatedAt: Self.timestampString()
                        )
                    }
                case let .done(assistantMessageID):
                    updateAssistantMessage(expectedID: assistantMessageID) { message in
                        ConversationMessage(
                            id: message.id,
                            conversationID: message.conversationID,
                            userID: message.userID,
                            role: message.role,
                            content: message.content,
                            status: .completed,
                            provider: message.provider,
                            model: message.model,
                            error: nil,
                            createdAt: message.createdAt,
                            updatedAt: Self.timestampString()
                        )
                    }
                case let .error(message):
                    markAssistantMessageFailed(Self.userFacingStreamError(message))
                }
            }
        } catch {
            let message = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            markAssistantMessageFailed(Self.userFacingStreamError(message))
        }

        isSending = false
    }

    private func handleStartEvent(
        conversationID: String,
        titleSource: String,
        userMessageID: String,
        assistantMessageID: String,
        provider: String,
        model: String
    ) {
        let updatedConversation = Conversation(
            id: conversationID,
            userID: conversation.userID,
            title: conversation.isDraft ? Self.makeConversationTitle(from: titleSource) : conversation.title,
            createdAt: conversation.createdAt,
            updatedAt: Self.timestampString()
        )
        conversation = updatedConversation
        onConversationUpsert?(updatedConversation)

        if let userIndex = messages.lastIndex(where: { $0.role == .user }) {
            let message = messages[userIndex]
            messages[userIndex] = ConversationMessage(
                id: userMessageID,
                conversationID: conversationID,
                userID: message.userID,
                role: message.role,
                content: message.content,
                status: message.status,
                provider: message.provider,
                model: message.model,
                error: message.error,
                createdAt: message.createdAt,
                updatedAt: Self.timestampString()
            )
        }

        if let assistantIndex = messages.lastIndex(where: { $0.role == .assistant }) {
            let message = messages[assistantIndex]
            messages[assistantIndex] = ConversationMessage(
                id: assistantMessageID,
                conversationID: conversationID,
                userID: message.userID,
                role: message.role,
                content: message.content,
                status: .streaming,
                provider: provider,
                model: model,
                error: nil,
                createdAt: message.createdAt,
                updatedAt: Self.timestampString()
            )
        }
    }

    private func updateAssistantMessage(
        expectedID: String? = nil,
        transform: (ConversationMessage) -> ConversationMessage
    ) {
        guard let index = messages.lastIndex(where: { message in
            guard message.role == .assistant else {
                return false
            }

            guard let expectedID else {
                return true
            }

            return message.id == expectedID
        }) else {
            return
        }

        let original = messages[index]
        let updated = transform(original)
        messages[index] = updated
    }

    private func markAssistantMessageFailed(_ error: String) {
        updateAssistantMessage { message in
            ConversationMessage(
                id: message.id,
                conversationID: message.conversationID,
                userID: message.userID,
                role: message.role,
                content: message.content,
                status: .failed,
                provider: message.provider,
                model: message.model,
                error: error,
                createdAt: message.createdAt,
                updatedAt: Self.timestampString()
            )
        }
    }

    private static func makeConversationTitle(from content: String) -> String {
        let normalized = content
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)

        let truncated = String(normalized.prefix(20)).trimmingCharacters(in: .whitespacesAndNewlines)
        return truncated.isEmpty ? "New Chat" : truncated
    }

    private static func userFacingStreamError(_ message: String) -> String {
        let normalized = message.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

        if normalized == "fetch failed" || normalized.contains("ollama") {
            return "无法连接 Ollama 服务，请确认 Ollama 已启动后再试。"
        }

        return message
    }

    private static func timestampString() -> String {
        ISO8601DateFormatter().string(from: Date())
    }
}
