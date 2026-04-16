import NexchatCore
import SwiftUI

struct MessageListView: View {
    @StateObject private var viewModel: MessageListViewModel

    init(messageService: any MessageServiceProtocol, conversation: Conversation) {
        _viewModel = StateObject(wrappedValue: MessageListViewModel(service: messageService, conversation: conversation))
    }

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.messages.isEmpty {
                ProgressView("加载消息中…")
            } else if let errorMessage = viewModel.errorMessage {
                ContentUnavailableView("消息加载失败", systemImage: "exclamationmark.bubble", description: Text(errorMessage))
            } else if viewModel.messages.isEmpty {
                ContentUnavailableView("暂无消息", systemImage: "ellipsis.bubble", description: Text("这个会话还没有消息"))
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(Array(viewModel.messages.reversed())) { message in
                            HStack {
                                if message.role == .user {
                                    Spacer(minLength: 48)
                                }

                                Text(message.content)
                                    .font(.body)
                                    .foregroundStyle(message.role == .user ? .white : .primary)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 12)
                                    .background(message.role == .user ? Color.blue : Color(.secondarySystemBackground))
                                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                                if message.role != .user {
                                    Spacer(minLength: 48)
                                }
                            }
                        }
                    }
                    .padding()
                }
                .background(Color(.systemGroupedBackground))
            }
        }
        .navigationTitle(viewModel.conversation.title)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.loadMessages()
        }
    }
}
