import NexchatCore

struct AppDependencies {
    let authService: any AuthServiceProtocol
    let conversationService: any ConversationServiceProtocol
    let messageService: any MessageServiceProtocol

    static let live: AppDependencies = {
        let client = APIClient()
        return AppDependencies(
            authService: AuthService(client: client),
            conversationService: ConversationService(client: client),
            messageService: MessageService(client: client)
        )
    }()
}
