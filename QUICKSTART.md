# 🚀 快速开始指南

## 5 分钟集成 Stew 认证客户端

### 步骤 1: 查看修正后的代码

打开 `/app/protobuf-typescript-client-gen/src/auth_client.ts` 查看修正后的客户端实现。

### 步骤 2: 在你的项目中使用

```typescript
import AuthServiceClient from './auth_client';

// 创建客户端实例
const authClient = new AuthServiceClient(
    'http://localhost:3012',           // Stew Gateway URL
    'http://localhost:5173/callback',  // 登录成功回调 URL
    'http://localhost:5173/'           // 登出后跳转 URL
);

export default authClient;
```

### 步骤 3: 创建登录页面

```typescript
// pages/Login.tsx
import authClient from '@/auth';

export default function LoginPage() {
    return (
        <div>
            <h1>登录</h1>
            <button onClick={() => authClient.login()}>
                使用 OIDC 登录
            </button>
        </div>
    );
}
```

### 步骤 4: 创建回调页面 ⚠️ 重要

```typescript
// pages/Callback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authClient from '@/auth';

export default function CallbackPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // 处理登录回调
        const result = authClient.handleLoginCallback();
        
        if (result.success) {
            console.log('✅ 登录成功');
            navigate('/dashboard');
        } else {
            console.error('❌ 登录失败:', result.error);
            navigate('/login');
        }
    }, []);

    return <div>正在处理登录...</div>;
}
```

### 步骤 5: 添加路由守卫

```typescript
// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import authClient from '@/auth';

export default function ProtectedRoute({ children }) {
    if (!authClient.isAuthenticated() || !authClient.isTokenValid()) {
        return <Navigate to="/login" />;
    }
    
    return <>{children}</>;
}

// 在路由中使用
<Route path="/dashboard" element={
    <ProtectedRoute>
        <Dashboard />
    </ProtectedRoute>
} />
```

### 步骤 6: 添加登出功能

```typescript
// components/Header.tsx
import authClient from '@/auth';

export default function Header() {
    return (
        <header>
            <button onClick={() => authClient.logout()}>
                登出
            </button>
        </header>
    );
}
```

## 🎯 核心 API

| 方法 | 作用 | 使用场景 |
|------|------|----------|
| `login()` | 发起登录 | 登录按钮点击 |
| `handleLoginCallback()` | 处理回调 | Callback 页面 |
| `logout()` | 登出 | 登出按钮点击 |
| `getUserInfo()` | 获取用户信息 | 加载用户资料 |
| `isAuthenticated()` | 检查登录状态 | 路由守卫 |
| `isTokenValid()` | 检查 token 有效性 | 路由守卫 |

## ⚡ 关键流程

### 完整的登录流程

```
用户点击登录
  ↓
authClient.login()
  ↓
重定向到 OIDC Provider
  ↓
用户输入账号密码
  ↓
OIDC Provider 回调服务端
  ↓
服务端验证并获取 token
  ↓
重定向到客户端 callback 页面
  ↓
authClient.handleLoginCallback() ⭐ 关键
  ↓
提取并保存 token
  ↓
跳转到应用主页
```

## 🎨 演示页面

想快速体验？打开演示页面：

```bash
# 复制演示页面到 public 目录
cp /app/protobuf-typescript-client-gen/demo.html /path/to/your/public/

# 在浏览器中打开
open http://localhost:5173/demo.html
```

演示页面功能：
- ✅ 可视化认证状态
- ✅ 一键测试登录/登出
- ✅ 实时日志输出
- ✅ Token 状态检查

## 📚 更多资源

- **完整文档**: `AUTH_CLIENT_README.md` - 详细的 API 文档和使用指南
- **变更说明**: `AUTH_CLIENT_CHANGELOG.md` - 技术细节和修正原因
- **代码示例**: `auth_client_usage_example.ts` - 真实集成示例
- **总结文档**: `SUMMARY.md` - 修正概述和关键改进

## ⚠️ 常见问题

### Q1: 登录后没有 token？

**检查**:
1. Callback 页面是否调用了 `handleLoginCallback()`
2. URL 参数中是否包含 `code=success&token=xxx`
3. 浏览器控制台是否有错误

### Q2: 获取用户信息返回 401？

**原因**: Token 无效或已过期

**解决**:
```typescript
if (!authClient.isTokenValid()) {
    authClient.clearLocalAuth();
    window.location.href = '/login';
}
```

### Q3: 跨域问题？

**服务端配置**:
```rust
// 需要配置 CORS
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```

## 🔧 配置检查清单

- [ ] Stew Gateway 正常运行 (`http://localhost:3012`)
- [ ] OIDC Provider 配置正确
- [ ] Redirect URI 已注册 (`http://localhost:3012/auth/callback`)
- [ ] Callback 页面路由已配置 (`/callback`)
- [ ] CORS 配置已启用 (`withCredentials: true`)

## 🎉 完成

现在你的应用已经集成了 Stew 的 OIDC 认证！

**测试流程**:
1. 访问登录页面
2. 点击登录按钮
3. 在 OIDC Provider 完成登录
4. 自动跳转回应用
5. 享受认证保护的应用！

---

**需要帮助？** 查看详细文档或演示页面。
