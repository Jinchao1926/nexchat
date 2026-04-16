import Foundation
@testable import NexchatCore

final class RequestRecorder: @unchecked Sendable {
    private(set) var requests: [URLRequest] = []

    func append(_ request: URLRequest) {
        requests.append(request)
    }
}

func makeHTTPResponse(
    url: URL?,
    statusCode: Int,
    body: String
) throws -> (Data, HTTPURLResponse) {
    guard let finalURL = url else {
        throw URLError(.badURL)
    }

    guard let response = HTTPURLResponse(
        url: finalURL,
        statusCode: statusCode,
        httpVersion: nil,
        headerFields: ["Content-Type": "application/json"]
    ) else {
        throw URLError(.badServerResponse)
    }

    return (Data(body.utf8), response)
}

extension URLRequest {
    func httpBodyJSON() throws -> [String: Any] {
        guard let httpBody else {
            throw URLError(.zeroByteResource)
        }

        let value = try JSONSerialization.jsonObject(with: httpBody)
        guard let dictionary = value as? [String: Any] else {
            throw URLError(.cannotParseResponse)
        }

        return dictionary
    }
}

struct MockAuthService: AuthServiceProtocol {
    var signInHandler: @Sendable (String, String) async throws -> AppSession
    var signUpHandler: @Sendable (String, String, String) async throws -> AppSession = { name, email, _ in
        AppSession(user: AppUser(email: email, name: name, image: nil))
    }

    func signIn(email: String, password: String) async throws -> AppSession {
        try await signInHandler(email, password)
    }

    func signUp(name: String, email: String, password: String) async throws -> AppSession {
        try await signUpHandler(name, email, password)
    }
}

struct MockConversationService: ConversationServiceProtocol {
    var fetchHandler: @Sendable () async throws -> [Conversation] = { [] }
    var createHandler: @Sendable (String) async throws -> Conversation = { title in
        Conversation(id: "1", userID: "u1", title: title, createdAt: "", updatedAt: "")
    }

    func fetchConversations() async throws -> [Conversation] {
        try await fetchHandler()
    }

    func createConversation(title: String) async throws -> Conversation {
        try await createHandler(title)
    }
}

struct MockMessageService: MessageServiceProtocol {
    var fetchHandler: @Sendable (String) async throws -> [ConversationMessage] = { _ in [] }

    func fetchMessages(conversationID: String) async throws -> [ConversationMessage] {
        try await fetchHandler(conversationID)
    }
}
