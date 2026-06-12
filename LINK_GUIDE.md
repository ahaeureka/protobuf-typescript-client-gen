# 🔗 如何使用 pnpm link 将客户端链接到 Web 项目

## 方法一：使用 pnpm link（推荐用于开发）

### 步骤 1: 在客户端项目中构建并注册全局链接

```bash
# 进入客户端项目目录
cd /app/protobuf-typescript-client-gen

# 安装依赖（如果还没安装）
pnpm install

# 构建 TypeScript 代码
pnpm build

# 创建全局链接
pnpm link --global
```

**输出示例**：
```
+ protobuf-typescript-client-gen 1.0.0
```

### 步骤 2: 在 Web 项目中链接该依赖

```bash
# 进入 Web 项目目录
cd /app/web

# 链接客户端包
pnpm link --global protobuf-typescript-client-gen
```

**输出示例**：
```
+ protobuf-typescript-client-gen 1.0.0 <- ../protobuf-typescript-client-gen
```

### 步骤 3: 在 Web 项目中使用

现在可以在 Web 项目中导入使用了：

```typescript
// 在任意 .ts 或 .tsx 文件中
import AuthServiceClient from 'protobuf-typescript-client-gen';
// 或者
import { AuthServiceClient, User } from 'protobuf-typescript-client-gen';

// 创建客户端实例
const authClient = new AuthServiceClient(
    'http://localhost:3012',
    'http://localhost:5173/callback',
    'http://localhost:5173/'
);

// 使用
await authClient.login();
```

### 步骤 4: 开发时自动重新构建（可选）

如果你在开发客户端代码，可以开启监听模式：

```bash
# 在客户端项目中
cd /app/protobuf-typescript-client-gen
pnpm watch
```

这样每次修改 TypeScript 代码都会自动重新编译。

---

## 方法二：使用本地 workspace 协议（推荐用于 monorepo）

### 修改 Web 项目的 package.json

```json
{
  "dependencies": {
    "protobuf-typescript-client-gen": "workspace:*"
  }
}
```

### 然后安装

```bash
cd /app/web
pnpm install
```

---

## 方法三：使用相对路径（简单但不灵活）

### 修改 Web 项目的 package.json

```json
{
  "dependencies": {
    "protobuf-typescript-client-gen": "file:../protobuf-typescript-client-gen"
  }
}
```

### 然后安装

```bash
cd /app/web
pnpm install
```

---

## 验证链接是否成功

### 1. 检查 node_modules

```bash
cd /app/web
ls -la node_modules/protobuf-typescript-client-gen
```

应该看到一个符号链接指向客户端项目。

### 2. 在代码中测试导入

创建一个测试文件 `/app/web/src/test-auth.ts`:

```typescript
import AuthServiceClient from 'protobuf-typescript-client-gen';

console.log('AuthServiceClient:', AuthServiceClient);

const client = new AuthServiceClient(
    'http://localhost:3012',
    'http://localhost:5173/callback',
    'http://localhost:5173/'
);

console.log('Client created:', client);
console.log('Is authenticated:', client.isAuthenticated());
```

### 3. 运行开发服务器

```bash
cd /app/web
pnpm dev
```

如果没有错误，说明链接成功！

---

## 解除链接

### 如果需要解除链接

```bash
# 在 Web 项目中
cd /app/web
pnpm unlink protobuf-typescript-client-gen

# 在客户端项目中（解除全局链接）
cd /app/protobuf-typescript-client-gen
pnpm unlink --global
```

---

## 常见问题

### Q1: 链接后导入报错 "Cannot find module"

**原因**: 客户端代码未构建或构建失败

**解决**:
```bash
cd /app/protobuf-typescript-client-gen
pnpm build
```

### Q2: 链接后代码修改不生效

**原因**: 未重新构建

**解决**:
```bash
# 方法 1: 手动重新构建
cd /app/protobuf-typescript-client-gen
pnpm build

# 方法 2: 使用监听模式
cd /app/protobuf-typescript-client-gen
pnpm watch
```

### Q3: TypeScript 类型定义找不到

**检查**:
1. `dist/index.d.ts` 是否存在
2. `package.json` 中 `"types": "dist/index.d.ts"` 是否正确
3. 重启 TypeScript 服务器（VS Code: Cmd+Shift+P -> "TypeScript: Restart TS Server"）

### Q4: pnpm link 命令失败

**可能原因**:
- pnpm 版本过旧
- 权限问题

**解决**:
```bash
# 更新 pnpm
npm install -g pnpm@latest

# 或使用 sudo（如果是权限问题）
sudo pnpm link --global
```

---

## 推荐的开发工作流

### 终端 1: 客户端监听构建
```bash
cd /app/protobuf-typescript-client-gen
pnpm watch
```

### 终端 2: Web 项目开发服务器
```bash
cd /app/web
pnpm dev
```

这样修改客户端代码后，会自动编译，Web 项目也会热重载！

---

## 完整的一键脚本

创建 `/app/scripts/link-client.sh`:

```bash
#!/bin/bash

echo "🔧 构建客户端..."
cd /app/protobuf-typescript-client-gen
pnpm install
pnpm build

echo "🔗 创建全局链接..."
pnpm link --global

echo "🌐 链接到 Web 项目..."
cd /app/web
pnpm link --global protobuf-typescript-client-gen

echo "✅ 链接完成！"
echo ""
echo "现在可以在 Web 项目中使用:"
echo "  import AuthServiceClient from 'protobuf-typescript-client-gen';"
echo ""
echo "开发时建议开启监听模式:"
echo "  cd /app/protobuf-typescript-client-gen && pnpm watch"
```

### 使用脚本

```bash
chmod +x /app/scripts/link-client.sh
/app/scripts/link-client.sh
```

---

## 总结

**最佳实践**：

1. ✅ **开发阶段**: 使用 `pnpm link`
   - 方便调试和修改
   - 实时同步代码变更

2. ✅ **生产环境**: 发布到 npm 或使用 workspace 协议
   - 版本管理更清晰
   - 构建更稳定

3. ✅ **持续开发**: 配合 `pnpm watch` 使用
   - 自动编译
   - 提高开发效率

现在开始使用 `pnpm link` 吧！🚀
