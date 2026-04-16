import Combine
import Foundation

@MainActor
public final class MessageListViewModel: ObservableObject {
    @Published public private(set) var messages: [ConversationMessage] = []
    @Published public private(set) var isLoading = false
    @Published public private(set) var errorMessage: String?

    public let conversation: Conversation

    private let service: MessageServiceProtocol

    public init(service: MessageServiceProtocol, conversation: Conversation) {
        self.service = service
        self.conversation = conversation
    }

    public func loadMessages() async {
        isLoading = true
        defer { isLoading = false }

        do {
            messages = try await service.fetchMessages(conversationID: conversation.id)
            errorMessage = nil
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}
