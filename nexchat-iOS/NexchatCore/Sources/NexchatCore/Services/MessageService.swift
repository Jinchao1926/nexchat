import Foundation

private struct MessageListResponse: Decodable {
    let data: [ConversationMessage]
}

private struct StreamAiChatPayload: Encodable {
    let content: String
    let conversationId: String?
}

private struct StreamStartPayload: Decodable {
    let conversationId: Int
    let userMessageId: Int
    let assistantMessageId: Int
    let provider: String
    let model: String
}

private struct StreamDeltaPayload: Decodable {
    let content: String
}

private struct StreamDonePayload: Decodable {
    let assistantMessageId: Int
}

private struct StreamErrorPayload: Decodable {
    let message: String
}

public enum MessageStreamEvent: Equatable, Sendable {
    case start(
        conversationID: String,
        userMessageID: String,
        assistantMessageID: String,
        provider: String,
        model: String
    )
    case delta(String)
    case done(assistantMessageID: String)
    case error(String)
}

public protocol MessageServiceProtocol: Sendable {
    func fetchMessages(conversationID: String) async throws -> [ConversationMessage]
    func streamMessage(
        content: String,
        conversationID: String?
    ) throws -> AsyncThrowingStream<MessageStreamEvent, Error>
}

public final class MessageService: MessageServiceProtocol {
    private let client: APIClient
    private let decoder = JSONDecoder()

    public init(client: APIClient = APIClient()) {
        self.client = client
    }

    public func fetchMessages(conversationID: String) async throws -> [ConversationMessage] {
        let response: MessageListResponse = try await client.get("conversations/\(conversationID)/messages")
        return response.data
    }

    public func streamMessage(
        content: String,
        conversationID: String?
    ) throws -> AsyncThrowingStream<MessageStreamEvent, Error> {
        let lines = try client.stream(
            "ai/stream",
            body: StreamAiChatPayload(
                content: content,
                conversationId: conversationID
            )
        )

        return AsyncThrowingStream { continuation in
            let task = Task {
                do {
                    var eventName: String?
                    var dataLines: [String] = []

                    for try await line in lines {
                        if line.isEmpty {
                            try yieldEventIfNeeded(
                                eventName: &eventName,
                                dataLines: &dataLines,
                                continuation: continuation
                            )
                            continue
                        }

                        if let value = line.removingPrefix("event:") {
                            try yieldEventIfNeeded(
                                eventName: &eventName,
                                dataLines: &dataLines,
                                continuation: continuation
                            )
                            eventName = value.trimmingCharacters(in: .whitespaces)
                            continue
                        }

                        if let value = line.removingPrefix("data:") {
                            dataLines.append(value.trimmingCharacters(in: .whitespaces))
                        }
                    }

                    try yieldEventIfNeeded(
                        eventName: &eventName,
                        dataLines: &dataLines,
                        continuation: continuation
                    )
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }

            continuation.onTermination = { _ in
                task.cancel()
            }
        }
    }

    private func yieldEventIfNeeded(
        eventName: inout String?,
        dataLines: inout [String],
        continuation: AsyncThrowingStream<MessageStreamEvent, Error>.Continuation
    ) throws {
        defer {
            eventName = nil
            dataLines.removeAll(keepingCapacity: true)
        }

        guard let eventName else {
            return
        }

        let payload = dataLines.joined(separator: "\n")

        switch eventName {
        case "start":
            let decoded = try decoder.decode(StreamStartPayload.self, from: Data(payload.utf8))
            continuation.yield(
                .start(
                    conversationID: String(decoded.conversationId),
                    userMessageID: String(decoded.userMessageId),
                    assistantMessageID: String(decoded.assistantMessageId),
                    provider: decoded.provider,
                    model: decoded.model
                )
            )
        case "delta":
            let decoded = try decoder.decode(StreamDeltaPayload.self, from: Data(payload.utf8))
            continuation.yield(.delta(decoded.content))
        case "done":
            let decoded = try decoder.decode(StreamDonePayload.self, from: Data(payload.utf8))
            continuation.yield(.done(assistantMessageID: String(decoded.assistantMessageId)))
        case "error":
            let decoded = try decoder.decode(StreamErrorPayload.self, from: Data(payload.utf8))
            continuation.yield(.error(decoded.message))
        default:
            return
        }
    }
}

private extension String {
    func removingPrefix(_ prefix: String) -> String? {
        guard hasPrefix(prefix) else {
            return nil
        }

        return String(dropFirst(prefix.count))
    }
}
