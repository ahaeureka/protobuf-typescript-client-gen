# protobuf-typescript-client-gen

Stew 的独立 TypeScript protoc 插件包。

当前这个仓库只负责一件事：把 .proto 生成成浏览器侧可用的 Axios 客户端。

公共运行时客户端与 React UI 已迁到 stew-sdk-react，管理端生成产物直接输出到 stew-dashboard。

从当前版本开始，生成器只负责 transport client 生成，不再在 generated client 内嵌浏览器 token、cookie、session 同步与 401 清理逻辑。

这个包现在可以作为独立 Git 仓库直接安装。安装后可执行文件名为 protoc-gen-ts_client。

## 当前边界

- 生成器入口：dist/plugin.js
- 二进制名：protoc-gen-ts_client
- 仓库内标准调用方：/app/proto/Makefile
- 公共运行时消费方：/app/stew-sdk-react
- 管理端消费方：/app/stew-dashboard

不要再从这个包根入口导入 AuthServiceClient、FileStorageClient、AssetBrowserClient 或任何 UI 组件。

## 安装

### 从 GitHub 安装

```bash
pnpm add -D github:ahaeureka/protobuf-typescript-client-gen
```

### 本地仓库开发

```bash
cd /app/protobuf-typescript-client-gen
pnpm install
pnpm build
```

说明：为了支持直接通过 GitHub 安装后立即执行，仓库内会提交 dist/plugin.js 以及 dist/google/api 下的运行时依赖文件。

## 构建

```bash
cd /app/protobuf-typescript-client-gen
pnpm install
pnpm build
```

构建后会得到：

- dist/plugin.js
- dist/plugin.d.ts
- dist/google/api/* 运行时依赖文件

## 标准消费方式

如果你在 Stew monorepo 内使用，标准入口是 /app/proto/package.json 和 /app/proto/Makefile。

它们会从已安装依赖中解析：

- node_modules/.bin/protoc-gen-ts_client
- node_modules/stew-sdk-react/src/websocket-utils.ts
- node_modules/stew-sdk-react/src/websocket-message-utils.ts
- node_modules/stew-sdk-react/src/sse-utils.ts

## 运行时注入约定

生成出来的 client 现在支持通过外部 axios runtime 注入鉴权与业务边界头：

```ts
import axios from 'axios';
import {
  applyCustomHeaderInterceptor,
  applySessionAuthInterceptor,
} from 'stew-sdk-react/auth';

const axiosInstance = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

applySessionAuthInterceptor(axiosInstance, {
  getToken: () => localStorage.getItem('token'),
});

applyCustomHeaderInterceptor(axiosInstance, () => ({
  'x-business-id': businessId,
}));

const client = new SkillServiceClient({
  baseUrl,
  axiosInstance,
});
```

如果你不直接传入 `axiosInstance`，也可以使用 `configureAxios(instance)` 在生成 client 创建默认实例后补充拦截器。

这意味着：

- generated client 默认只保留 `baseUrl`、`timeout` 和基础 `Content-Type`
- 浏览器鉴权运行时由上层 SDK 或业务项目决定
- 重新生成不会再把 `ensureSessionCookie`、`getToken`、`clearAuthState` 复制进每个 client 文件

## 仓库内的标准用法

```bash
cd /app/protobuf-typescript-client-gen
pnpm build

cd /app/proto
make ts-public
make ts-admin
make ts
```

对应输出目录：

- make ts-public -> /app/stew-sdk-react/src/generated/proto
- make ts-admin -> /app/stew-dashboard/lib/gateway/generated
- make ts -> 同时更新上述两处

## 仓库外手动调用

```bash
protoc \
  --plugin=protoc-gen-ts_client=/absolute/path/to/dist/plugin.js \
  --ts_client_out=ts_out=./generated,axios_out=./generated:./generated \
  --proto_path=./proto \
  ./proto/order_service.proto
```

## 迁移说明

- 业务前端运行时请使用 stew-sdk-react
- 资产浏览 UI 已并入 stew-sdk-react
- 浏览器鉴权逻辑请挂到外部 axios instance 或 `configureAxios`，不要再依赖 generated client 内置认证
- 只在你需要自定义 codegen 流程时，才直接引用这个插件包
