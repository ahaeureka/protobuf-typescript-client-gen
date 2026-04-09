import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { HttpBody } from "./google/api/httpbody";
import { Empty } from "./google/protobuf/empty";
export declare const protobufPackage = "stew.api.v1";
export declare enum AssetScopeKind {
    ASSET_SCOPE_KIND_UNSPECIFIED = 0,
    ASSET_SCOPE_KIND_USER = 1,
    ASSET_SCOPE_KIND_SERVICE = 2,
    ASSET_SCOPE_KIND_TENANT = 3,
    ASSET_SCOPE_KIND_GLOBAL = 4,
    UNRECOGNIZED = -1
}
export declare function assetScopeKindFromJSON(object: any): AssetScopeKind;
export declare function assetScopeKindToJSON(object: AssetScopeKind): string;
export declare enum AssetVersionStatus {
    ASSET_VERSION_STATUS_UNSPECIFIED = 0,
    ASSET_VERSION_STATUS_DRAFT = 1,
    ASSET_VERSION_STATUS_READY = 2,
    ASSET_VERSION_STATUS_ARCHIVED = 3,
    ASSET_VERSION_STATUS_FAILED = 4,
    UNRECOGNIZED = -1
}
export declare function assetVersionStatusFromJSON(object: any): AssetVersionStatus;
export declare function assetVersionStatusToJSON(object: AssetVersionStatus): string;
export declare enum AssetEntryKind {
    ASSET_ENTRY_KIND_UNSPECIFIED = 0,
    ASSET_ENTRY_KIND_FILE = 1,
    ASSET_ENTRY_KIND_DIRECTORY = 2,
    UNRECOGNIZED = -1
}
export declare function assetEntryKindFromJSON(object: any): AssetEntryKind;
export declare function assetEntryKindToJSON(object: AssetEntryKind): string;
export declare enum AssetDiffMode {
    ASSET_DIFF_MODE_UNSPECIFIED = 0,
    ASSET_DIFF_MODE_STRUCTURE_ONLY = 1,
    ASSET_DIFF_MODE_WITH_TEXT = 2,
    UNRECOGNIZED = -1
}
export declare function assetDiffModeFromJSON(object: any): AssetDiffMode;
export declare function assetDiffModeToJSON(object: AssetDiffMode): string;
export declare enum AssetChangeType {
    ASSET_CHANGE_TYPE_UNSPECIFIED = 0,
    ASSET_CHANGE_TYPE_ADDED = 1,
    ASSET_CHANGE_TYPE_REMOVED = 2,
    ASSET_CHANGE_TYPE_MODIFIED = 3,
    ASSET_CHANGE_TYPE_RENAMED = 4,
    ASSET_CHANGE_TYPE_TYPE_CHANGED = 5,
    UNRECOGNIZED = -1
}
export declare function assetChangeTypeFromJSON(object: any): AssetChangeType;
export declare function assetChangeTypeToJSON(object: AssetChangeType): string;
export declare enum AssetTextDiffStatus {
    ASSET_TEXT_DIFF_STATUS_UNSPECIFIED = 0,
    ASSET_TEXT_DIFF_STATUS_NOT_REQUESTED = 1,
    ASSET_TEXT_DIFF_STATUS_READY = 2,
    ASSET_TEXT_DIFF_STATUS_BINARY = 3,
    ASSET_TEXT_DIFF_STATUS_TOO_LARGE = 4,
    ASSET_TEXT_DIFF_STATUS_LOSSY = 5,
    ASSET_TEXT_DIFF_STATUS_ERROR = 6,
    UNRECOGNIZED = -1
}
export declare function assetTextDiffStatusFromJSON(object: any): AssetTextDiffStatus;
export declare function assetTextDiffStatusToJSON(object: AssetTextDiffStatus): string;
export interface AssetCapabilities {
    can_edit: boolean;
    can_rename: boolean;
    can_delete: boolean;
    can_create_draft: boolean;
    can_publish: boolean;
    can_activate: boolean;
}
export interface AssetCollection {
    asset_space: string;
    asset_id: string;
    display_name: string;
    description: string;
    scope_kind: AssetScopeKind;
    scope_value: string;
    active_version_id: string;
    draft_version_id: string;
    has_draft: boolean;
    total_versions: number;
    created_at: Date | undefined;
    updated_at: Date | undefined;
    capabilities: AssetCapabilities | undefined;
}
export interface AssetVersionSummary {
    asset_space: string;
    asset_id: string;
    version_id: string;
    status: AssetVersionStatus;
    description: string;
    created_by: string;
    created_at: Date | undefined;
    is_active: boolean;
    is_draft: boolean;
    base_version_id: string;
    version_hash: string;
    entry_count: number;
    total_bytes: number;
    manifest_path: string;
    has_unpublished_changes: boolean;
    capabilities: AssetCapabilities | undefined;
    display_version: string;
}
export interface AssetTreeEntry {
    entry_kind: AssetEntryKind;
    path: string;
    parent_path: string;
    name: string;
    file_id: string;
    content_type: string;
    size_bytes: number;
    checksum: string;
    has_children: boolean;
    is_text_previewable: boolean;
    language_hint: string;
    entry_revision: number;
    created_at: Date | undefined;
    updated_at: Date | undefined;
    capabilities: AssetCapabilities | undefined;
}
export interface AssetDiffSummary {
    total_changes: number;
    added_count: number;
    removed_count: number;
    modified_count: number;
    renamed_count: number;
    type_changed_count: number;
    text_diff_count: number;
    binary_change_count: number;
}
export interface AssetDiffEntry {
    path: string;
    old_path: string;
    change_type: AssetChangeType;
    old_entry_kind: AssetEntryKind;
    new_entry_kind: AssetEntryKind;
    old_file_id: string;
    new_file_id: string;
    old_checksum: string;
    new_checksum: string;
    old_size_bytes: number;
    new_size_bytes: number;
    is_text: boolean;
    language_hint: string;
    text_diff_status: AssetTextDiffStatus;
    unified_diff: string;
    diff_truncated: boolean;
    old_preview: string;
    new_preview: string;
    diff_detail_available: boolean;
}
export interface ListAssetCollectionsRequest {
    asset_space: string;
    scope_kind: AssetScopeKind;
    scope_value: string;
    page_size: number;
    page_token: string;
}
export interface ListAssetCollectionsResponse {
    collections: AssetCollection[];
    next_page_token: string;
    total_count: number;
}
export interface GetAssetCollectionRequest {
    asset_space: string;
    asset_id: string;
}
export interface ListAssetTreeRequest {
    asset_space: string;
    asset_id: string;
    version_id: string;
    folder: string;
    page_size: number;
    page_token: string;
    include_files: boolean;
    include_directories: boolean;
}
export interface ListAssetTreeResponse {
    collection: AssetCollection | undefined;
    version: AssetVersionSummary | undefined;
    entries: AssetTreeEntry[];
    next_page_token: string;
    total_count: number;
}
export interface ListAssetVersionsRequest {
    asset_space: string;
    asset_id: string;
    include_archived: boolean;
}
export interface ListAssetVersionsResponse {
    collection: AssetCollection | undefined;
    versions: AssetVersionSummary[];
    active_version_id: string;
    draft_version_id: string;
}
export interface GetAssetVersionRequest {
    asset_space: string;
    asset_id: string;
    version_id: string;
}
export interface GetAssetVersionResponse {
    collection: AssetCollection | undefined;
    version: AssetVersionSummary | undefined;
    base_version: AssetVersionSummary | undefined;
    draft_diff_summary: AssetDiffSummary | undefined;
}
export interface CreateDraftVersionRequest {
    asset_space: string;
    asset_id: string;
    base_version_id: string;
    draft_version_id: string;
    description: string;
    display_version: string;
}
export interface CreateDraftVersionResponse {
    collection: AssetCollection | undefined;
    draft_version: AssetVersionSummary | undefined;
    base_version: AssetVersionSummary | undefined;
}
export interface DiscardDraftVersionRequest {
    asset_space: string;
    asset_id: string;
    draft_version_id: string;
}
export interface GetAssetEntryTextRequest {
    asset_space: string;
    asset_id: string;
    version_id: string;
    path: string;
}
export interface GetAssetEntryTextResponse {
    entry: AssetTreeEntry | undefined;
    version_id: string;
    text: string;
    content_type: string;
    checksum: string;
    size_bytes: number;
    entry_revision: number;
    truncated: boolean;
    lossy: boolean;
    language_hint: string;
}
export interface UpdateDraftTextEntryRequest {
    asset_space: string;
    asset_id: string;
    draft_version_id: string;
    path: string;
    text: string;
    content_type: string;
    expected_entry_revision: number;
    commit_message: string;
}
export interface UpdateDraftTextEntryResponse {
    entry: AssetTreeEntry | undefined;
    draft_version_id: string;
    file_id: string;
    checksum: string;
    size_bytes: number;
    entry_revision: number;
    saved_at: Date | undefined;
}
export interface RenameDraftEntryRequest {
    asset_space: string;
    asset_id: string;
    draft_version_id: string;
    path: string;
    new_path: string;
}
export interface RenameDraftEntryResponse {
    entry: AssetTreeEntry | undefined;
    old_path: string;
}
export interface DeleteDraftEntryRequest {
    asset_space: string;
    asset_id: string;
    draft_version_id: string;
    path: string;
}
export interface DeleteDraftEntryResponse {
    draft_version_id: string;
    deleted_path: string;
}
export interface DiffAssetVersionsRequest {
    asset_space: string;
    asset_id: string;
    left_version_id: string;
    right_version_id: string;
    diff_mode: AssetDiffMode;
    path_prefix: string;
    page_size: number;
    page_token: string;
}
export interface DiffAssetVersionsResponse {
    collection: AssetCollection | undefined;
    left_version: AssetVersionSummary | undefined;
    right_version: AssetVersionSummary | undefined;
    summary: AssetDiffSummary | undefined;
    entries: AssetDiffEntry[];
    next_page_token: string;
    total_count: number;
}
export interface DiffAssetDraftRequest {
    asset_space: string;
    asset_id: string;
    draft_version_id: string;
    base_version_id: string;
    diff_mode: AssetDiffMode;
    path_prefix: string;
    page_size: number;
    page_token: string;
}
export interface DiffAssetDraftResponse {
    collection: AssetCollection | undefined;
    draft_version: AssetVersionSummary | undefined;
    base_version: AssetVersionSummary | undefined;
    summary: AssetDiffSummary | undefined;
    entries: AssetDiffEntry[];
    next_page_token: string;
    total_count: number;
}
export interface GetAssetDiffEntryDetailRequest {
    asset_space: string;
    asset_id: string;
    left_version_id: string;
    right_version_id: string;
    path: string;
    diff_mode: AssetDiffMode;
}
export interface GetAssetDiffEntryDetailResponse {
    entry: AssetDiffEntry | undefined;
    left_text: string;
    right_text: string;
    left_truncated: boolean;
    right_truncated: boolean;
    language_hint: string;
}
export interface PublishDraftVersionRequest {
    asset_space: string;
    asset_id: string;
    draft_version_id: string;
    version_id: string;
    description: string;
    previous_version_id: string;
    display_version: string;
}
export interface PublishDraftVersionResponse {
    collection: AssetCollection | undefined;
    published_version: AssetVersionSummary | undefined;
    active_version_id: string;
    summary: AssetDiffSummary | undefined;
}
export interface ActivateAssetVersionRequest {
    asset_space: string;
    asset_id: string;
    target_version_id: string;
    previous_version_id: string;
}
export interface ExportAssetEntryRequest {
    asset_space: string;
    asset_id: string;
    version_id: string;
    path: string;
}
export interface ActivateAssetVersionResponse {
    collection: AssetCollection | undefined;
    active_version_id: string;
    active_version: AssetVersionSummary | undefined;
}
export declare const AssetCapabilities: MessageFns<AssetCapabilities>;
export declare const AssetCollection: MessageFns<AssetCollection>;
export declare const AssetVersionSummary: MessageFns<AssetVersionSummary>;
export declare const AssetTreeEntry: MessageFns<AssetTreeEntry>;
export declare const AssetDiffSummary: MessageFns<AssetDiffSummary>;
export declare const AssetDiffEntry: MessageFns<AssetDiffEntry>;
export declare const ListAssetCollectionsRequest: MessageFns<ListAssetCollectionsRequest>;
export declare const ListAssetCollectionsResponse: MessageFns<ListAssetCollectionsResponse>;
export declare const GetAssetCollectionRequest: MessageFns<GetAssetCollectionRequest>;
export declare const ListAssetTreeRequest: MessageFns<ListAssetTreeRequest>;
export declare const ListAssetTreeResponse: MessageFns<ListAssetTreeResponse>;
export declare const ListAssetVersionsRequest: MessageFns<ListAssetVersionsRequest>;
export declare const ListAssetVersionsResponse: MessageFns<ListAssetVersionsResponse>;
export declare const GetAssetVersionRequest: MessageFns<GetAssetVersionRequest>;
export declare const GetAssetVersionResponse: MessageFns<GetAssetVersionResponse>;
export declare const CreateDraftVersionRequest: MessageFns<CreateDraftVersionRequest>;
export declare const CreateDraftVersionResponse: MessageFns<CreateDraftVersionResponse>;
export declare const DiscardDraftVersionRequest: MessageFns<DiscardDraftVersionRequest>;
export declare const GetAssetEntryTextRequest: MessageFns<GetAssetEntryTextRequest>;
export declare const GetAssetEntryTextResponse: MessageFns<GetAssetEntryTextResponse>;
export declare const UpdateDraftTextEntryRequest: MessageFns<UpdateDraftTextEntryRequest>;
export declare const UpdateDraftTextEntryResponse: MessageFns<UpdateDraftTextEntryResponse>;
export declare const RenameDraftEntryRequest: MessageFns<RenameDraftEntryRequest>;
export declare const RenameDraftEntryResponse: MessageFns<RenameDraftEntryResponse>;
export declare const DeleteDraftEntryRequest: MessageFns<DeleteDraftEntryRequest>;
export declare const DeleteDraftEntryResponse: MessageFns<DeleteDraftEntryResponse>;
export declare const DiffAssetVersionsRequest: MessageFns<DiffAssetVersionsRequest>;
export declare const DiffAssetVersionsResponse: MessageFns<DiffAssetVersionsResponse>;
export declare const DiffAssetDraftRequest: MessageFns<DiffAssetDraftRequest>;
export declare const DiffAssetDraftResponse: MessageFns<DiffAssetDraftResponse>;
export declare const GetAssetDiffEntryDetailRequest: MessageFns<GetAssetDiffEntryDetailRequest>;
export declare const GetAssetDiffEntryDetailResponse: MessageFns<GetAssetDiffEntryDetailResponse>;
export declare const PublishDraftVersionRequest: MessageFns<PublishDraftVersionRequest>;
export declare const PublishDraftVersionResponse: MessageFns<PublishDraftVersionResponse>;
export declare const ActivateAssetVersionRequest: MessageFns<ActivateAssetVersionRequest>;
export declare const ExportAssetEntryRequest: MessageFns<ExportAssetEntryRequest>;
export declare const ActivateAssetVersionResponse: MessageFns<ActivateAssetVersionResponse>;
/**
 * Business asset browsing service with versioning, draft editing, and diff support.
 * Built on top of FileStorageService primitives.
 */
export interface BusinessAssetBrowserService {
    ListAssetCollections(request: ListAssetCollectionsRequest): Promise<ListAssetCollectionsResponse>;
    GetAssetCollection(request: GetAssetCollectionRequest): Promise<AssetCollection>;
    ListAssetTree(request: ListAssetTreeRequest): Promise<ListAssetTreeResponse>;
    ListAssetVersions(request: ListAssetVersionsRequest): Promise<ListAssetVersionsResponse>;
    GetAssetVersion(request: GetAssetVersionRequest): Promise<GetAssetVersionResponse>;
    CreateDraftVersion(request: CreateDraftVersionRequest): Promise<CreateDraftVersionResponse>;
    DiscardDraftVersion(request: DiscardDraftVersionRequest): Promise<Empty>;
    GetAssetEntryText(request: GetAssetEntryTextRequest): Promise<GetAssetEntryTextResponse>;
    UpdateDraftTextEntry(request: UpdateDraftTextEntryRequest): Promise<UpdateDraftTextEntryResponse>;
    RenameDraftEntry(request: RenameDraftEntryRequest): Promise<RenameDraftEntryResponse>;
    DeleteDraftEntry(request: DeleteDraftEntryRequest): Promise<DeleteDraftEntryResponse>;
    DiffAssetVersions(request: DiffAssetVersionsRequest): Promise<DiffAssetVersionsResponse>;
    DiffAssetDraft(request: DiffAssetDraftRequest): Promise<DiffAssetDraftResponse>;
    GetAssetDiffEntryDetail(request: GetAssetDiffEntryDetailRequest): Promise<GetAssetDiffEntryDetailResponse>;
    PublishDraftVersion(request: PublishDraftVersionRequest): Promise<PublishDraftVersionResponse>;
    ActivateAssetVersion(request: ActivateAssetVersionRequest): Promise<ActivateAssetVersionResponse>;
    ExportAssetEntry(request: ExportAssetEntryRequest): Promise<HttpBody>;
}
export declare const BusinessAssetBrowserServiceServiceName = "stew.api.v1.BusinessAssetBrowserService";
export declare class BusinessAssetBrowserServiceClientImpl implements BusinessAssetBrowserService {
    private readonly rpc;
    private readonly service;
    constructor(rpc: Rpc, opts?: {
        service?: string;
    });
    ListAssetCollections(request: ListAssetCollectionsRequest): Promise<ListAssetCollectionsResponse>;
    GetAssetCollection(request: GetAssetCollectionRequest): Promise<AssetCollection>;
    ListAssetTree(request: ListAssetTreeRequest): Promise<ListAssetTreeResponse>;
    ListAssetVersions(request: ListAssetVersionsRequest): Promise<ListAssetVersionsResponse>;
    GetAssetVersion(request: GetAssetVersionRequest): Promise<GetAssetVersionResponse>;
    CreateDraftVersion(request: CreateDraftVersionRequest): Promise<CreateDraftVersionResponse>;
    DiscardDraftVersion(request: DiscardDraftVersionRequest): Promise<Empty>;
    GetAssetEntryText(request: GetAssetEntryTextRequest): Promise<GetAssetEntryTextResponse>;
    UpdateDraftTextEntry(request: UpdateDraftTextEntryRequest): Promise<UpdateDraftTextEntryResponse>;
    RenameDraftEntry(request: RenameDraftEntryRequest): Promise<RenameDraftEntryResponse>;
    DeleteDraftEntry(request: DeleteDraftEntryRequest): Promise<DeleteDraftEntryResponse>;
    DiffAssetVersions(request: DiffAssetVersionsRequest): Promise<DiffAssetVersionsResponse>;
    DiffAssetDraft(request: DiffAssetDraftRequest): Promise<DiffAssetDraftResponse>;
    GetAssetDiffEntryDetail(request: GetAssetDiffEntryDetailRequest): Promise<GetAssetDiffEntryDetailResponse>;
    PublishDraftVersion(request: PublishDraftVersionRequest): Promise<PublishDraftVersionResponse>;
    ActivateAssetVersion(request: ActivateAssetVersionRequest): Promise<ActivateAssetVersionResponse>;
    ExportAssetEntry(request: ExportAssetEntryRequest): Promise<HttpBody>;
}
interface Rpc {
    request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
}
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {
    $case: string;
} ? {
    [K in keyof Omit<T, "$case">]?: DeepPartial<T[K]>;
} & {
    $case: T["$case"];
} : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P : P & {
    [K in keyof P]: Exact<P[K], I[K]>;
} & {
    [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
};
export interface MessageFns<T> {
    encode(message: T, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): T;
    fromJSON(object: any): T;
    toJSON(message: T): unknown;
    create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
    fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}
export {};
