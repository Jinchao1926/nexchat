import NexchatCore
import SwiftUI

struct ConversationListView: View {
    @StateObject private var viewModel: ConversationListViewModel
    private let messageService: any MessageServiceProtocol
    @State private var path: [Conversation] = []

    init(
        conversationService: any ConversationServiceProtocol,
        messageService: any MessageServiceProtocol
    ) {
        _viewModel = StateObject(wrappedValue: ConversationListViewModel(service: conversationService))
        self.messageService = messageService
    }

    var body: some View {
        NavigationStack(path: $path) {
            Group {
                if viewModel.isLoading && viewModel.conversations.isEmpty {
                    ProgressView("加载会话中…")
                } else if let errorMessage = viewModel.errorMessage, viewModel.conversations.isEmpty {
                    ContentUnavailableView("加载失败", systemImage: "exclamationmark.triangle", description: Text(errorMessage))
                } else if viewModel.conversations.isEmpty {
                    ContentUnavailableView("还没有会话", systemImage: "message", description: Text("点击右上角创建一个新会话"))
                } else {
                    List(viewModel.conversations) { conversation in
                        Button {
                            path.append(conversation)
                        } label: {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(conversation.title)
                                    .font(.headline)
                                    .foregroundStyle(.primary)

                                Text(conversation.updatedAt.replacingOccurrences(of: "T", with: " ").replacingOccurrences(of: "Z", with: ""))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 6)
                        }
                    }
                    .listStyle(.plain)
                    .refreshable {
                        await viewModel.loadConversations()
                    }
                }
            }
            .navigationTitle("会话")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        viewModel.isCreateSheetPresented = true
                    } label: {
                        Image(systemName: "square.and.pencil")
                    }
                }
            }
            .navigationDestination(for: Conversation.self) { conversation in
                MessageListView(messageService: messageService, conversation: conversation)
            }
            .task {
                await viewModel.loadConversations()
            }
            .onChange(of: viewModel.pendingNavigationConversationID) { _, newValue in
                guard
                    let newValue,
                    let conversation = viewModel.conversations.first(where: { $0.id == newValue })
                else {
                    return
                }

                path.append(conversation)
                _ = viewModel.consumePendingNavigationConversationID()
            }
            .sheet(isPresented: $viewModel.isCreateSheetPresented) {
                NavigationStack {
                    Form {
                        TextField("会话标题", text: $viewModel.newConversationTitle)
                    }
                    .navigationTitle("新建会话")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .topBarLeading) {
                            Button("取消") {
                                viewModel.isCreateSheetPresented = false
                            }
                        }
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("创建") {
                                Task {
                                    await viewModel.createConversation()
                                }
                            }
                        }
                    }
                }
                .presentationDetents([.fraction(0.25)])
            }
        }
    }
}
