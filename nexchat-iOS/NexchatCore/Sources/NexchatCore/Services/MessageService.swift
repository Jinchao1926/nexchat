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
    private let streamIdleTimeoutNanoseconds: UInt64
    private let maxInitialRetryCount: Int
    private let initialRetryDelayNanoseconds: UInt64

    public init(
        client: APIClient = APIClient(),
        streamIdleTimeoutNanoseconds: UInt64 = 20_000_000_000,
        maxInitialRetryCount: Int = 1,
        initialRetryDelayNanoseconds: UInt64 = 800_000_000
    ) {
        self.client = client
        self.streamIdleTimeoutNanoseconds = streamIdleTimeoutNanoseconds
        self.maxInitialRetryCount = maxInitialRetryCount
        self.initialRetryDelayNanoseconds = initialRetryDelayNanoseconds
    }

    public func fetchMessages(conversationID: String) async throws -> [ConversationMessage] {
        let response: MessageListResponse = try await client.get("conversations/\(conversationID)/messages")
        return response.data
    }

    public func streamMessage(
        content: String,
        conversationID: String?
    ) throws -> AsyncThrowingStream<MessageStreamEvent, Error> {
        return AsyncThrowingStream { continuation in
            let task = Task {
                var retryCount = 0

                while !Task.isCancelled {
                    do {
                        try await consumeStreamAttempt(
                            content: content,
                            conversationID: conversationID,
                            continuation: continuation
                        )
                        continuation.finish()
                        return
                    } catch let error as StreamAttemptFailure {
                        guard shouldRetry(error.underlyingError, receivedFirstEvent: error.receivedFirstEvent, retryCount: retryCount) else {
                            continuation.finish(throwing: error.underlyingError)
                            return
                        }
                    } catch {
                        guard shouldRetry(error, receivedFirstEvent: false, retryCount: retryCount) else {
                            continuation.finish(throwing: error)
                            return
                        }
                    }

                    retryCount += 1

                    if initialRetryDelayNanoseconds > 0 {
                        try? await Task.sleep(nanoseconds: initialRetryDelayNanoseconds)
                    }
                }
            }

            continuation.onTermination = { _ in
                task.cancel()
            }
        }
    }

    // 首包超时保护
    private func consumeStreamAttempt(
        content: String,
        conversationID: String?,
        continuation: AsyncThrowingStream<MessageStreamEvent, Error>.Continuation
    ) async throws {
        let lines = try client.stream(
            "ai/stream",
            body: StreamAiChatPayload(
                content: content,
                conversationId: conversationID
            )
        )
        let state = StreamAttemptState()

        try await withThrowingTaskGroup(of: Void.self) { group in
            group.addTask {
                do {
                    var eventName: String?
                    var dataLines: [String] = []

                    for try await line in lines {
                        if line.isEmpty {
                            if try self.yieldEventIfNeeded(
                                eventName: &eventName,
                                dataLines: &dataLines,
                                continuation: continuation
                            ) {
                                await state.markReceivedFirstEvent()
                            }
                            continue
                        }

                        if let value = line.removingPrefix("event:") {
                            if try self.yieldEventIfNeeded(
                                eventName: &eventName,
                                dataLines: &dataLines,
                                continuation: continuation
                            ) {
                                await state.markReceivedFirstEvent()
                            }
                            eventName = value.trimmingCharacters(in: .whitespaces)
                            continue
                        }

                        if let value = line.removingPrefix("data:") {
                            dataLines.append(value.trimmingCharacters(in: .whitespaces))
                        }
                    }

                    if try self.yieldEventIfNeeded(
                        eventName: &eventName,
                        dataLines: &dataLines,
                        continuation: continuation
                    ) {
                        await state.markReceivedFirstEvent()
                    }
                } catch {
                    throw StreamAttemptFailure(
                        underlyingError: error,
                        receivedFirstEvent: await state.receivedFirstEvent
                    )
                }
            }

            group.addTask {
                while !Task.isCancelled {
                    try await Task.sleep(nanoseconds: self.streamIdleTimeoutNanoseconds)

                    let receivedFirstEvent = await state.receivedFirstEvent
                    if !receivedFirstEvent {
                        throw StreamAttemptFailure(
                            underlyingError: APIError.transport(message: "Stream timed out"),
                            receivedFirstEvent: false
                        )
                    }
                }
            }

            _ = try await group.next()
            group.cancelAll()
        }
    }

    private func shouldRetry(_ error: Error, receivedFirstEvent: Bool, retryCount: Int) -> Bool {
        guard !receivedFirstEvent, retryCount < maxInitialRetryCount else {
            return false
        }

        if case APIError.server = error {
            return false
        }

        return true
    }

    private func yieldEventIfNeeded(
        eventName: inout String?,
        dataLines: inout [String],
        continuation: AsyncThrowingStream<MessageStreamEvent, Error>.Continuation
    ) throws -> Bool {
        defer {
            eventName = nil
            dataLines.removeAll(keepingCapacity: true)
        }

        guard let eventName else {
            return false
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
            return true
        case "delta":
            let decoded = try decoder.decode(StreamDeltaPayload.self, from: Data(payload.utf8))
            continuation.yield(.delta(decoded.content))
            return true
        case "done":
            let decoded = try decoder.decode(StreamDonePayload.self, from: Data(payload.utf8))
            continuation.yield(.done(assistantMessageID: String(decoded.assistantMessageId)))
            return true
        case "error":
            let decoded = try decoder.decode(StreamErrorPayload.self, from: Data(payload.utf8))
            continuation.yield(.error(decoded.message))
            return true
        default:
            return false
        }
    }
}

private struct StreamAttemptFailure: Error {
    let underlyingError: Error
    let receivedFirstEvent: Bool
}

private actor StreamAttemptState {
    private(set) var receivedFirstEvent = false

    func markReceivedFirstEvent() {
        receivedFirstEvent = true
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
