import Foundation

private struct ConversationListResponse: Decodable {
    let data: [Conversation]
}

private struct ConversationResponse: Decodable {
    let data: Conversation
}

public protocol ConversationServiceProtocol: Sendable {
    func fetchConversations() async throws -> [Conversation]
    func createConversation(title: String) async throws -> Conversation
}

public final class ConversationService: ConversationServiceProtocol {
    private let client: APIClient

    public init(client: APIClient = APIClient()) {
        self.client = client
    }

    public func fetchConversations() async throws -> [Conversation] {
        let response: ConversationListResponse = try await client.get("conversations")
        return response.data
    }

    public func createConversation(title: String) async throws -> Conversation {
        let response: ConversationResponse = try await client.post(
            "conversations",
            body: CreateConversationPayload(title: title)
        )
        return response.data
    }
}

private struct CreateConversationPayload: Encodable {
    let title: String
}
