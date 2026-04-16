import NexchatCore
import SwiftUI

struct AuthView: View {
    @StateObject private var viewModel: AuthViewModel

    init(authService: any AuthServiceProtocol, sessionStore: AppSessionStore) {
        _viewModel = StateObject(wrappedValue: AuthViewModel(authService: authService, sessionStore: sessionStore))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    VStack(spacing: 12) {
                        Image(systemName: "message.badge.waveform.fill")
                            .font(.system(size: 42))
                            .foregroundStyle(.blue)

                        Text("NexChat")
                            .font(.largeTitle.bold())

                        Text(viewModel.mode == .signIn ? "登录后继续使用 NexChat" : "创建账号开始聊天")
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 32)

                    Picker("模式", selection: $viewModel.mode) {
                        Text("登录").tag(AuthViewModel.Mode.signIn)
                        Text("注册").tag(AuthViewModel.Mode.signUp)
                    }
                    .pickerStyle(.segmented)

                    VStack(spacing: 16) {
                        if viewModel.mode == .signUp {
                            TextField("昵称", text: $viewModel.name)
                                .textFieldStyle(.roundedBorder)
                                .textInputAutocapitalization(.words)
                        }

                        TextField("邮箱", text: $viewModel.email)
                            .textFieldStyle(.roundedBorder)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                            .autocorrectionDisabled()

                        SecureField("密码（至少 6 位）", text: $viewModel.password)
                            .textFieldStyle(.roundedBorder)
                    }

                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(.red)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Button {
                        Task {
                            await viewModel.submit()
                        }
                    } label: {
                        HStack {
                            if viewModel.isSubmitting {
                                ProgressView()
                                    .tint(.white)
                            }
                            Text(viewModel.mode == .signIn ? "登录" : "注册")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(viewModel.isSubmitting)
                }
                .padding(24)
            }
            .background(Color(.systemGroupedBackground))
            .navigationBarHidden(true)
        }
    }
}
