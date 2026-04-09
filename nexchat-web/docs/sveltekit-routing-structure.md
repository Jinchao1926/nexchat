# SvelteKit 登录态路由设计

适用场景：

- 应用启动时先判断用户是否登录过
- 已登录：进入主页面
- 未登录：进入登录页面
- 登录成功后：跳转到主页面

## 推荐路由结构

```text
src/routes/
  +layout.server.ts
  +layout.svelte
  +page.svelte
  +page.server.ts
  app/
    +layout.server.ts
    +layout.svelte
    +page.svelte
```

对应 URL：

- `/`：登录页
- `/app`：主页面

## 每个文件的职责

### `src/routes/+layout.server.ts`

全局读取登录态，例如从 cookie、session 或 token 中解析当前用户。

作用：

- 应用一打开就先拿到当前 session
- 把 `session` 注入到所有页面可访问的 `data` 里
- 让整个应用都能知道“当前是否已登录”

适合做的事：

- 读取 cookie
- 调用鉴权服务查询当前用户
- 返回 `{ session }`

### `src/routes/+layout.svelte`

全局布局文件。

作用：

- 承载所有页面的公共外壳
- 可以读取 `data.session`
- 渲染子页面

如果你的项目没有统一壳子，这个文件也可以很薄，只负责：

- 设置 `<head>`
- 渲染 `children`

### `src/routes/+page.svelte`

登录页 UI。

作用：

- 展示邮箱、密码输入框
- 展示登录按钮、错误提示
- 发起登录动作

这里是“未登录用户默认看到的页面”。

### `src/routes/+page.server.ts`

登录页对应的服务端逻辑。

推荐职责：

- 如果已经登录，直接重定向到 `/app`
- 如果未登录，允许渲染登录页
- 如果使用 SvelteKit form actions，也可以在这里处理登录提交

典型逻辑：

```ts
if (session?.user) {
  throw redirect(303, '/app');
}
```

### `src/routes/app/+layout.server.ts`

受保护区域的统一鉴权入口。

这是非常推荐加上的一层。

作用：

- 保护 `/app` 下面所有页面
- 没登录就统一跳回 `/`
- 已登录就把 session 继续传下去

这样后续新增这些页面时，不需要每页都重复鉴权：

- `/app/chat`
- `/app/settings`
- `/app/profile`

### `src/routes/app/+layout.svelte`

登录后主应用区域的公共布局。

适合放：

- 顶部导航
- 侧边栏
- 用户信息
- 主内容区域容器

如果未来你的应用会变成聊天工作台，这一层通常就是 App Shell。

### `src/routes/app/+page.svelte`

主页面内容。

作用：

- 登录成功后默认进入的首页
- 可以是聊天首页、会话列表页、工作台首页

## 页面跳转流程

### 场景 1：用户首次打开应用

1. 访问 `/`
2. `src/routes/+layout.server.ts` 读取 session
3. `src/routes/+page.server.ts` 判断：
   - 已登录：跳转 `/app`
   - 未登录：显示登录页

### 场景 2：用户登录成功

1. 在 `src/routes/+page.svelte` 提交登录
2. 服务端写入 cookie / session
3. 登录成功后跳转到 `/app`

### 场景 3：用户直接访问 `/app`

1. 进入 `/app`
2. `src/routes/app/+layout.server.ts` 检查 session
3. 判断：
   - 已登录：继续显示主页面
   - 未登录：重定向回 `/`

## 为什么不推荐“一个页面决定显示登录或主页面”

不推荐把 `/` 做成一个大页面，然后在前端代码里写：

- 已登录显示主页面组件
- 未登录显示登录组件

原因：

- URL 不清晰，登录区和主应用区混在一起
- 权限控制容易散落在组件里
- 后续增加 `/app/settings`、`/app/chat` 会变乱
- 服务端重定向和 SEO 行为也不够明确

更好的方式是：

- `/` 专门负责登录
- `/app` 专门负责登录后区域

## 推荐的最终思路

一句话总结：

> 用 `/` 做登录入口，用 `/app` 做登录后主区域，用 `+layout.server.ts` 和 `/app/+layout.server.ts` 管理 session 和鉴权。

这是一个清晰、可扩展、符合 SvelteKit 习惯的路由设计。
