import Foundation

private struct MessageListResponse: Decodable {
    let data: [ConversationMessage]
}

public protocol MessageServiceProtocol: Sendable {
    func fetchMessages(conversationID: String) async throws -> [ConversationMessage]
}

public final class MessageService: MessageServiceProtocol {
    private let client: APIClient

    public init(client: APIClient = APIClient()) {
        self.client = client
    }

    public func fetchMessages(conversationID: String) async throws -> [ConversationMessage] {
        let response: MessageListResponse = try await client.get("conversations/\(conversationID)/messages")
        return response.data
    }
}
