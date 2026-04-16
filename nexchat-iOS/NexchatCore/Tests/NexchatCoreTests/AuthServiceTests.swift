import Foundation
import Testing
@testable import NexchatCore

@Suite("Auth service")
struct AuthServiceTests {
    @Test("sign in posts credentials and decodes user")
    func signIn() async throws {
        let recorder = RequestRecorder()
        let baseURL = URL(string: "http://auth-signin.local/api/v1")!
        let client = APIClient(
            config: APIConfig(baseURL: baseURL),
            transport: { request in
                recorder.append(request)
                #expect(request.url?.absoluteString == "http://auth-signin.local/api/v1/auth/sign-in/email")
                #expect(request.httpMethod == "POST")
                #expect(request.value(forHTTPHeaderField: "Origin") == "http://auth-signin.local")
                let body = try request.httpBodyJSON()
                #expect(body["email"] as? String == "user@example.com")
                #expect(body["password"] as? String == "123456")

                return try makeHTTPResponse(
                    url: request.url,
                    statusCode: 200,
                    body: """
                    {
                      "user": {
                        "email": "user@example.com",
                        "name": "Test User",
                        "image": null
                      }
                    }
                    """
                )
            }
        )

        let service = AuthService(client: client)
        let session = try await service.signIn(email: "user@example.com", password: "123456")

        #expect(session.user.email == "user@example.com")
        #expect(session.user.name == "Test User")
        #expect(recorder.requests.count == 1)
    }

    @Test("sign up posts name email and password")
    func signUp() async throws {
        let baseURL = URL(string: "http://auth-signup.local/api/v1")!
        let client = APIClient(
            config: APIConfig(baseURL: baseURL),
            transport: { request in
                #expect(request.url?.absoluteString == "http://auth-signup.local/api/v1/auth/sign-up/email")
                let body = try request.httpBodyJSON()
                #expect(body["name"] as? String == "New User")
                #expect(body["email"] as? String == "new@example.com")
                #expect(body["password"] as? String == "123456")

                return try makeHTTPResponse(
                    url: request.url,
                    statusCode: 200,
                    body: """
                    {
                      "user": {
                        "email": "new@example.com",
                        "name": "New User",
                        "image": null
                      }
                    }
                    """
                )
            }
        )

        let service = AuthService(client: client)
        let session = try await service.signUp(
            name: "New User",
            email: "new@example.com",
            password: "123456"
        )

        #expect(session.user.email == "new@example.com")
        #expect(session.user.name == "New User")
    }
}
