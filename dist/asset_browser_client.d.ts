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
export interface AssetCollection {
    assetSpace: string;
    assetId: string;
    displayName: string;
    description: string;
    scopeKind: AssetScopeKind;
    scopeValue: string;
    activeVersionId: string;
    draftVersionId: string;
    hasDraft: boolean;
    totalVersions: number;
    createdAt: string;
    updatedAt: string;
}
export interface AssetVersionSummary {
    assetSpace: string;
    assetId: string;
    versionId: string;
    status: AssetVersionStatus;
    description: string;
    createdBy: string;
    createdAt: string;
    isActive: boolean;
    isDraft: boolean;
    baseVersionId: string;
    versionHash: string;
    entryCount: number;
    totalBytes: number;
    manifestPath: string;
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
}
export interface AssetDiffEntry {
    path: string;
    changeType: AssetChangeType;
    oldChecksum: string;
    newChecksum: string;
    oldSizeBytes: number;
    newSizeBytes: number;
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
    activeVersionId: string;
    draftVersionId: string;
}
export interface CreateDraftResult {
    collection: AssetCollection;
    draftVersion: AssetVersionSummary;
}
export interface EntryTextResult {
    versionId: string;
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
    draftVersionId: string;
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
    activeVersionId: string;
}
export interface ActivateResult {
    collection: AssetCollection;
    activeVersionId: string;
    activeVersion: AssetVersionSummary;
}
/**
 * High-level client for the BusinessAssetBrowserService.
 *
 * Provides a developer-friendly API over the auto-generated REST endpoints,
 * with camelCase normalization, typed responses, and convenience helpers like
 * `saveAndDiffDraft`.
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
    listTree(assetSpace: string, assetId: string, params?: {
        versionId?: string;
        folder?: string;
        pageSize?: number;
        pageToken?: string;
        includeFiles?: boolean;
        includeDirectories?: boolean;
    }): Promise<ListTreeResult>;
    listVersions(assetSpace: string, assetId: string, params?: {
        includeArchived?: boolean;
    }): Promise<ListVersionsResult>;
    getVersion(assetSpace: string, assetId: string, versionId: string): Promise<{
        collection: AssetCollection;
        version: AssetVersionSummary;
    }>;
    createDraft(assetSpace: string, assetId: string, params?: {
        baseVersionId?: string;
        draftVersionId?: string;
        description?: string;
    }): Promise<CreateDraftResult>;
    discardDraft(assetSpace: string, assetId: string, draftVersionId: string): Promise<void>;
    publishDraft(assetSpace: string, assetId: string, draftVersionId: string, params?: {
        versionId?: string;
        description?: string;
    }): Promise<PublishResult>;
    getEntryText(assetSpace: string, assetId: string, versionId: string, path: string): Promise<EntryTextResult>;
    saveDraftText(assetSpace: string, assetId: string, params: {
        draftVersionId: string;
        path: string;
        text: string;
        contentType?: string;
        expectedEntryRevision?: number;
    }): Promise<SaveTextResult>;
    renameDraftEntry(assetSpace: string, assetId: string, params: {
        draftVersionId: string;
        path: string;
        newPath: string;
    }): Promise<{
        oldPath: string;
    }>;
    deleteDraftEntry(assetSpace: string, assetId: string, params: {
        draftVersionId: string;
        path: string;
    }): Promise<{
        deletedPath: string;
    }>;
    diffVersions(assetSpace: string, assetId: string, leftVersionId: string, rightVersionId: string, params?: {
        pageSize?: number;
        pageToken?: string;
    }): Promise<DiffResult>;
    diffDraft(assetSpace: string, assetId: string, draftVersionId: string, params?: {
        baseVersionId?: string;
        pageSize?: number;
        pageToken?: string;
    }): Promise<DiffResult>;
    getDiffEntryDetail(assetSpace: string, assetId: string, leftVersionId: string, rightVersionId: string, path: string): Promise<DiffEntryDetailResult>;
    activateVersion(assetSpace: string, assetId: string, targetVersionId: string): Promise<ActivateResult>;
    /**
     * Save text to a draft entry and immediately diff the draft against its
     * base version.  Useful for implementing "save-and-preview" workflows.
     */
    saveAndDiffDraft(assetSpace: string, assetId: string, params: {
        draftVersionId: string;
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
