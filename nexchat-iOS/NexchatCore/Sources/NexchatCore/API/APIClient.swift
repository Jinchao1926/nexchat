import Alamofire
import Foundation

public struct APIConfig: Sendable {
    public let baseURL: URL

    public init(baseURL: URL = URL(string: "http://localhost:6001/api/v1")!) {
        self.baseURL = baseURL
    }

    public var authBaseURL: URL {
        baseURL.appendingPathComponent("auth")
    }
}

public enum APIError: LocalizedError, Equatable, Sendable {
    case invalidRequest
    case invalidResponse
    case server(message: String)
    case transport(message: String)

    public var errorDescription: String? {
        switch self {
        case .invalidRequest:
            "Invalid request."
        case .invalidResponse:
            "Invalid server response."
        case let .server(message), let .transport(message):
            message
        }
    }
}

private struct ErrorResponse: Decodable {
    let message: String?
}

private struct AnyEncodable: Encodable, @unchecked Sendable {
    private let encodeBlock: (Encoder) throws -> Void

    init(_ value: some Encodable) {
        encodeBlock = value.encode(to:)
    }

    func encode(to encoder: Encoder) throws {
        try encodeBlock(encoder)
    }
}

public final class APIClient: @unchecked Sendable {
    public typealias Transport = @Sendable (URLRequest) async throws -> (Data, HTTPURLResponse)

    public let config: APIConfig
    private let session: Session
    private let decoder: JSONDecoder
    private let transport: Transport?

    public init(
        config: APIConfig = APIConfig(),
        session: Session = .default,
        decoder: JSONDecoder = JSONDecoder(),
        transport: Transport? = nil
    ) {
        self.config = config
        self.session = session
        self.decoder = decoder
        self.transport = transport
    }

    public func get<Response: Decodable>(
        _ path: String,
        baseURL: URL? = nil
    ) async throws -> Response {
        try await request(path, method: .get, body: Optional<EmptyBody>.none, baseURL: baseURL)
    }

    public func post<Body: Encodable, Response: Decodable>(
        _ path: String,
        body: Body,
        baseURL: URL? = nil
    ) async throws -> Response {
        try await request(path, method: .post, body: body, baseURL: baseURL)
    }

    private func request<Body: Encodable, Response: Decodable>(
        _ path: String,
        method: HTTPMethod,
        body: Body?,
        baseURL: URL?
    ) async throws -> Response {
        let requestURL = resolveURL(path: path, baseURL: baseURL)
        if let transport {
            let request = try makeURLRequest(url: requestURL, method: method, body: body)
            let (data, response) = try await transport(request)

            guard (200 ..< 300).contains(response.statusCode) else {
                throw parseError(data: data, statusCode: response.statusCode, fallback: "Request failed")
            }

            do {
                return try decoder.decode(Response.self, from: data)
            } catch {
                throw APIError.transport(message: String(describing: error))
            }
        }

        let dataRequest: DataRequest

        if let body {
            dataRequest = session.request(
                requestURL,
                method: method,
                parameters: AnyEncodable(body),
                encoder: JSONParameterEncoder.default
            )
        } else {
            dataRequest = session.request(requestURL, method: method)
        }

        let response = await dataRequest
            .validate(statusCode: 200 ..< 300)
            .serializingData()
            .response

        if let error = response.error {
            throw parseError(data: response.data, statusCode: response.response?.statusCode, fallback: error.localizedDescription)
        }

        guard let data = response.data else {
            throw APIError.invalidResponse
        }

        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw APIError.transport(message: String(describing: error))
        }
    }

    private func resolveURL(path: String, baseURL: URL?) -> URL {
        let rootURL = baseURL ?? config.baseURL
        return rootURL.appending(path: path.trimmingCharacters(in: CharacterSet(charactersIn: "/")))
    }

    private func makeURLRequest<Body: Encodable>(
        url: URL,
        method: HTTPMethod,
        body: Body?
    ) throws -> URLRequest {
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue

        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(body)
        }

        return request
    }

    private func parseError(data: Data?, statusCode: Int?, fallback: String) -> APIError {
        if let data,
           let payload = try? decoder.decode(ErrorResponse.self, from: data),
           let message = payload.message,
           !message.isEmpty {
            return .server(message: message)
        }

        if let statusCode, statusCode == 401 {
            return .server(message: "Authentication failed")
        }

        return .transport(message: fallback)
    }
}

private struct EmptyBody: Encodable {}
