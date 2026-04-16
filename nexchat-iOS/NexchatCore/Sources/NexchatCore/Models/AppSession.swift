import Foundation

public struct AppUser: Codable, Equatable, Sendable {
    public let email: String
    public let name: String?
    public let image: String?

    public init(email: String, name: String?, image: String?) {
        self.email = email
        self.name = name
        self.image = image
    }
}

public struct AppSession: Codable, Equatable, Sendable {
    public let user: AppUser

    public init(user: AppUser) {
        self.user = user
    }
}
