
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
export * as BusinessAssetBrowser from "./proto/business_asset_browser";
export { HttpBody } from "./proto/google/api/httpbody";

// Anonymous user session management
export { AnonymousUserClient } from './anonymous_client';
export type { AnonymousSession, AnonymousUserClientOptions } from './anonymous_client';
export type { FingerprintComponents } from './fingerprint-utils';
export { hashComponents, collectFingerprintComponents } from './fingerprint-utils';

// Optional utility exports (for advanced usage)
export * from './websocket-utils';
export * from './sse-utils';
export * from './websocket-message-utils';

// File storage client
export { FileStorageClient } from './file_client';
export type {
    FileInfo,
    UploadResponse,
    ListFilesResponse,
    UploadPartResult,
    ResumableUploadProgress,
    FileStorageClientOptions,
} from './file_client';

// Asset browser client
export { AssetBrowserClient } from './asset_browser_client';
export type {
    AssetBrowserClientOptions,
    AssetCollection,
    AssetVersionSummary,
    AssetTreeEntry,
    AssetDiffSummary,
    AssetDiffEntry,
    ListCollectionsResult,
    ListTreeResult,
    ListVersionsResult,
    CreateDraftResult,
    EntryTextResult,
    SaveTextResult,
    DiffResult,
    DiffEntryDetailResult,
    PublishResult,
    ActivateResult,
    DownloadEntryResult,
} from './asset_browser_client';

export {
    BusinessAssetBrowserServiceClientImpl,
    BusinessAssetBrowserServiceServiceName,
    ExportAssetEntryRequest,
} from './proto/business_asset_browser';

