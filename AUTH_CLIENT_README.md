# Stew AuthServiceClient - TypeScript 认证客户端

## 概述

这是 Stew gRPC Gateway 的 TypeScript 认证客户端，支持基于 OIDC (OpenID Connect) 的单点登录流程。

## 主要改进

### 修正的问题

1. **登录流程修正**
   - 正确处理服务端返回的 `RedirectResponse`
   - 支持 callback URL 的多重编码问题
   - 自动提取并保存回调中的 token

2. **Token 管理改进**
   - 新增 `handleLoginCallback()` 方法用于处理登录回调
   - 新增 `saveToken()` 方法保存 token 到 localStorage 和 cookie
   - 改进 `getToken()` 方法，支持多种存储方式（localStorage > sessionStorage > cookie）
   - 新增 `isAuthenticated()` 检查登录状态
   - 新增 `isTokenValid()` 检查 token 有效性（JWT 过期检查）

3. **登出流程优化**
   - 正确构造登出 URL 参数
   - 在重定向前清理本地认证数据
   - 支持无 token 时的优雅降级

4. **Cookie 支持**
   - 在 axios 配置中启用 `withCredentials: true`
   - 支持服务端设置的 cookie
   - 清理时同时清除相关的 session、csrf、nonce 等 cookie

## 服务端流程说明

### 登录流程

```
1. 客户端调用 authClient.login()
   └─> GET /auth/login?callback=<callback_url>

2. 服务端生成 state（包含 session_id, csrf_token, nonce, callback）
   └─> 返回 302 重定向到 OIDC Provider

3. 用户在 OIDC Provider 完成登录

4. OIDC Provider 重定向回服务端
   └─> GET /auth/callback?code=<auth_code>&state=<encoded_state>

5. 服务端验证并交换 token
   └─> 返回 302 重定向到客户端 callback URL
   └─> URL 格式：<callback_url>?code=success&token=<id_token>

6. 客户端调用 handleLoginCallback() 提取 token
   └─> 保存 token 到 localStorage 和 cookie
```

### 登出流程

```
1. 客户端调用 authClient.logout()
   └─> 清理本地认证数据
   └─> GET /auth/logout?callback=<callback_url>&token=<id_token>

2. 服务端构造 OIDC Provider 登出 URL
   └─> 返回 302 重定向到 OIDC Provider 登出端点

3. OIDC Provider 完成登出
   └─> 重定向回客户端指定的 callback URL
```

## 使用方法

### 1. 安装依赖

```bash
npm install axios
```

### 2. 初始化客户端

```typescript
import AuthServiceClient from './auth_client';

const authClient = new AuthServiceClient(
    'http://localhost:3012',           // Stew Gateway URL
    'http://localhost:5173/callback',  // 登录回调 URL
    'http://localhost:5173/'           // 登出后跳转 URL
);
```

### 3. 实现登录页面

```typescript
// pages/Login.tsx
import { authClient } from './auth';

function LoginPage() {
    const handleLogin = async () => {
        try {
            // 重定向到 OIDC provider
            await authClient.login();
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    return (
        <div>
            <h1>Login</h1>
            <button onClick={handleLogin}>
                Sign in with OIDC
            </button>
        </div>
    );
}
```

### 4. 实现回调页面

```typescript
// pages/Callback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from './auth';

function CallbackPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // 处理登录回调
        const result = authClient.handleLoginCallback();
        
        if (result.success) {
            console.log('Login successful!');
            // 跳转到首页或仪表板
            navigate('/dashboard');
        } else {
            console.error('Login failed:', result.error);
            // 跳转回登录页面
            navigate('/login?error=' + encodeURIComponent(result.error || 'Unknown error'));
        }
    }, [navigate]);

    return <div>Processing login...</div>;
}
```

### 5. 实现路由守卫

```typescript
// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { authClient } from './auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    // 检查是否已登录且 token 有效
    if (!authClient.isAuthenticated() || !authClient.isTokenValid()) {
        return <Navigate to="/login" replace />;
    }
    
    return <>{children}</>;
}

// 使用示例
// <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
```

### 6. 获取用户信息

```typescript
import { authClient } from './auth';

async function loadUserProfile() {
    try {
        const user = await authClient.getUserInfo();
        console.log('User profile:', user);
        return user;
    } catch (error) {
        console.error('Failed to load user profile:', error);
        
        // 处理 401 错误
        if (error.response?.status === 401) {
            authClient.clearLocalAuth();
            window.location.href = '/login';
        }
    }
}
```

### 7. 实现登出

```typescript
function LogoutButton() {
    const handleLogout = async () => {
        try {
            // 清理本地数据并重定向到 OIDC provider 登出
            await authClient.logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return <button onClick={handleLogout}>Logout</button>;
}
```

## API 参考

### 构造函数

```typescript
new AuthServiceClient(
    gwBaseUrl: string,        // Stew Gateway 基础 URL
    loginCallbackUrl: string, // 登录成功回调 URL
    logoutCallbackUrl: string // 登出后跳转 URL
)
```

### 方法

#### `login(): Promise<void>`
发起登录流程，重定向到 OIDC provider。

#### `handleLoginCallback(): { success: boolean; token?: string; error?: string }`
处理登录回调，从 URL 中提取并保存 token。应该在 callback 页面中调用。

#### `logout(): Promise<void>`
发起登出流程，清理本地数据并重定向到 OIDC provider 登出端点。

#### `getUserInfo(): Promise<User>`
获取当前登录用户的信息。需要有效的认证 token。

#### `getToken(): string | null`
获取当前的认证 token。优先级：localStorage > sessionStorage > cookie。

#### `isAuthenticated(): boolean`
检查用户是否已登录（是否有 token）。

#### `isTokenValid(): boolean`
检查 token 是否有效（JWT 过期检查）。

#### `clearLocalAuth(): void`
清除所有本地认证信息（localStorage、sessionStorage、cookies）。

## 与服务端的对应关系

| 客户端方法 | 服务端端点 | 说明 |
|-----------|-----------|------|
| `login()` | `GET /auth/login` | 发起登录 |
| `handleLoginCallback()` | - | 处理 `/auth/callback` 返回的 URL 参数 |
| `logout()` | `GET /auth/logout` | 发起登出 |
| `getUserInfo()` | `GET /auth/user` | 获取用户信息（需要认证） |

## 注意事项

1. **Callback URL 配置**
   - 确保 callback URL 在 OIDC provider 中已注册
   - 服务端的 `redirect_url` 必须与 OIDC provider 配置一致

2. **Cookie 设置**
   - 客户端启用了 `withCredentials: true`
   - 服务端需要正确设置 CORS 头：`Access-Control-Allow-Credentials: true`

3. **Token 存储**
   - Token 同时保存在 localStorage 和 cookie 中
   - Cookie 默认有效期 24 小时
   - 建议定期检查 token 有效性

4. **安全考虑**
   - Token 是 JWT 格式的 ID token
   - 不要在 URL 中长期保留 token
   - 使用 HTTPS 传输敏感数据

## 故障排查

### 问题：登录后无法获取 token

**检查**：
1. 查看浏览器控制台，确认 callback URL 包含 `code=success&token=xxx`
2. 确认 `handleLoginCallback()` 被正确调用
3. 检查 localStorage 和 cookie 中是否保存了 token

### 问题：getUserInfo 返回 401

**原因**：Token 已过期或无效

**解决**：
1. 调用 `clearLocalAuth()` 清理认证数据
2. 重新登录

### 问题：登出后仍然有 token

**原因**：`clearLocalAuth()` 未正确执行

**解决**：
1. 检查浏览器控制台的错误信息
2. 手动清理 localStorage 和 cookie
3. 确保 `logout()` 方法被正确调用

## 完整示例

参见 `auth_client_usage_example.ts` 文件，包含：
- 初始化配置
- 登录/登出流程
- 认证状态检查
- 路由守卫集成（Vue/React）
- 自动 token 刷新

## 许可证

与 Stew 项目保持一致
