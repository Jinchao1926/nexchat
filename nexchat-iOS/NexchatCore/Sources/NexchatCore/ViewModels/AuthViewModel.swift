import Combine
import Foundation

@MainActor
public final class AuthViewModel: ObservableObject {
    public enum Mode: String, CaseIterable, Identifiable {
        case signIn
        case signUp

        public var id: String { rawValue }
    }

    @Published public var mode: Mode = .signIn
    @Published public var name = ""
    @Published public var email = ""
    @Published public var password = ""
    @Published public private(set) var isSubmitting = false
    @Published public private(set) var errorMessage: String?

    private let authService: AuthServiceProtocol
    private let sessionStore: AppSessionStore

    public init(authService: AuthServiceProtocol, sessionStore: AppSessionStore) {
        self.authService = authService
        self.sessionStore = sessionStore
    }

    public func submit() async {
        errorMessage = validate()

        guard errorMessage == nil else {
            return
        }

        isSubmitting = true
        defer { isSubmitting = false }

        do {
            let session: AppSession
            switch mode {
            case .signIn:
                session = try await authService.signIn(email: email.trimmingCharacters(in: .whitespacesAndNewlines), password: password)
            case .signUp:
                session = try await authService.signUp(
                    name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                    email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                    password: password
                )
            }

            sessionStore.update(session: session)
            errorMessage = nil
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    private func validate() -> String? {
        if mode == .signUp && name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return "Please enter your display name."
        }

        if !email.contains("@") {
            return "Please enter a valid email."
        }

        if password.count < 6 {
            return "Password must be at least 6 characters."
        }

        return nil
    }
}
