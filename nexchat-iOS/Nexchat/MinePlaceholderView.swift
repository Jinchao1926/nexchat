import NexchatCore
import SwiftUI

struct MinePlaceholderView: View {
    @ObservedObject var sessionStore: AppSessionStore

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                VStack(spacing: 12) {
                    Image(systemName: "person.crop.circle.fill")
                        .font(.system(size: 56))
                        .foregroundStyle(.blue)

                    Text(sessionStore.session?.user.name ?? "已登录")
                        .font(.title3.bold())

                    Text(sessionStore.session?.user.email ?? "")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Button(role: .destructive) {
                    sessionStore.clear()
                } label: {
                    Text("退出登录")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.red)
            }
            .padding(24)
            .navigationTitle("我的")
        }
    }
}
