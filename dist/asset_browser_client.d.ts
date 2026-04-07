export interface AssetBrowserClientOptions {
    baseUrl: string;
    timeout?: number;
}
/** Scope kind for asset collections. */
export type AssetScopeKind = 'user' | 'service' | 'tenant' | 'global';
/** Lifecycle status of an asset version. */
export type AssetVersionStatus = 'draft' | 'ready' | 'archived' | 'failed';
/** Change type in a diff entry. */
export type AssetChangeType = 'added' | 'removed' | 'modified' | 'renamed' | 'type_changed';
/** Entry kind: file or directory. */
export type AssetEntryKind = 'file' | 'directory';
/** Diff payload mode. */
export type AssetDiffMode = 'structure_only' | 'with_text';
/** Text diff rendering status. */
export type AssetTextDiffStatus = 'not_requested' | 'ready' | 'binary' | 'too_large' | 'lossy' | 'error';
/**
 * Public version identifier used by the asset browser APIs.
 *
 * This maps to `asset_versions.version_id` instead of the internal database
 * UUID. Request parameters also accept the internal UUID temporarily for
 * backward compatibility, but SDK responses always normalize to the business
 * version ID.
 */
export type AssetVersionId = string;
export interface AssetCollection {
    assetSpace: string;
    assetId: string;
    displayName: string;
    description: string;
    scopeKind: AssetScopeKind;
    scopeValue: string;
    activeVersionId: AssetVersionId;
    draftVersionId: AssetVersionId;
    hasDraft: boolean;
    totalVersions: number;
    createdAt: string;
    updatedAt: string;
}
export interface AssetVersionSummary {
    assetSpace: string;
    assetId: string;
    versionId: AssetVersionId;
    status: AssetVersionStatus;
    description: string;
    createdBy: string;
    createdAt: string;
    isActive: boolean;
    isDraft: boolean;
    baseVersionId: AssetVersionId;
    versionHash: string;
    entryCount: number;
    totalBytes: number;
    manifestPath: string;
}
export interface AssetVersionDetailResult {
    collection: AssetCollection;
    version: AssetVersionSummary;
    baseVersion?: AssetVersionSummary;
    draftDiffSummary?: AssetDiffSummary;
}
export interface AssetTreeEntry {
    entryKind: AssetEntryKind;
    path: string;
    parentPath: string;
    name: string;
    fileId: string;
    contentType: string;
    sizeBytes: number;
    checksum: string;
    hasChildren: boolean;
    isTextPreviewable: boolean;
    languageHint: string;
    entryRevision: number;
    createdAt: string;
    updatedAt: string;
}
export interface AssetDiffSummary {
    totalChanges: number;
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
    renamedCount: number;
    typeChangedCount: number;
    textDiffCount: number;
    binaryChangeCount: number;
}
export interface AssetDiffEntry {
    path: string;
    oldPath: string;
    changeType: AssetChangeType;
    oldEntryKind: AssetEntryKind | '';
    newEntryKind: AssetEntryKind | '';
    oldFileId: string;
    newFileId: string;
    oldChecksum: string;
    newChecksum: string;
    oldSizeBytes: number;
    newSizeBytes: number;
    isText: boolean;
    languageHint: string;
    textDiffStatus: AssetTextDiffStatus;
    unifiedDiff: string;
    diffTruncated: boolean;
    oldPreview: string;
    newPreview: string;
    diffDetailAvailable: boolean;
}
export interface ListCollectionsResult {
    collections: AssetCollection[];
    nextPageToken: string;
    totalCount: number;
}
export interface ListTreeResult {
    collection: AssetCollection;
    version: AssetVersionSummary;
    entries: AssetTreeEntry[];
    nextPageToken: string;
    totalCount: number;
}
export interface ListVersionsResult {
    collection: AssetCollection;
    versions: AssetVersionSummary[];
    activeVersionId: AssetVersionId;
    draftVersionId: AssetVersionId;
}
export interface CreateDraftResult {
    collection: AssetCollection;
    draftVersion: AssetVersionSummary;
}
export interface EntryTextResult {
    versionId: AssetVersionId;
    text: string;
    contentType: string;
    checksum: string;
    sizeBytes: number;
    entryRevision: number;
    truncated: boolean;
    lossy: boolean;
    languageHint: string;
}
export interface SaveTextResult {
    draftVersionId: AssetVersionId;
    fileId: string;
    checksum: string;
    sizeBytes: number;
    entryRevision: number;
    savedAt: string;
}
export interface DiffResult {
    collection: AssetCollection;
    leftVersion?: AssetVersionSummary;
    rightVersion?: AssetVersionSummary;
    draftVersion?: AssetVersionSummary;
    baseVersion?: AssetVersionSummary;
    summary: AssetDiffSummary;
    entries: AssetDiffEntry[];
    nextPageToken: string;
    totalCount: number;
}
export interface DiffEntryDetailResult {
    leftText: string;
    rightText: string;
    leftTruncated: boolean;
    rightTruncated: boolean;
    languageHint: string;
}
export interface PublishResult {
    collection: AssetCollection;
    publishedVersion: AssetVersionSummary;
    activeVersionId: AssetVersionId;
}
export interface ActivateResult {
    collection: AssetCollection;
    activeVersionId: AssetVersionId;
    activeVersion: AssetVersionSummary;
}
export interface DownloadEntryResult {
    blob: Blob;
    filename: string;
    contentType: string;
}
/**
 * High-level client for the BusinessAssetBrowserService.
 *
 * Provides a developer-friendly API over the auto-generated REST endpoints,
 * with camelCase normalization, typed responses, and convenience helpers like
 * `saveAndDiffDraft`.
 *
 * All public version-related fields and parameters use the business version
 * identifier from `asset_versions.version_id`.
 */
export declare class AssetBrowserClient {
    private http;
    constructor(options: AssetBrowserClientOptions);
    listCollections(params?: {
        assetSpace?: string;
        scopeValue?: string;
        pageSize?: number;
        pageToken?: string;
    }): Promise<ListCollectionsResult>;
    getCollection(assetSpace: string, assetId: string): Promise<AssetCollection>;
    ensureCollection(assetSpace: string, assetId: string, params?: {
        scopeKind?: AssetScopeKind;
        scopeValue?: string;
        displayName?: string;
        description?: string;
    }): Promise<AssetCollection>;
    listTree(assetSpace: string, assetId: string, params?: {
        versionId?: AssetVersionId;
        folder?: string;
        pageSize?: number;
        pageToken?: string;
        includeFiles?: boolean;
        includeDirectories?: boolean;
    }): Promise<ListTreeResult>;
    listVersions(assetSpace: string, assetId: string, params?: {
        includeArchived?: boolean;
    }): Promise<ListVersionsResult>;
    getVersion(assetSpace: string, assetId: string, versionId: AssetVersionId): Promise<AssetVersionDetailResult>;
    createDraft(assetSpace: string, assetId: string, params?: {
        baseVersionId?: AssetVersionId;
        draftVersionId?: AssetVersionId;
        description?: string;
    }): Promise<CreateDraftResult>;
    discardDraft(assetSpace: string, assetId: string, draftVersionId: AssetVersionId): Promise<void>;
    publishDraft(assetSpace: string, assetId: string, draftVersionId: AssetVersionId, params?: {
        versionId?: AssetVersionId;
        description?: string;
    }): Promise<PublishResult>;
    getEntryText(assetSpace: string, assetId: string, versionId: AssetVersionId, path: string): Promise<EntryTextResult>;
    saveDraftText(assetSpace: string, assetId: string, params: {
        draftVersionId: AssetVersionId;
        path: string;
        text: string;
        contentType?: string;
        expectedEntryRevision?: number;
    }): Promise<SaveTextResult>;
    renameDraftEntry(assetSpace: string, assetId: string, params: {
        draftVersionId: AssetVersionId;
        path: string;
        newPath: string;
    }): Promise<{
        oldPath: string;
    }>;
    deleteDraftEntry(assetSpace: string, assetId: string, params: {
        draftVersionId: AssetVersionId;
        path: string;
    }): Promise<{
        deletedPath: string;
    }>;
    diffVersions(assetSpace: string, assetId: string, leftVersionId: AssetVersionId, rightVersionId: AssetVersionId, params?: {
        diffMode?: AssetDiffMode;
        pathPrefix?: string;
        pageSize?: number;
        pageToken?: string;
    }): Promise<DiffResult>;
    diffDraft(assetSpace: string, assetId: string, draftVersionId: AssetVersionId, params?: {
        baseVersionId?: AssetVersionId;
        diffMode?: AssetDiffMode;
        pathPrefix?: string;
        pageSize?: number;
        pageToken?: string;
    }): Promise<DiffResult>;
    getDiffEntryDetail(assetSpace: string, assetId: string, leftVersionId: AssetVersionId, rightVersionId: AssetVersionId, path: string, params?: {
        diffMode?: AssetDiffMode;
    }): Promise<DiffEntryDetailResult>;
    activateVersion(assetSpace: string, assetId: string, targetVersionId: AssetVersionId): Promise<ActivateResult>;
    downloadEntry(assetSpace: string, assetId: string, params?: {
        versionId?: AssetVersionId;
        path?: string;
    }): Promise<DownloadEntryResult>;
    /**
     * Save text to a draft entry and immediately diff the draft against its
     * base version.  Useful for implementing "save-and-preview" workflows.
     */
    saveAndDiffDraft(assetSpace: string, assetId: string, params: {
        draftVersionId: AssetVersionId;
        path: string;
        text: string;
        contentType?: string;
        expectedEntryRevision?: number;
    }): Promise<{
        save: SaveTextResult;
        diff: DiffResult;
    }>;
    private parseDiffResponse;
    private getToken;
}
