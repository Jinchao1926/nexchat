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

        await streamAssistantReply(
            content: content,
            pendingUserMessageID: userMessage.id,
            pendingAssistantMessageID: assistantMessage.id
        )
    }

    public func retryLastFailedAssistantMessage() async {
        guard !isSending,
              let assistantMessage = messages.last,
              assistantMessage.role == .assistant,
              assistantMessage.status == .failed,
              let userIndex = messages.dropLast().lastIndex(where: { $0.role == .user }) else {
            return
        }

        let userMessage = messages[userIndex]
        isSending = true
        clearAssistantFailure(messageID: assistantMessage.id)

        await streamAssistantReply(
            content: userMessage.content,
            pendingUserMessageID: userMessage.id,
            pendingAssistantMessageID: assistantMessage.id
        )
    }

    public func canRetryAssistantMessage(_ message: ConversationMessage) -> Bool {
        !isSending &&
            message.role == .assistant &&
            message.status == .failed &&
            message.id == messages.last?.id
    }

    private func streamAssistantReply(
        content: String,
        pendingUserMessageID: String,
        pendingAssistantMessageID: String
    ) async {
        var activeAssistantMessageID = pendingAssistantMessageID

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
                        pendingUserMessageID: pendingUserMessageID,
                        userMessageID: userMessageID,
                        pendingAssistantMessageID: activeAssistantMessageID,
                        assistantMessageID: assistantMessageID,
                        provider: provider,
                        model: model
                    )
                    activeAssistantMessageID = assistantMessageID
                case let .delta(delta):
                    updateMessage(matchingID: activeAssistantMessageID) { message in
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
                    updateMessage(matchingID: assistantMessageID) { message in
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
                    markAssistantMessageFailed(
                        messageID: activeAssistantMessageID,
                        error: Self.userFacingStreamError(message)
                    )
                }
            }
        } catch {
            let message = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            markAssistantMessageFailed(
                messageID: activeAssistantMessageID,
                error: Self.userFacingStreamError(message)
            )
        }

        isSending = false
    }

    private func handleStartEvent(
        conversationID: String,
        titleSource: String,
        pendingUserMessageID: String,
        userMessageID: String,
        pendingAssistantMessageID: String,
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

        updateMessage(matchingID: pendingUserMessageID) { message in
            ConversationMessage(
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

        updateMessage(matchingID: pendingAssistantMessageID) { message in
            ConversationMessage(
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

    private func updateMessage(
        matchingID: String,
        transform: (ConversationMessage) -> ConversationMessage
    ) {
        guard let index = messages.lastIndex(where: { $0.id == matchingID }) else {
            return
        }

        let original = messages[index]
        let updated = transform(original)
        messages[index] = updated
    }

    private func clearAssistantFailure(messageID: String) {
        updateMessage(matchingID: messageID) { message in
            ConversationMessage(
                id: message.id,
                conversationID: message.conversationID,
                userID: message.userID,
                role: message.role,
                content: "",
                status: .streaming,
                provider: message.provider,
                model: message.model,
                error: nil,
                createdAt: message.createdAt,
                updatedAt: Self.timestampString()
            )
        }
    }

    private func markAssistantMessageFailed(
        messageID: String,
        error: String
    ) {
        updateMessage(matchingID: messageID) { message in
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

        if normalized == "stream timed out" {
            return "响应超时，请检查网络连接后重试。"
        }

        return message
    }

    private static func timestampString() -> String {
        ISO8601DateFormatter().string(from: Date())
    }
}
