# protobuf-typescript-client-gen

Stew gRPC/HTTP 网关的 TypeScript 前端 SDK，提供：

- **自动生成的业务服务客户端** — 基于 `.proto` 文件由 protoc 插件生成，封装 Axios，自动处理认证
- **OIDC 认证客户端** (`AuthServiceClient`) — 完整的 Session 认证流程封装
- **TypeScript 类型定义** — 从 `.proto` 生成的 Protobuf 消息类型
- **流式支持** — WebSocket（双向流/客户端流）和 SSE（服务端流）

---

## 安装

### 方式一：本地工作区引用（Monorepo）

在项目的 `package.json` 中：

```json
{
  "dependencies": {
    "protobuf-typescript-client-gen": "link:../protobuf-typescript-client-gen",
    "axios": "^1.11.0"
  }
}
```

然后执行：

```bash
pnpm install
```

### 方式二：git 仓库安装

```bash
pnpm add git+https://github.com/your-org/protobuf-typescript-client-gen.git

# 指定分支/tag
pnpm add github:your-org/protobuf-typescript-client-gen#main
pnpm add github:your-org/protobuf-typescript-client-gen#v1.0.1
```

### 方式三：构建后使用

```bash
# 在本包目录下构建
pnpm install
pnpm build

# 构建产物在 dist/ 目录
```

---

## 项目结构

```
protobuf-typescript-client-gen/
├── src/
│   ├── index.ts                  # 主入口，统一导出
│   ├── auth_client.ts            # OIDC 认证客户端
│   ├── plugin.ts                 # protoc 插件（生成业务客户端代码）
│   ├── sse-utils.ts              # Server-Sent Events 工具
│   ├── websocket-utils.ts        # WebSocket 工具
│   ├── websocket-message-utils.ts
│   ├── google/api/               # google.api proto JS 实现
│   └── proto/                    # 内置 Protobuf 消息类型
│       ├── authentication.ts
│       ├── user.ts
│       ├── apikey.ts
│       ├── audit.ts
│       ├── authorization.ts
│       ├── service_discovery.ts
│       ├── helloworld.ts
│       └── stew/api/v1/
│           ├── context.ts        # ClientContext / Tenant 类型
│           ├── web.ts            # APIResponse / Code 枚举
│           └── options.ts
├── bin/
│   ├── protoc                    # protoc 二进制（Linux x86_64）
│   └── protoc-gen-js
├── dist/                         # 构建产物（TypeScript 编译输出）
├── tsconfig.json
└── package.json
```

---

## 快速开始

### 一、OIDC 登录集成

#### 1. 初始化认证客户端

```typescript
// src/auth.ts
import AuthServiceClient from 'protobuf-typescript-client-gen/src/auth_client';

export const authClient = new AuthServiceClient(
  'http://localhost:3012',              // Stew 网关地址
  'http://localhost:5173/auth/callback', // 登录成功后的回调 URL
  'http://localhost:5173/'              // 登出后跳转 URL
);
```

#### 2. 登录页面

```typescript
// pages/Login.tsx
import { authClient } from '@/auth';

function LoginPage() {
  const handleLogin = () => {
    // 方式一：使用 AuthServiceClient（会自动拼接 callback 参数）
    authClient.login();

    // 方式二：手动跳转（更灵活）
    const callback = encodeURIComponent(window.location.origin + '/auth/callback');
    window.location.href = `/auth/login?callback=${callback}`;
  };

  return <button onClick={handleLogin}>使用 OIDC 登录</button>;
}
```

#### 3. 回调页面（必须实现）

```typescript
// pages/Auth/Callback.tsx
import { useEffect } from 'react';

export default function AuthCallback() {
  useEffect(() => {
    // 网关登录成功后跳转格式：
    // /auth/callback?code=success
    // 服务端已通过 Set-Cookie 设置 HttpOnly session cookie，无需客户端处理
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code === 'success') {
      window.location.href = '/dashboard';
    } else {
      const msg = params.get('message') || '登录失败';
      console.error('Login failed:', msg);
      window.location.href = `/login?error=${encodeURIComponent(msg)}`;
    }
  }, []);

  return <div>正在处理登录...</div>;
}
```

#### 4. 路由守卫

```typescript
// 推荐：在应用顶层通过服务端验证获取用户状态，然后在路由守卫中使用
function ProtectedRoute({ children }) {
  const { currentUser } = useAppContext(); // 来自 getInitialState 或等效服务端验证

  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
}
```

#### 5. 登出

```typescript
import { authClient } from '@/auth';

// 方式一：使用 AuthServiceClient
authClient.logout(); // 清除本地数据并跳转到网关登出端点

// 方式二：手动
function logout() {
  const callback = encodeURIComponent(window.location.origin + '/login');
  window.location.href = `/auth/logout?callback=${callback}`;
}
```

#### 6. 获取当前用户

```typescript
import { authClient } from '@/auth';

// 通过认证客户端（依赖 HttpOnly Cookie，无需手动传 token）
const { user, session_id, expires_at } = await authClient.getCurrentUser();

// 验证 session 是否有效（推荐在应用启动时调用）
const { valid, user_id } = await authClient.validateSession();

// 刷新 token
const { access_token } = await authClient.refreshToken();
```

---

### 二、使用生成的业务服务客户端

业务客户端由 protoc 插件从 `.proto` 文件自动生成。生成后放入 `src/services/` 目录。

#### 调用接口示例

```typescript
// src/services/order_client.ts 由 protoc 插件生成
import { OrderClient } from './services/order_client';

const client = new OrderClient({
  baseUrl: window.location.origin, // 指向 Stew 网关
  timeout: 30000,
});

// GET 接口（路径参数自动替换）
const order = await client.get_order({ order_id: 'ord-123' });

// POST 接口
const newOrder = await client.create_order({
  product_id: 'prod-456',
  quantity: 2,
});
```

客户端会自动：
- 使用 `withCredentials: true` 确保请求携带 HttpOnly Cookie
- 遇到 `401` 时清除内部认证状态

#### 使用 protoc 插件生成客户端

```bash
# 将 bin/ 加入 PATH 或直接引用
export PATH="$PATH:./protobuf-typescript-client-gen/bin"

protoc \
  --plugin=protoc-gen-ts_client=./node_modules/.bin/protoc-gen-ts_client \
  --ts_client_out=./src/services \
  --proto_path=./proto \
  --proto_path=/path/to/stew/proto \
  --proto_path=/path/to/googleapis \
  ./proto/order_service.proto
```

---

### 三、类型导入

```typescript
// 认证相关类型
import {
  AuthServiceClient,
  LoginRequest,
  LogoutRequest,
  LoginCallbackResponse,
  User,
} from 'protobuf-typescript-client-gen';

// 客户端上下文（网关注入，gRPC 服务端可读取）
import type {
  ClientContext,
  Tenant,
} from 'protobuf-typescript-client-gen/src/proto/stew/api/v1/context';

// 统一响应格式
import type { APIResponse } from 'protobuf-typescript-client-gen/src/proto/stew/api/v1/web';
import { Code } from 'protobuf-typescript-client-gen/src/proto/stew/api/v1/web';

// API Key
import * as ApiKey from 'protobuf-typescript-client-gen/src/proto/apikey';
```

---

### 四、流式接口

#### Server-Sent Events（服务端推送流）

```typescript
import { parseSSEChunk } from 'protobuf-typescript-client-gen/src/sse-utils';
import { OrderUpdate } from './services/proto/order';

const response = await fetch('/api/v1/orders/stream', {
  credentials: 'include', // 携带 Cookie
  headers: { Accept: 'text/event-stream' },
});

const reader = response.body!.getReader();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const { messages, buffer: next } = parseSSEChunk(value, buffer, OrderUpdate, false);
  buffer = next;

  for (const msg of messages) {
    console.log('推送消息:', msg);
  }
}
```

#### WebSocket（双向流）

```typescript
import { createWebSocket, buildWebSocketUrl } from 'protobuf-typescript-client-gen/src/websocket-utils';

const ws = createWebSocket(buildWebSocketUrl('http://localhost:3012', '/api/v1/chat/stream'));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到:', data);
};

ws.onopen = () => {
  ws.send(JSON.stringify({ message: 'hello' }));
};
```

---

## 认证 API 端点参考

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/auth/login?callback=<url>` | 发起 OIDC 登录，302 跳转到 IDP |
| GET | `/auth/callback` | OIDC 回调，设置 HttpOnly Cookie，302 跳转回前端 |
| GET | `/auth/logout?callback=<url>` | 登出，清除 session，302 跳转到 IDP 登出端点 |
| GET | `/auth/me` | 获取当前用户信息（依赖 Cookie） |
| POST | `/auth/session/validate` | 验证 session 有效性 |
| POST | `/auth/token/refresh` | 刷新 access_token |

回调 URL 参数格式：

```
成功：<callback_url>?code=success
失败：<callback_url>?code=error&message=<error_message>
```

---

## session 认证机制说明

```
OIDC 登录完成
    |
    v
网关设置 HttpOnly Cookie（session_id）   <- 所有 API 请求的实际认证凭证
    |
    v
302 跳转到前端 /auth/callback?code=success
    |
    v
前端检查 code=success，跳转到 /dashboard（无需客户端存储 session_id）
    |
    v
后续请求：浏览器自动携带 HttpOnly Cookie
网关验证 Cookie -> 注入 x-user-id 等用户头 -> 转发到业务 gRPC 服务
```

**重要：**
- `HttpOnly Cookie` 无法被 JavaScript 读取，可防止 XSS 攻击窃取 token
- 客户端不存储 session_id，登录状态通过服务端 `/auth/me` 验证
- 回调 URL 中不携带 session_id，避免 URL 泄露风险

---

## APIResponse 响应格式

网关统一响应包装（通过 proto `http_response` 选项开启）：

```json
{ "code": 2000, "message": "success", "data": { ... } }
```

`Code` 枚举值：

| 枚举 | 值 | 含义 |
|---|---|---|
| `OK` | 2000 | 成功 |
| `PARAMS_ERROR` | 4000 | 参数错误 |
| `AUTH_ERROR` | 4001 | 认证失败 |
| `PREMISSION_DENIED` | 4003 | 权限不足 |
| `NOT_FOUND` | 4004 | 资源不存在 |
| `INTERNAL_ERROR` | 5000 | 服务器错误 |

生成的 Axios 客户端已自动处理 `data` 字段解包，业务代码直接获得强类型消息对象。

---

## 注意事项

1. **回调页面必须实现** — 网关登录成功后 302 跳转到 callback URL，该页面检查 `code=success` 后跳转到主页
2. **CORS 与 Cookie** — 跨域场景需确保网关配置 `Access-Control-Allow-Credentials: true`，客户端请求使用 `withCredentials: true`
3. **HTTPS** — 生产环境必须使用 HTTPS，否则 Cookie 安全标志可能导致认证失败
4. **OIDC Provider 配置** — 前端回调 URL 必须在 OIDC Provider 的允许重定向列表中注册
