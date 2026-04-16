import Foundation

public protocol AuthServiceProtocol: Sendable {
    func signIn(email: String, password: String) async throws -> AppSession
    func signUp(name: String, email: String, password: String) async throws -> AppSession
}

public final class AuthService: AuthServiceProtocol {
    private let client: APIClient

    public init(client: APIClient = APIClient()) {
        self.client = client
    }

    public func signIn(email: String, password: String) async throws -> AppSession {
        try await client.post(
            "sign-in/email",
            body: AuthPayload(email: email, password: password, name: nil),
            baseURL: client.config.authBaseURL
        )
    }

    public func signUp(name: String, email: String, password: String) async throws -> AppSession {
        try await client.post(
            "sign-up/email",
            body: AuthPayload(email: email, password: password, name: name),
            baseURL: client.config.authBaseURL
        )
    }
}

private struct AuthPayload: Encodable {
    let email: String
    let password: String
    let name: String?
}
