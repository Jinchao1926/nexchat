import SwiftUI

struct MinePlaceholderView: View {
    var body: some View {
        NavigationStack {
            ContentUnavailableView(
                "我的",
                systemImage: "person.crop.circle",
            )
            .navigationTitle("我的")
        }
    }
}
