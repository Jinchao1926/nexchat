import Foundation
import Testing
@testable import NexchatCore

@Suite("Message service")
struct MessageServiceTests {
    @Test("fetch messages decodes conversation messages")
    func fetchMessages() async throws {
        let baseURL = URL(string: "http://messages-list.local/api/v1")!
        let client = APIClient(
            config: APIConfig(baseURL: baseURL),
            transport: { request in
                #expect(request.url?.absoluteString == "http://messages-list.local/api/v1/conversations/42/messages")
                #expect(request.httpMethod == "GET")

                return try makeHTTPResponse(
                    url: request.url,
                    statusCode: 200,
                    body: """
                    {
                      "data": [
                        {
                          "id": 10,
                          "conversationId": 42,
                          "userId": "user-1",
                          "role": "user",
                          "content": "Hello",
                          "status": "completed",
                          "provider": null,
                          "model": null,
                          "error": null,
                          "createdAt": "2026-04-16T10:00:00Z",
                          "updatedAt": "2026-04-16T10:00:00Z"
                        }
                      ]
                    }
                    """
                )
            }
        )

        let service = MessageService(client: client)
        let messages = try await service.fetchMessages(conversationID: "42")

        #expect(messages.count == 1)
        #expect(messages.first?.conversationID == "42")
        #expect(messages.first?.content == "Hello")
    }
}
