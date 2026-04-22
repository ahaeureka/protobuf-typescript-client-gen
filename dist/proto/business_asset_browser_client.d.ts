import { ActivateAssetVersionRequest, ActivateAssetVersionResponse, AssetCollection, CreateDraftVersionRequest, CreateDraftVersionResponse, DeleteDraftEntryRequest, DeleteDraftEntryResponse, DiffAssetDraftRequest, DiffAssetDraftResponse, DiffAssetVersionsRequest, DiffAssetVersionsResponse, DiscardDraftVersionRequest, EnsureAssetCollectionRequest, ExportAssetEntryRequest, GetAssetCollectionRequest, GetAssetDiffEntryDetailRequest, GetAssetDiffEntryDetailResponse, GetAssetEntryTextRequest, GetAssetEntryTextResponse, GetAssetVersionRequest, GetAssetVersionResponse, ListAssetCollectionsRequest, ListAssetCollectionsResponse, ListAssetTreeRequest, ListAssetTreeResponse, ListAssetVersionsRequest, ListAssetVersionsResponse, PublishDraftVersionRequest, PublishDraftVersionResponse, RenameDraftEntryRequest, RenameDraftEntryResponse, UpdateDraftTextEntryRequest, UpdateDraftTextEntryResponse } from './business_asset_browser';
import { Empty } from './google/protobuf/empty';
import { HttpBody } from './google/api/httpbody';
export interface ClientConfig {
    baseUrl: string;
    timeout?: number;
}
export interface EmptyRequest {
}
export declare class V1Client {
    private client;
    private baseUrl;
    private accessToken;
    private tokenExpiry;
    constructor(config: ClientConfig);
    /**
     * 手动登出 - 清除所有认证状态
     * 公共方法，允许用户主动调用
     */
    logout(): void;
    /**
     * 清除所有认证状态
     * 当认证失败时调用，清除 localStorage、sessionStorage 和所有 Cookie
     */
    private clearAuthState;
    /**
     * 确保 session_id Cookie 已设置
     * 从 localStorage 读取 session_id，如果存在则设置到 Cookie
     */
    private ensureSessionCookie;
    /**
     * 从 localStorage/Cookie 获取 session_id
     */
    private getSessionId;
    private getToken;
    private getAuthHeaders;
    list_asset_collections(request: ListAssetCollectionsRequest, headers?: Record<string, string>): Promise<ListAssetCollectionsResponse>;
    get_asset_collection(request: GetAssetCollectionRequest, headers?: Record<string, string>): Promise<AssetCollection>;
    list_asset_tree(request: ListAssetTreeRequest, headers?: Record<string, string>): Promise<ListAssetTreeResponse>;
    list_asset_versions(request: ListAssetVersionsRequest, headers?: Record<string, string>): Promise<ListAssetVersionsResponse>;
    get_asset_version(request: GetAssetVersionRequest, headers?: Record<string, string>): Promise<GetAssetVersionResponse>;
    create_draft_version(request: CreateDraftVersionRequest, headers?: Record<string, string>): Promise<CreateDraftVersionResponse>;
    discard_draft_version(request: DiscardDraftVersionRequest, headers?: Record<string, string>): Promise<Empty>;
    get_asset_entry_text(request: GetAssetEntryTextRequest, headers?: Record<string, string>): Promise<GetAssetEntryTextResponse>;
    update_draft_text_entry(request: UpdateDraftTextEntryRequest, headers?: Record<string, string>): Promise<UpdateDraftTextEntryResponse>;
    rename_draft_entry(request: RenameDraftEntryRequest, headers?: Record<string, string>): Promise<RenameDraftEntryResponse>;
    delete_draft_entry(request: DeleteDraftEntryRequest, headers?: Record<string, string>): Promise<DeleteDraftEntryResponse>;
    diff_asset_versions(request: DiffAssetVersionsRequest, headers?: Record<string, string>): Promise<DiffAssetVersionsResponse>;
    diff_asset_draft(request: DiffAssetDraftRequest, headers?: Record<string, string>): Promise<DiffAssetDraftResponse>;
    get_asset_diff_entry_detail(request: GetAssetDiffEntryDetailRequest, headers?: Record<string, string>): Promise<GetAssetDiffEntryDetailResponse>;
    publish_draft_version(request: PublishDraftVersionRequest, headers?: Record<string, string>): Promise<PublishDraftVersionResponse>;
    activate_asset_version(request: ActivateAssetVersionRequest, headers?: Record<string, string>): Promise<ActivateAssetVersionResponse>;
    export_asset_entry(request: ExportAssetEntryRequest, headers?: Record<string, string>): Promise<HttpBody>;
    ensure_asset_collection(request: EnsureAssetCollectionRequest, headers?: Record<string, string>): Promise<AssetCollection>;
}
