import Combine
import Foundation

@MainActor
public final class ConversationListViewModel: ObservableObject {
    @Published public private(set) var conversations: [Conversation] = []
    @Published public private(set) var isLoading = false
    @Published public private(set) var errorMessage: String?
    @Published public var newConversationTitle = ""
    @Published public var isCreateSheetPresented = false
    @Published public private(set) var pendingNavigationConversationID: String?

    private let service: ConversationServiceProtocol

    public init(service: ConversationServiceProtocol) {
        self.service = service
    }

    public func loadConversations() async {
        isLoading = true
        defer { isLoading = false }

        do {
            conversations = try await service.fetchConversations()
            errorMessage = nil
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    public func createConversation() async {
        let title = newConversationTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else {
            errorMessage = "Please enter a conversation title."
            return
        }

        do {
            let conversation = try await service.createConversation(title: title)
            conversations.removeAll(where: { $0.id == conversation.id })
            conversations.insert(conversation, at: 0)
            newConversationTitle = ""
            isCreateSheetPresented = false
            pendingNavigationConversationID = conversation.id
            errorMessage = nil
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    public func consumePendingNavigationConversationID() -> String? {
        defer { pendingNavigationConversationID = nil }
        return pendingNavigationConversationID
    }
}
