# protobuf-typescript-client-gen

Stew 的独立 TypeScript protoc 插件包。

当前这个仓库只负责一件事：把 .proto 生成成浏览器侧可用的 Axios 客户端。

公共运行时客户端与 React UI 已迁到 stew-sdk-react，管理端生成产物直接输出到 stew-dashboard。

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
- 只在你需要自定义 codegen 流程时，才直接引用这个插件包
