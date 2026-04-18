import NexchatCore
import SwiftUI

struct MessageListView: View {
    @StateObject private var viewModel: MessageListViewModel

    init(
        messageService: any MessageServiceProtocol,
        conversation: Conversation,
        onConversationUpsert: ((Conversation) -> Void)? = nil,
        onAuthenticationFailure: (() -> Void)? = nil
    ) {
        _viewModel = StateObject(
            wrappedValue: MessageListViewModel(
                service: messageService,
                conversation: conversation,
                onConversationUpsert: onConversationUpsert,
                onAuthenticationFailure: onAuthenticationFailure
            )
        )
    }

    var body: some View {
        ScrollViewReader { proxy in
            content
                .navigationTitle(viewModel.conversation.title)
                .navigationBarTitleDisplayMode(.inline)
                .task {
                    await viewModel.loadMessages()
                }
                .onChange(of: viewModel.messages.count) { _, _ in
                    scrollToBottom(with: proxy)
                }
                .safeAreaInset(edge: .bottom) {
                    composer
                }
        }
    }

    private var content: some View {
        Group {
            if viewModel.isLoading && viewModel.messages.isEmpty {
                ProgressView("加载消息中…")
            } else if let errorMessage = viewModel.errorMessage, viewModel.messages.isEmpty {
                ContentUnavailableView(
                    "消息加载失败",
                    systemImage: "exclamationmark.bubble",
                    description: Text(errorMessage)
                )
            } else if viewModel.messages.isEmpty {
                ContentUnavailableView(
                    "开始新对话",
                    systemImage: "ellipsis.bubble",
                    description: Text("发送第一条消息后会自动创建会话")
                )
            } else {
                messageList
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    private var messageList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.messages) { message in
                    messageRow(message)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 16)
        }
    }

    private func messageRow(_ message: ConversationMessage) -> some View {
        HStack(alignment: .bottom) {
            if message.role == .user {
                Spacer(minLength: 44)
            }

            VStack(
                alignment: message.role == .user ? .trailing : .leading,
                spacing: 6
            ) {
                Text(message.content.isEmpty && message.status == .streaming ? "…" : message.content)
                    .font(.body)
                    .lineSpacing(3)
                    .foregroundStyle(message.role == .user ? .white : .primary)
                    .padding(.horizontal, 15)
                    .padding(.vertical, 12)
                    .frame(maxWidth: message.role == .user ? 350 : 380, alignment: .leading)
                    .background(messageBubbleBackground(for: message))
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(message.role == .user ? Color.clear : Color.blue.opacity(0.08), lineWidth: 1)
                    }

                if let error = message.error, message.status == .failed {
                    HStack(spacing: 8) {
                        Label(error, systemImage: "exclamationmark.circle.fill")
                            .font(.caption)
                            .foregroundStyle(.red)

                        if viewModel.canRetryAssistantMessage(message) {
                            Button("重试") {
                                Task {
                                    await viewModel.retryLastFailedAssistantMessage()
                                }
                            }
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.blue)
                        }
                    }
                    .padding(.horizontal, 6)
                }
            }
            .id(message.id)

            if message.role != .user {
                Spacer(minLength: 24)
            }
        }
    }

    private var composer: some View {
        VStack(spacing: 8) {
            HStack(alignment: .bottom, spacing: 10) {
                TextField("给 Nexchat 发送消息", text: $viewModel.composerText, axis: .vertical)
                    .font(.body)
                    .lineLimit(1 ... 5)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 11)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .disabled(viewModel.isSending)

                Button {
                    Task {
                        await viewModel.sendMessage()
                    }
                } label: {
                    if viewModel.isSending {
                        ProgressView()
                            .controlSize(.small)
                            .frame(width: 20, height: 20)
                    } else {
                        Image(systemName: "arrow.up")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 34, height: 34)
                            .background(
                                viewModel.composerText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                                    ? Color.gray.opacity(0.35)
                                    : Color.blue
                            )
                            .clipShape(Circle())
                    }
                }
                .disabled(viewModel.composerText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || viewModel.isSending)
            }
        }
        .padding(.horizontal, 12)
        .padding(.top, 10)
        .padding(.bottom, 10)
        .background(
            Rectangle()
                .fill(.regularMaterial)
                .ignoresSafeArea(edges: .bottom)
        )
    }

    private func messageBubbleBackground(for message: ConversationMessage) -> Color {
        if message.role == .user {
            return .blue
        }

        if message.status == .failed {
            return Color.red.opacity(0.08)
        }

        return Color(red: 0.93, green: 0.96, blue: 1.0)
    }

    private func scrollToBottom(with proxy: ScrollViewProxy) {
        guard let lastMessageID = viewModel.messages.last?.id else {
            return
        }

        DispatchQueue.main.async {
            withAnimation(.easeOut(duration: 0.2)) {
                proxy.scrollTo(lastMessageID, anchor: .bottom)
            }
        }
    }
}
