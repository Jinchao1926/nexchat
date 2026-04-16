import Foundation

public enum MessageRole: String, Codable, Equatable, Sendable {
    case user
    case assistant
    case system
}

public enum MessageStatus: String, Codable, Equatable, Sendable {
    case pending
    case streaming
    case completed
    case failed
}

public struct ConversationMessage: Codable, Equatable, Identifiable, Hashable, Sendable {
    public let id: String
    public let conversationID: String
    public let userID: String
    public let role: MessageRole
    public let content: String
    public let status: MessageStatus
    public let provider: String?
    public let model: String?
    public let error: String?
    public let createdAt: String
    public let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case conversationID = "conversationId"
        case userID = "userId"
        case role
        case content
        case status
        case provider
        case model
        case error
        case createdAt
        case updatedAt
    }

    public init(
        id: String,
        conversationID: String,
        userID: String,
        role: MessageRole,
        content: String,
        status: MessageStatus,
        provider: String?,
        model: String?,
        error: String?,
        createdAt: String,
        updatedAt: String
    ) {
        self.id = id
        self.conversationID = conversationID
        self.userID = userID
        self.role = role
        self.content = content
        self.status = status
        self.provider = provider
        self.model = model
        self.error = error
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decodeLossyString(forKey: .id)
        conversationID = try container.decodeLossyString(forKey: .conversationID)
        userID = try container.decode(String.self, forKey: .userID)
        role = try container.decode(MessageRole.self, forKey: .role)
        content = try container.decode(String.self, forKey: .content)
        status = try container.decode(MessageStatus.self, forKey: .status)
        provider = try container.decodeIfPresent(String.self, forKey: .provider)
        model = try container.decodeIfPresent(String.self, forKey: .model)
        error = try container.decodeIfPresent(String.self, forKey: .error)
        createdAt = try container.decode(String.self, forKey: .createdAt)
        updatedAt = try container.decode(String.self, forKey: .updatedAt)
    }
}
