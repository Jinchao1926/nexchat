import Combine
import Foundation

@MainActor
public final class AppSessionStore: ObservableObject {
    @Published public private(set) var session: AppSession?
    private let persistence: SessionPersistence

    public init(
        session: AppSession? = nil,
        persistence: SessionPersistence = UserDefaultsSessionPersistence()
    ) {
        self.persistence = persistence
        self.session = session ?? persistence.loadSession()
    }

    public var isAuthenticated: Bool {
        session != nil
    }

    public func update(session: AppSession) {
        self.session = session
        persistence.save(session: session)
    }

    public func clear() {
        session = nil
        persistence.clearSession()
    }
}
