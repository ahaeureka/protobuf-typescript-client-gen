# 📚 Stew 认证客户端文档索引

## 🎯 快速导航

### 我想...

- **🚀 快速开始** → [QUICKSTART.md](./QUICKSTART.md)
  - 5 分钟快速集成指南
  - 最小化代码示例
  - 常见问题解答

- **📖 完整学习** → [AUTH_CLIENT_README.md](./AUTH_CLIENT_README.md)
  - 完整的 API 文档
  - 详细的使用说明
  - 服务端流程说明
  - 故障排查指南

- **🔍 了解修改** → [AUTH_CLIENT_CHANGELOG.md](./AUTH_CLIENT_CHANGELOG.md)
  - 详细的变更日志
  - 服务端代码分析
  - 修正前后对比
  - 技术实现细节

- **💡 查看示例** → [auth_client_usage_example.ts](./src/auth_client_usage_example.ts)
  - 完整的集成示例
  - 路由守卫实现（Vue/React）
  - 自动 token 刷新
  - 最佳实践

- **🎨 体验演示** → [demo.html](./demo.html)
  - 可视化演示界面
  - 实时状态显示
  - 交互式测试
  - 日志输出

- **📋 查看总结** → [SUMMARY.md](./SUMMARY.md)
  - 修正概述
  - 关键改进点
  - 文件结构
  - 测试方法

## 📁 文件结构

```
/app/protobuf-typescript-client-gen/
│
├── 📘 文档
│   ├── QUICKSTART.md              ⭐ 5分钟快速开始
│   ├── AUTH_CLIENT_README.md      📖 完整 API 文档
│   ├── AUTH_CLIENT_CHANGELOG.md   📝 详细变更日志
│   ├── SUMMARY.md                 📋 修正总结
│   └── INDEX.md                   📚 本文件
│
├── 💻 源代码
│   └── src/
│       ├── auth_client.ts         ✨ 核心客户端（已修正）
│       ├── auth_client_usage_example.ts  💡 使用示例
│       └── proto/                 🔧 生成的 proto 文件
│
└── 🎨 演示
    └── demo.html                  🎯 可视化演示页面
```

## 🎓 学习路径

### 初学者路径

1. **阅读** [QUICKSTART.md](./QUICKSTART.md)
   - 理解基本概念
   - 查看最小示例

2. **运行** [demo.html](./demo.html)
   - 体验完整流程
   - 观察实时状态

3. **参考** [auth_client_usage_example.ts](./src/auth_client_usage_example.ts)
   - 查看真实集成代码
   - 复制到自己的项目

### 进阶路径

1. **深入** [AUTH_CLIENT_README.md](./AUTH_CLIENT_README.md)
   - 学习完整 API
   - 了解服务端流程
   - 掌握故障排查

2. **研究** [AUTH_CLIENT_CHANGELOG.md](./AUTH_CLIENT_CHANGELOG.md)
   - 理解修正原因
   - 分析服务端实现
   - 学习技术细节

3. **应用** 到实际项目
   - 集成到自己的应用
   - 自定义配置
   - 优化用户体验

## 🔑 核心概念

### OIDC 认证流程

```
客户端          Stew Gateway      OIDC Provider
   │                 │                   │
   ├─ login() ──────>│                   │
   │                 ├─ 生成 state ─────>│
   │<────── 302 ─────┤                   │
   │                 │                   │
   ├────── 重定向 ─────────────────────>│
   │                 │                   │
   │<──── 登录页面 ───────────────────────┤
   │                 │                   │
   ├──── 提交凭证 ───────────────────────>│
   │                 │                   │
   │                 │<── callback ──────┤
   │                 ├─ 验证 & 交换 token
   │<────── 302 ─────┤                   │
   │  (token in URL) │                   │
   │                 │                   │
   ├─ handleCallback()                   │
   │  (提取 token)                        │
   │                 │                   │
   └─ 跳转到应用      │                   │
```

### 关键方法

| 阶段 | 方法 | 作用 |
|------|------|------|
| 登录发起 | `login()` | 重定向到 OIDC provider |
| 回调处理 | `handleLoginCallback()` | 提取并保存 token ⭐ |
| 状态检查 | `isAuthenticated()` | 检查是否已登录 |
| Token 验证 | `isTokenValid()` | 检查 token 是否有效 |
| 获取信息 | `getUserInfo()` | 获取用户资料 |
| 登出 | `logout()` | 清理并登出 |

## 🛠️ 开发工具

### TypeScript 类型

```typescript
interface AuthClient {
    login(): Promise<void>;
    handleLoginCallback(): { success: boolean; token?: string; error?: string };
    logout(): Promise<void>;
    getUserInfo(): Promise<User>;
    getToken(): string | null;
    isAuthenticated(): boolean;
    isTokenValid(): boolean;
    clearLocalAuth(): void;
}
```

### 调试技巧

1. **查看 token 内容**
   ```typescript
   const token = authClient.getToken();
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log(payload);
   ```

2. **检查过期时间**
   ```typescript
   console.log('Token valid:', authClient.isTokenValid());
   ```

3. **清理并重试**
   ```typescript
   authClient.clearLocalAuth();
   authClient.login();
   ```

## 🎯 使用场景

### 场景 1: 单页应用（SPA）

**技术栈**: React / Vue / Angular

**集成方式**:
- 使用路由守卫保护页面
- 在应用启动时检查认证状态
- 实现自动 token 刷新

**参考**: `auth_client_usage_example.ts`

### 场景 2: 多页应用（MPA）

**技术栈**: 传统 Web 应用

**集成方式**:
- 在每个页面检查认证状态
- 使用 Cookie 持久化 token
- 服务端渲染集成

### 场景 3: 移动端 WebView

**技术栈**: React Native / Ionic

**集成方式**:
- 使用 WebView 处理 OIDC 流程
- 将 token 传递给原生应用
- 实现原生存储

## 📊 对比矩阵

### 修正前 vs 修正后

| 功能 | 修正前 | 修正后 |
|------|--------|--------|
| 处理回调 | ❌ 无 | ✅ `handleLoginCallback()` |
| Token 保存 | ❌ 不完整 | ✅ localStorage + Cookie |
| 状态检查 | ❌ 仅 `getToken()` | ✅ `isAuthenticated()` + `isTokenValid()` |
| JWT 验证 | ❌ 无 | ✅ 过期时间检查 |
| 清理范围 | ⚠️ 部分 | ✅ 全面（token, session, csrf, nonce） |
| 文档 | ⚠️ 无 | ✅ 完整文档 + 示例 + 演示 |

## 🔗 相关资源

### 服务端代码

- `/app/src/auth/service.rs` - Rust 认证服务实现
- `/app/proto/authentication.proto` - 认证协议定义
- `/app/proto/authorization.proto` - 授权协议定义

### 标准规范

- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)

## 💬 支持

### 遇到问题？

1. **查看** [QUICKSTART.md](./QUICKSTART.md) - 常见问题
2. **参考** [AUTH_CLIENT_README.md](./AUTH_CLIENT_README.md) - 故障排查
3. **运行** [demo.html](./demo.html) - 对比正常流程
4. **检查** 浏览器控制台 - 查看错误日志

### 需要示例？

1. **基础集成** → [QUICKSTART.md](./QUICKSTART.md)
2. **完整示例** → [auth_client_usage_example.ts](./src/auth_client_usage_example.ts)
3. **可视化演示** → [demo.html](./demo.html)

## 🎉 开始使用

准备好了？从 [QUICKSTART.md](./QUICKSTART.md) 开始，5 分钟内集成认证！

---

**最后更新**: 2025年10月15日  
**版本**: 1.0.0  
**维护者**: Stew Team
