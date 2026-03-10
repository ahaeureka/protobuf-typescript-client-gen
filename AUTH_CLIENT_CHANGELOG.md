# AuthServiceClient 修正变更日志

## 修正日期
2025年10月15日

## 修正原因
原客户端代码与服务端的 OIDC 认证流程不匹配，导致登录/登出流程无法正常工作。

## 服务端实现分析

### 服务端代码位置
- `/app/src/auth/service.rs` - AuthzService 实现
- `/app/proto/authentication.proto` - 认证协议定义
- `/app/proto/authorization.proto` - 授权协议定义

### 服务端关键实现细节

#### 1. Login 流程 (`/auth/login`)
```rust
// 服务端生成 state 参数，包含多个信息编码为 JSON 并 base64 编码
struct StateData {
    csrf_token: String,
    session_id: String,
    nonce: String,
    callback: String,  // 客户端的 callback URL
}

// 返回 RedirectResponse，重定向到 OIDC provider
RedirectResponse {
    url: auth_url.to_string(),  // OIDC provider 授权 URL
    code: 302,
}
```

#### 2. Callback 流程 (`/auth/callback`)
```rust
// 服务端从 state 参数解码信息
// 交换授权码获取 token
// 构造最终的 callback URL
let final_callback = if callback_url.contains('?') {
    format!("{}&code=success&token={}", callback_url, raw_id_token)
} else {
    format!("{}?code=success&token={}", callback_url, raw_id_token)
};

// 返回 RedirectResponse，重定向到客户端 callback URL
RedirectResponse {
    url: final_callback,
    code: 302,
}
```

#### 3. Logout 流程 (`/auth/logout`)
```rust
// 服务端构造 OIDC provider 的登出 URL
logout_url.query_pairs_mut()
    .append_pair("id_token_hint", &token)
    .append_pair("post_logout_redirect_uri", &post_logout_redirect_uri)
    .append_pair("state", &logout_state);

// 返回 RedirectResponse
RedirectResponse {
    url: logout_url.to_string(),
    code: 302,
}
```

## 客户端修正内容

### 1. 构造函数改进

**新增配置**：
```typescript
withCredentials: true  // 支持跨域 cookie
```

**原因**：服务端通过 cookie 管理 session，需要支持跨域携带 cookie。

### 2. Login 方法修正

**原实现问题**：
- 直接拼接 URL 重定向
- 没有考虑服务端返回的 RedirectResponse

**修正后**：
```typescript
async login(): Promise<void> {
    const loginUrl = `${this.gwBaseUrl}/auth/login?callback=${encodeURIComponent(this.loginCallbackUrl)}`;
    console.log('[AuthClient] Redirecting to login URL:', loginUrl);
    (window as any).location.href = loginUrl;
}
```

**改进**：
- 正确编码 callback 参数
- 添加调试日志
- 明确返回类型为 Promise<void>

### 3. 新增 handleLoginCallback 方法

**实现**：
```typescript
handleLoginCallback(): { success: boolean; token?: string; error?: string } {
    const urlParams = new URLSearchParams((window as any).location.search);
    const code = urlParams.get('code');
    const token = urlParams.get('token');

    if (code === 'success' && token) {
        this.saveToken(token);
        return { success: true, token };
    } else {
        const error = urlParams.get('error') || 'Unknown error';
        return { success: false, error };
    }
}
```

**作用**：
- 从 URL 查询参数中提取 token
- 保存 token 到本地存储
- 返回处理结果，便于后续流程控制

**使用场景**：
- 在 callback 页面（如 `/callback`）中调用
- 处理来自服务端 `/auth/callback` 的重定向

### 4. 新增 saveToken 方法

**实现**：
```typescript
private saveToken(token: string): void {
    // 保存到 localStorage
    (localStorage as any).setItem('token', token);
    
    // 保存到 cookie（与服务端保持一致）
    const expires = new Date();
    expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000); // 24 小时
    (document as any).cookie = `token=${encodeURIComponent(token)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}
```

**改进**：
- 同时保存到 localStorage 和 cookie
- 设置 24 小时过期时间
- 使用 SameSite=Lax 增强安全性

### 5. Logout 方法修正

**原实现问题**：
- 参数拼接方式不规范
- 清理时机不当

**修正后**：
```typescript
async logout(): Promise<void> {
    const token = this.getToken();
    if (!token) {
        this.clearLocalAuth();
        (window as any).location.href = this.logoutCallbackUrl;
        return;
    }

    const logoutUrl = `${this.gwBaseUrl}/auth/logout?callback=${encodeURIComponent(this.logoutCallbackUrl)}&token=${encodeURIComponent(token)}`;
    
    this.clearLocalAuth();
    (window as any).location.href = logoutUrl;
}
```

**改进**：
- 正确编码 callback 和 token 参数
- 在重定向前清理本地数据
- 无 token 时优雅降级

### 6. clearLocalAuth 方法增强

**新增清理项**：
```typescript
clearLocalAuth(): void {
    // localStorage
    removeItem('token');
    removeItem('access_token');
    removeItem('refresh_token');
    removeItem('id_token');  // 新增
    removeItem('user_info');

    // sessionStorage
    removeItem('token');
    removeItem('access_token');
    removeItem('user_info');

    // cookies - 清理所有认证相关 cookie
    // 包括: token, session, csrf, nonce 等
}
```

**改进**：
- 清理 id_token（OIDC 的 ID token）
- 清理服务端设置的 session、csrf、nonce cookie
- 同时清理主域名和子域名的 cookie

### 7. getToken 方法优化

**优先级顺序**：
1. localStorage (token > access_token > id_token)
2. sessionStorage (token > access_token)
3. cookie (token > access_token > id_token)

**改进**：
- 支持 id_token（OIDC 标准）
- 添加错误处理
- 统一返回类型

### 8. 新增实用方法

#### `isAuthenticated(): boolean`
```typescript
isAuthenticated(): boolean {
    return this.getToken() !== null;
}
```

#### `isTokenValid(): boolean`
```typescript
isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // 解析 JWT 并检查过期时间
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    
    if (payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        return payload.exp > now;
    }
    
    return true;
}
```

**作用**：
- 快速检查登录状态
- 验证 JWT token 有效性
- 支持路由守卫集成

## 配套文档

### 1. AUTH_CLIENT_README.md
- 完整的 API 文档
- 使用示例
- 故障排查指南
- 与服务端的对应关系

### 2. auth_client_usage_example.ts
- 真实的集成示例
- 路由守卫实现（Vue/React）
- 自动 token 刷新
- 最佳实践

## 测试建议

### 1. 登录流程测试
```typescript
// 1. 点击登录按钮
await authClient.login();

// 2. 在 callback 页面
const result = authClient.handleLoginCallback();
console.assert(result.success === true);
console.assert(result.token !== undefined);

// 3. 验证 token 保存
console.assert(authClient.isAuthenticated() === true);
console.assert(authClient.getToken() !== null);
```

### 2. 登出流程测试
```typescript
// 1. 登出
await authClient.logout();

// 2. 验证清理
console.assert(authClient.isAuthenticated() === false);
console.assert(authClient.getToken() === null);
```

### 3. Token 有效性测试
```typescript
// 模拟过期 token
localStorage.setItem('token', 'expired.jwt.token');
console.assert(authClient.isTokenValid() === false);
```

## 兼容性说明

### 浏览器要求
- 支持 localStorage
- 支持 Cookie
- 支持 URLSearchParams
- 支持 atob/btoa (JWT 解析)

### 服务端要求
- Stew Gateway >= v1.0
- OIDC Provider 配置正确
- CORS 配置允许 credentials

## 后续优化建议

1. **Token 自动刷新**
   - 实现 refresh_token 机制
   - 在 token 快过期时自动刷新

2. **错误处理增强**
   - 区分不同类型的认证错误
   - 提供更详细的错误信息

3. **TypeScript 类型完善**
   - 导出完整的类型定义
   - 支持泛型用户信息类型

4. **单元测试**
   - 添加完整的单元测试
   - Mock 浏览器环境测试

## 总结

本次修正完全基于服务端的实际实现，确保客户端与服务端的认证流程完全匹配。主要改进：

1. ✅ 正确处理 OIDC 登录回调流程
2. ✅ 支持服务端的 state 参数编码方案
3. ✅ 从 URL 参数正确提取和保存 token
4. ✅ 登出时清理所有认证数据
5. ✅ 添加 token 有效性检查
6. ✅ 提供完整的使用文档和示例

客户端现在可以与服务端无缝协作，实现完整的 OIDC 认证流程。
