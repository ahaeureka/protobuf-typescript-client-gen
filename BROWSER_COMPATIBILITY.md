# 浏览器兼容性指南

## 概述

本文档描述了如何解决 `TypeError: fs.readFileSync is not a function` 错误，以及如何确保生成的 TypeScript 客户端代码在浏览器和 Node.js 环境中都能正常工作。

## 问题背景

原始代码存在以下浏览器兼容性问题：

1. **直接导入 Node.js 的 `ws` 库**: 在浏览器中不可用
2. **直接使用浏览器 API**: 如 `localStorage`、`sessionStorage`、`document.cookie`，在 Node.js 中不可用
3. **WebSocket 事件处理**: 使用了 Node.js `ws` 库的 `.on()` 方法，而不是标准的 `addEventListener`

## 解决方案

### 1. 移除直接的 Node.js 依赖

**之前：**
```typescript
import WebSocket from 'ws';
```

**之后：**
```typescript
// 移除了直接导入，使用动态加载和跨平台兼容的方式
```

### 2. 添加跨平台 WebSocket 支持

**新增的 WebSocket 兼容层：**
```typescript
// WebSocket type declaration for cross-platform compatibility
declare class WebSocket {
  static readonly CONNECTING: number;
  static readonly OPEN: number;
  static readonly CLOSING: number;
  static readonly CLOSED: number;
  
  readonly CONNECTING: number;
  readonly OPEN: number;
  readonly CLOSING: number;
  readonly CLOSED: number;
  
  readonly readyState: number;
  readonly url: string;
  
  constructor(url: string, protocols?: string | string[], options?: any);
  
  close(code?: number, reason?: string): void;
  send(data: string | ArrayBuffer | Blob | ArrayBufferView): void;
  
  onopen: ((event: Event) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

// Cross-platform WebSocket factory
function createWebSocket(url: string, protocols?: string | string[], options?: any): WebSocket {
  if (typeof window !== 'undefined' && window.WebSocket) {
    // Browser environment - use native WebSocket
    return new window.WebSocket(url, protocols);
  } else if (typeof global !== 'undefined') {
    // Node.js environment - try to require ws
    try {
      const WS = require('ws');
      return new WS(url, protocols, options);
    } catch (e) {
      throw new Error('WebSocket support not available. Please install the "ws" package for Node.js environments.');
    }
  } else {
    throw new Error('WebSocket support not available in this environment.');
  }
}
```

### 3. 环境检测和 Token 获取

**之前：**
```typescript
private getToken(): string | null {
  // 直接使用浏览器 API，在 Node.js 中会报错
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  // ...
}
```

**之后：**
```typescript
private getToken(): string | null {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Browser environment - use localStorage, sessionStorage, and cookies
    
    // 从localStorage获取token
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (token) {
        return token;
      }
    }
    
    // 从sessionStorage获取token
    if (typeof sessionStorage !== 'undefined') {
      const sessionToken = sessionStorage.getItem('token') || sessionStorage.getItem('access_token');
      if (sessionToken) {
        return sessionToken;
      }
    }
    
    // 从cookie获取token（如果使用cookie存储）
    if (typeof document !== 'undefined' && document.cookie) {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'token' || name === 'access_token') {
          return decodeURIComponent(value);
        }
      }
    }
  } else if (typeof process !== 'undefined' && process.env) {
    // Node.js environment - try to get token from environment variables
    return process.env.ACCESS_TOKEN || process.env.TOKEN || null;
  }
  
  return null;
}
```

### 4. 标准化 WebSocket 事件处理

**之前：**
```typescript
ws.on('open', async () => { /* ... */ });
ws.on('message', (data: WebSocket.Data) => { /* ... */ });
ws.on('error', (error) => { /* ... */ });
ws.on('close', () => { /* ... */ });
```

**之后：**
```typescript
// Set up event handlers
if (ws.addEventListener) {
  ws.addEventListener('open', onOpen);
  ws.addEventListener('message', onMessage);
  ws.addEventListener('error', onError);
  ws.addEventListener('close', onClose);
} else {
  // Fallback for ws library
  ws.onopen = onOpen;
  ws.onmessage = onMessage;
  ws.onerror = onError;
  ws.onclose = onClose;
}
```

## 环境支持

### 浏览器环境
- ✅ 使用原生 `WebSocket` API
- ✅ 支持 `localStorage`、`sessionStorage`、`document.cookie`
- ✅ 标准的 `addEventListener` 事件处理

### Node.js 环境
- ✅ 动态加载 `ws` 库（需要安装）
- ✅ 从环境变量获取 token（`ACCESS_TOKEN` 或 `TOKEN`）
- ✅ 兼容 `ws` 库的 `.on()` 事件处理方式

### Web Components / 混合环境
- ✅ 自动检测运行环境
- ✅ 优雅降级处理
- ✅ 错误提示和异常处理

## 使用示例

### 浏览器中使用

```html
<!DOCTYPE html>
<html>
<head>
    <script type="module">
        import { GeneratedClient } from './generated_client.js';
        
        // 设置 token
        localStorage.setItem('token', 'your-access-token');
        
        const client = new GeneratedClient({
            baseUrl: 'https://api.example.com'
        });
        
        // 使用客户端
        const response = await client.get_user({ id: '123' });
        console.log(response);
    </script>
</head>
<body>
</body>
</html>
```

### Node.js 中使用

```bash
# 安装 WebSocket 支持
npm install ws
```

```javascript
// 设置环境变量
process.env.TOKEN = 'your-access-token';

const { GeneratedClient } = require('./generated_client');

const client = new GeneratedClient({
    baseUrl: 'https://api.example.com'
});

// 使用客户端
client.get_user({ id: '123' }).then(response => {
    console.log(response);
});
```

## 最佳实践

1. **Token 管理**: 在浏览器中使用 `localStorage` 或 `sessionStorage`，在 Node.js 中使用环境变量
2. **WebSocket 依赖**: 在 Node.js 项目中确保安装了 `ws` 包
3. **错误处理**: 始终处理 WebSocket 连接失败的情况
4. **环境检测**: 使用 `typeof window !== 'undefined'` 检测浏览器环境

## 测试

运行兼容性测试：

```bash
node test-browser-compat.js
```

测试覆盖：
- ✅ 浏览器环境模拟
- ✅ Node.js 环境测试
- ✅ WebSocket 创建和事件处理
- ✅ Token 获取机制
- ✅ 错误处理

## 总结

通过这些修改，生成的 TypeScript 客户端代码现在可以：

1. 在浏览器和 Node.js 环境中无缝运行
2. 自动检测环境并使用适当的 API
3. 提供优雅的错误处理和降级机制
4. 保持相同的 API 接口，无需修改使用方代码

这确保了无论是在 Web 应用、Web Components、还是 Node.js 服务中，都能正常使用生成的客户端代码。
