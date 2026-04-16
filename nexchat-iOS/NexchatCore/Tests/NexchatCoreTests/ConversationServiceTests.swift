import Foundation
import Testing
@testable import NexchatCore

@Suite("Conversation service")
struct ConversationServiceTests {
    @Test("fetch conversations decodes list")
    func fetchConversations() async throws {
        let baseURL = URL(string: "http://conversations-list.local/api/v1")!
        let client = APIClient(
            config: APIConfig(baseURL: baseURL),
            transport: { request in
                #expect(request.url?.absoluteString == "http://conversations-list.local/api/v1/conversations")
                #expect(request.httpMethod == "GET")

                return try makeHTTPResponse(
                    url: request.url,
                    statusCode: 200,
                    body: """
                    {
                      "data": [
                        {
                          "id": 1,
                          "userId": "user-1",
                          "title": "First Chat",
                          "createdAt": "2026-04-16T09:00:00Z",
                          "updatedAt": "2026-04-16T10:00:00Z"
                        }
                      ]
                    }
                    """
                )
            }
        )

        let service = ConversationService(client: client)
        let conversations = try await service.fetchConversations()

        #expect(conversations.count == 1)
        #expect(conversations.first?.id == "1")
        #expect(conversations.first?.title == "First Chat")
    }

    @Test("create conversation posts title")
    func createConversation() async throws {
        let baseURL = URL(string: "http://conversations-create.local/api/v1")!
        let client = APIClient(
            config: APIConfig(baseURL: baseURL),
            transport: { request in
                #expect(request.url?.absoluteString == "http://conversations-create.local/api/v1/conversations")
                #expect(request.httpMethod == "POST")
                let body = try request.httpBodyJSON()
                #expect(body["title"] as? String == "Product ideas")

                return try makeHTTPResponse(
                    url: request.url,
                    statusCode: 201,
                    body: """
                    {
                      "data": {
                        "id": 42,
                        "userId": "user-1",
                        "title": "Product ideas",
                        "createdAt": "2026-04-16T09:00:00Z",
                        "updatedAt": "2026-04-16T10:00:00Z"
                      }
                    }
                    """
                )
            }
        )

        let service = ConversationService(client: client)
        let conversation = try await service.createConversation(title: "Product ideas")

        #expect(conversation.id == "42")
        #expect(conversation.title == "Product ideas")
    }
}
