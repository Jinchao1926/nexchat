import Foundation

@MainActor
public protocol SessionPersistence {
    func loadSession() -> AppSession?
    func save(session: AppSession)
    func clearSession()
}

@MainActor
public final class UserDefaultsSessionPersistence: SessionPersistence {
    private enum Keys {
        static let appSession = "nexchat.app-session"
    }

    private let userDefaults: UserDefaults
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    public init(userDefaults: UserDefaults = .standard) {
        self.userDefaults = userDefaults
    }

    public func loadSession() -> AppSession? {
        guard let data = userDefaults.data(forKey: Keys.appSession) else {
            return nil
        }

        return try? decoder.decode(AppSession.self, from: data)
    }

    public func save(session: AppSession) {
        guard let data = try? encoder.encode(session) else {
            return
        }

        userDefaults.set(data, forKey: Keys.appSession)
    }

    public func clearSession() {
        userDefaults.removeObject(forKey: Keys.appSession)
    }
}
