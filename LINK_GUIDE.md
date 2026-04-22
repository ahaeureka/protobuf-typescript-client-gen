# Deprecated Guide

`/app/web` has been deprecated.

This guide used to describe how to link `protobuf-typescript-client-gen` into `/app/web`.
That workflow is no longer valid.

TypeScript clients are now generated through `/app/proto/Makefile` with the local
`protoc-gen-ts_client` plugin.

Recommended workflow:

```bash
cd /app/protobuf-typescript-client-gen
pnpm install
pnpm build

cd /app/proto
make ts
```

Generated outputs:

- Public/business SDK: `/app/stew-sdk-react/src/generated/proto`
- Admin/dashboard clients: `/app/stew-dashboard/lib/gateway/generated`

Do not link generated clients back into `/app/web`.

If you need browser-facing SDK APIs, consume `/app/stew-sdk-react` instead.
