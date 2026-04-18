import NexchatCore
import SwiftUI

struct AuthView: View {
    @StateObject private var viewModel: AuthViewModel
    @FocusState private var focusedField: Field?

    private enum Field {
        case name
        case email
        case password
    }

    init(authService: any AuthServiceProtocol, sessionStore: AppSessionStore) {
        _viewModel = StateObject(wrappedValue: AuthViewModel(authService: authService, sessionStore: sessionStore))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 28) {
                    heroSection
                    formCard
                }
                .padding(.horizontal, 20)
                .padding(.top, 28)
                .padding(.bottom, 24)
            }
            .background(backgroundGradient.ignoresSafeArea())
            .navigationBarHidden(true)
        }
    }

    private var heroSection: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                ZStack {
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .fill(.white.opacity(0.2))
                        .frame(width: 68, height: 68)

                    Image(systemName: "message.badge.waveform.fill")
                        .font(.system(size: 30))
                        .foregroundStyle(.white)
                }

                Spacer()
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("欢迎使用 NexChat")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)

                Text(viewModel.mode == .signIn ? "登录后继续你的对话和创作" : "创建账号，开始新的智能聊天体验")
                    .font(.body)
                    .foregroundStyle(.white.opacity(0.82))
            }

            HStack(spacing: 12) {
                featureBadge(title: "快速登录", systemImage: "bolt.fill")
                featureBadge(title: "启动免重复登录", systemImage: "checkmark.shield.fill")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 8)
    }

    private var formCard: some View {
        VStack(spacing: 20) {
            Picker("模式", selection: $viewModel.mode) {
                Text("登录").tag(AuthViewModel.Mode.signIn)
                Text("注册").tag(AuthViewModel.Mode.signUp)
            }
            .pickerStyle(.segmented)

            VStack(spacing: 14) {
                if viewModel.mode == .signUp {
                    inputField(
                        title: "昵称",
                        systemImage: "person.fill",
                        prompt: "输入你的昵称",
                        text: $viewModel.name,
                        field: .name,
                        textContentType: .name
                    )
                    .textInputAutocapitalization(.words)
                }

                inputField(
                    title: "邮箱",
                    systemImage: "envelope.fill",
                    prompt: "name@example.com",
                    text: $viewModel.email,
                    field: .email,
                    keyboardType: .emailAddress,
                    textContentType: .emailAddress
                )
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()

                secureInputField(
                    title: "密码",
                    systemImage: "lock.fill",
                    prompt: "至少 6 位密码",
                    text: $viewModel.password,
                    field: .password,
                    textContentType: viewModel.mode == .signIn ? .password : .newPassword
                )
            }

            if let errorMessage = viewModel.errorMessage {
                Label(errorMessage, systemImage: "exclamationmark.circle.fill")
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            Button {
                focusedField = nil
                Task {
                    await viewModel.submit()
                }
            } label: {
                HStack(spacing: 10) {
                    if viewModel.isSubmitting {
                        ProgressView()
                            .tint(.white)
                    }

                    Text(viewModel.mode == .signIn ? "登录并继续" : "注册并开始")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
            }
            .buttonStyle(.borderedProminent)
            .disabled(viewModel.isSubmitting)

            Text(viewModel.mode == .signIn ? "登录成功后会自动保留本地会话，下次打开无需重复登录。" : "注册成功后将自动登录，并保留本地会话。")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(20)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .stroke(.white.opacity(0.25), lineWidth: 1)
        }
        .shadow(color: .black.opacity(0.08), radius: 24, y: 12)
    }

    private func featureBadge(title: String, systemImage: String) -> some View {
        Label(title, systemImage: systemImage)
            .font(.footnote.weight(.semibold))
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(.white.opacity(0.14))
            .clipShape(Capsule())
            .foregroundStyle(.white)
    }

    private func inputField(
        title: String,
        systemImage: String,
        prompt: String,
        text: Binding<String>,
        field: Field,
        keyboardType: UIKeyboardType = .default,
        textContentType: UITextContentType? = nil
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.secondary)

            HStack(spacing: 12) {
                Image(systemName: systemImage)
                    .foregroundStyle(.blue)
                    .frame(width: 18)

                TextField(prompt, text: text)
                    .focused($focusedField, equals: field)
                    .keyboardType(keyboardType)
                    .textContentType(textContentType)
                    .submitLabel(field == .password ? .go : .next)
                    .onSubmit {
                        handleSubmit(from: field)
                    }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 14)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
    }

    private func secureInputField(
        title: String,
        systemImage: String,
        prompt: String,
        text: Binding<String>,
        field: Field,
        textContentType: UITextContentType? = nil
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.secondary)

            HStack(spacing: 12) {
                Image(systemName: systemImage)
                    .foregroundStyle(.blue)
                    .frame(width: 18)

                SecureField(prompt, text: text)
                    .focused($focusedField, equals: field)
                    .textContentType(textContentType)
                    .submitLabel(.go)
                    .onSubmit {
                        handleSubmit(from: field)
                    }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 14)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
    }

    private func handleSubmit(from field: Field) {
        switch field {
        case .name:
            focusedField = .email
        case .email:
            focusedField = .password
        case .password:
            focusedField = nil
            Task {
                await viewModel.submit()
            }
        }
    }

    private var backgroundGradient: some View {
        LinearGradient(
            colors: [
                Color(red: 0.18, green: 0.37, blue: 0.94),
                Color(red: 0.28, green: 0.61, blue: 0.98),
                Color(red: 0.93, green: 0.96, blue: 1.0)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}
