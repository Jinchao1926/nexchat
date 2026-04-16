import Combine
import Foundation

@MainActor
public final class AppSessionStore: ObservableObject {
    @Published public private(set) var session: AppSession?

    public init(session: AppSession? = nil) {
        self.session = session
    }

    public var isAuthenticated: Bool {
        session != nil
    }

    public func update(session: AppSession) {
        self.session = session
    }

    public func clear() {
        session = nil
    }
}
