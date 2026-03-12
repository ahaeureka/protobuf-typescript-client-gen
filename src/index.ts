
// Main exports for the protobuf TypeScript client generator
export * from './plugin';

// Re-export auth client which should be browser-safe
export { default as AuthServiceClient, UpdateUserRequest, UploadAvatarRequest, UploadAvatarResponse } from "./auth_client";
export { OpenIDConnectCallbackRequest, LoginRequest, LogoutRequest, LoginCallbackResponse, LogoutCallbackRequest } from "./proto/authentication";
export { User, Address } from "./proto/user";
export { APIResponse } from "./proto/stew/api/v1/web";
export * as Authorization from "./proto/authorization";
export * as ApiKey from "./proto/apikey";
export * as Audit from "./proto/audit";

// Optional utility exports (for advanced usage)
export * from './websocket-utils';
export * from './sse-utils';
export * from './websocket-message-utils';

