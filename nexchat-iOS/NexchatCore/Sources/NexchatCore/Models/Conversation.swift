import Foundation

public struct Conversation: Codable, Equatable, Identifiable, Hashable, Sendable {
    public let id: String
    public let userID: String
    public let title: String
    public let createdAt: String
    public let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case userID = "userId"
        case title
        case createdAt
        case updatedAt
    }

    public init(id: String, userID: String, title: String, createdAt: String, updatedAt: String) {
        self.id = id
        self.userID = userID
        self.title = title
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decodeLossyString(forKey: .id)
        userID = try container.decode(String.self, forKey: .userID)
        title = try container.decode(String.self, forKey: .title)
        createdAt = try container.decode(String.self, forKey: .createdAt)
        updatedAt = try container.decode(String.self, forKey: .updatedAt)
    }
}

public extension Conversation {
    static func draft(title: String = "新会话") -> Conversation {
        let timestamp = ISO8601DateFormatter().string(from: Date())
        return Conversation(
            id: "draft:\(UUID().uuidString)",
            userID: "",
            title: title,
            createdAt: timestamp,
            updatedAt: timestamp
        )
    }

    var isDraft: Bool {
        id.hasPrefix("draft:")
    }
}
