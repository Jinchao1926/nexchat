import Foundation
import Testing
@testable import NexchatCore

@Suite("Message service")
struct MessageServiceTests {
    @Test("fetch messages decodes conversation messages")
    func fetchMessages() async throws {
        let baseURL = URL(string: "http://messages-list.local/api/v1")!
        let client = APIClient(
            config: APIConfig(baseURL: baseURL),
            transport: { request in
                #expect(request.url?.absoluteString == "http://messages-list.local/api/v1/conversations/42/messages")
                #expect(request.httpMethod == "GET")

                return try makeHTTPResponse(
                    url: request.url,
                    statusCode: 200,
                    body: """
                    {
                      "data": [
                        {
                          "id": 10,
                          "conversationId": 42,
                          "userId": "user-1",
                          "role": "user",
                          "content": "Hello",
                          "status": "completed",
                          "provider": null,
                          "model": null,
                          "error": null,
                          "createdAt": "2026-04-16T10:00:00Z",
                          "updatedAt": "2026-04-16T10:00:00Z"
                        }
                      ]
                    }
                    """
                )
            }
        )

        let service = MessageService(client: client)
        let messages = try await service.fetchMessages(conversationID: "42")

        #expect(messages.count == 1)
        #expect(messages.first?.conversationID == "42")
        #expect(messages.first?.content == "Hello")
    }

    @Test("stream message posts ai stream payload and parses sse events")
    func streamMessage() async throws {
        let baseURL = URL(string: "http://messages-stream.local/api/v1")!
        let client = APIClient(
            config: APIConfig(baseURL: baseURL),
            streamTransport: { request in
                #expect(request.url?.absoluteString == "http://messages-stream.local/api/v1/ai/stream")
                #expect(request.httpMethod == "POST")
                let body = try request.httpBodyJSON()
                #expect(body["content"] as? String == "你好")
                #expect(body["conversationId"] as? String == "42")

                return AsyncThrowingStream { continuation in
                    [
                        "event: start",
                        #"data: {"conversationId":42,"userMessageId":101,"assistantMessageId":102,"provider":"ollama","model":"qwen3"}"#,
                        "",
                        "event: delta",
                        #"data: {"content":"你"}"#,
                        "",
                        "event: delta",
                        #"data: {"content":"好"}"#,
                        "",
                        "event: done",
                        #"data: {"assistantMessageId":102}"#,
                        "",
                    ].forEach { continuation.yield($0) }

                    continuation.finish()
                }
            }
        )

        let service = MessageService(client: client)
        let stream = try service.streamMessage(content: "你好", conversationID: "42")
        var events: [MessageStreamEvent] = []

        for try await event in stream {
            events.append(event)
        }

        #expect(events == [
            .start(
                conversationID: "42",
                userMessageID: "101",
                assistantMessageID: "102",
                provider: "ollama",
                model: "qwen3"
            ),
            .delta("你"),
            .delta("好"),
            .done(assistantMessageID: "102"),
        ])
    }

    @Test("stream message parses events even when line stream omits blank separators")
    func streamMessageWithoutBlankLines() async throws {
        let baseURL = URL(string: "http://messages-stream-no-blank.local/api/v1")!
        let client = APIClient(
            config: APIConfig(baseURL: baseURL),
            streamTransport: { _ in
                AsyncThrowingStream { continuation in
                    [
                        "event: start",
                        #"data: {"conversationId":42,"userMessageId":101,"assistantMessageId":102,"provider":"ollama","model":"qwen3"}"#,
                        "event: delta",
                        #"data: {"content":"你"}"#,
                        "event: delta",
                        #"data: {"content":"好"}"#,
                        "event: done",
                        #"data: {"assistantMessageId":102}"#,
                    ].forEach { continuation.yield($0) }

                    continuation.finish()
                }
            }
        )

        let service = MessageService(client: client)
        let stream = try service.streamMessage(content: "你好", conversationID: "42")
        var events: [MessageStreamEvent] = []

        for try await event in stream {
            events.append(event)
        }

        #expect(events == [
            .start(
                conversationID: "42",
                userMessageID: "101",
                assistantMessageID: "102",
                provider: "ollama",
                model: "qwen3"
            ),
            .delta("你"),
            .delta("好"),
            .done(assistantMessageID: "102"),
        ])
    }

    @Test("stream message retries once when stream fails before first event")
    func streamMessageRetriesBeforeFirstEvent() async throws {
        let baseURL = URL(string: "http://messages-stream-retry.local/api/v1")!
        let recorder = RequestRecorder()
        let attemptCounter = LockedCounter()
        let client = APIClient(
            config: APIConfig(baseURL: baseURL),
            streamTransport: { request in
                recorder.append(request)
                let attempt = attemptCounter.incrementAndGet()

                if attempt == 1 {
                    return AsyncThrowingStream { continuation in
                        continuation.finish(throwing: APIError.transport(message: "fetch failed"))
                    }
                }

                return AsyncThrowingStream { continuation in
                    continuation.yield("event: start")
                    continuation.yield(#"data: {"conversationId":42,"userMessageId":101,"assistantMessageId":102,"provider":"ollama","model":"qwen3"}"#)
                    continuation.yield("")
                    continuation.yield("event: done")
                    continuation.yield(#"data: {"assistantMessageId":102}"#)
                    continuation.yield("")
                    continuation.finish()
                }
            }
        )

        let service = MessageService(
            client: client,
            streamIdleTimeoutNanoseconds: 200_000_000,
            maxInitialRetryCount: 1,
            initialRetryDelayNanoseconds: 1_000_000
        )
        let stream = try service.streamMessage(content: "你好", conversationID: "42")
        var events: [MessageStreamEvent] = []

        for try await event in stream {
            events.append(event)
        }

        #expect(recorder.requests.count == 2)
        #expect(events == [
            .start(
                conversationID: "42",
                userMessageID: "101",
                assistantMessageID: "102",
                provider: "ollama",
                model: "qwen3"
            ),
            .done(assistantMessageID: "102"),
        ])
    }

    @Test("stream message does not retry after receiving delta")
    func streamMessageDoesNotRetryAfterDelta() async throws {
        let baseURL = URL(string: "http://messages-stream-no-retry.local/api/v1")!
        let attemptCounter = LockedCounter()
        let client = APIClient(
            config: APIConfig(baseURL: baseURL),
            streamTransport: { _ in
                let attempt = attemptCounter.incrementAndGet()
                return AsyncThrowingStream { continuation in
                    continuation.yield("event: delta")
                    continuation.yield(#"data: {"content":"partial"}"#)
                    continuation.yield("")
                    continuation.finish(throwing: APIError.transport(message: "stream failed \(attempt)"))
                }
            }
        )

        let service = MessageService(
            client: client,
            streamIdleTimeoutNanoseconds: 200_000_000,
            maxInitialRetryCount: 1,
            initialRetryDelayNanoseconds: 1_000_000
        )
        let stream = try service.streamMessage(content: "你好", conversationID: "42")
        var events: [MessageStreamEvent] = []

        await #expect(throws: APIError.transport(message: "stream failed 1")) {
            for try await event in stream {
                events.append(event)
            }
        }

        #expect(events == [.delta("partial")])
        #expect(attemptCounter.value == 1)
    }

    @Test("stream message fails when no activity arrives before timeout")
    func streamMessageTimesOutWhenIdle() async throws {
        let baseURL = URL(string: "http://messages-stream-timeout.local/api/v1")!
        let client = APIClient(
            config: APIConfig(baseURL: baseURL),
            streamTransport: { _ in
                AsyncThrowingStream { _ in }
            }
        )

        let service = MessageService(
            client: client,
            streamIdleTimeoutNanoseconds: 50_000_000,
            maxInitialRetryCount: 0,
            initialRetryDelayNanoseconds: 1_000_000
        )
        let stream = try service.streamMessage(content: "你好", conversationID: "42")

        await #expect(throws: APIError.transport(message: "Stream timed out")) {
            for try await _ in stream {}
        }
    }
}
