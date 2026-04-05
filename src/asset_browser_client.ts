import axios, { AxiosInstance } from 'axios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

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

export interface DownloadEntryResult {
    blob: Blob;
    filename: string;
    contentType: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Rec = Record<string, unknown>;

function rec(v: unknown): Rec {
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Rec) : {};
}

function str(source: Rec, ...keys: string[]): string {
    for (const k of keys) {
        const v = source[k];
        if (typeof v === 'string') return v;
    }
    return '';
}

function num(source: Rec, ...keys: string[]): number {
    for (const k of keys) {
        const v = source[k];
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
            const n = Number(v);
            if (!Number.isNaN(n)) return n;
        }
    }
    return 0;
}

function bool(source: Rec, ...keys: string[]): boolean {
    for (const k of keys) {
        const v = source[k];
        if (typeof v === 'boolean') return v;
    }
    return false;
}

function normalizeCollection(raw: unknown): AssetCollection {
    const s = rec(raw);
    return {
        assetSpace: str(s, 'assetSpace', 'asset_space'),
        assetId: str(s, 'assetId', 'asset_id'),
        displayName: str(s, 'displayName', 'display_name'),
        description: str(s, 'description'),
        scopeKind: str(s, 'scopeKind', 'scope_kind') as AssetScopeKind || 'user',
        scopeValue: str(s, 'scopeValue', 'scope_value'),
        activeVersionId: str(s, 'activeVersionId', 'active_version_id'),
        draftVersionId: str(s, 'draftVersionId', 'draft_version_id'),
        hasDraft: bool(s, 'hasDraft', 'has_draft'),
        totalVersions: num(s, 'totalVersions', 'total_versions'),
        createdAt: str(s, 'createdAt', 'created_at'),
        updatedAt: str(s, 'updatedAt', 'updated_at'),
    };
}

function normalizeVersion(raw: unknown): AssetVersionSummary {
    const s = rec(raw);
    return {
        assetSpace: str(s, 'assetSpace', 'asset_space'),
        assetId: str(s, 'assetId', 'asset_id'),
        versionId: str(s, 'versionId', 'version_id'),
        status: (str(s, 'status') || 'draft') as AssetVersionStatus,
        description: str(s, 'description'),
        createdBy: str(s, 'createdBy', 'created_by'),
        createdAt: str(s, 'createdAt', 'created_at'),
        isActive: bool(s, 'isActive', 'is_active'),
        isDraft: bool(s, 'isDraft', 'is_draft'),
        baseVersionId: str(s, 'baseVersionId', 'base_version_id'),
        versionHash: str(s, 'versionHash', 'version_hash'),
        entryCount: num(s, 'entryCount', 'entry_count'),
        totalBytes: num(s, 'totalBytes', 'total_bytes'),
        manifestPath: str(s, 'manifestPath', 'manifest_path'),
    };
}

function normalizeEntry(raw: unknown): AssetTreeEntry {
    const s = rec(raw);
    return {
        entryKind: (str(s, 'entryKind', 'entry_kind') || 'file') as AssetEntryKind,
        path: str(s, 'path'),
        parentPath: str(s, 'parentPath', 'parent_path'),
        name: str(s, 'name'),
        fileId: str(s, 'fileId', 'file_id'),
        contentType: str(s, 'contentType', 'content_type'),
        sizeBytes: num(s, 'sizeBytes', 'size_bytes'),
        checksum: str(s, 'checksum'),
        isTextPreviewable: bool(s, 'isTextPreviewable', 'is_text_previewable'),
        languageHint: str(s, 'languageHint', 'language_hint'),
        entryRevision: num(s, 'entryRevision', 'entry_revision'),
        createdAt: str(s, 'createdAt', 'created_at'),
        updatedAt: str(s, 'updatedAt', 'updated_at'),
    };
}

function normalizeDiffEntry(raw: unknown): AssetDiffEntry {
    const s = rec(raw);
    return {
        path: str(s, 'path'),
        changeType: (str(s, 'changeType', 'change_type') || 'modified') as AssetChangeType,
        oldChecksum: str(s, 'oldChecksum', 'old_checksum'),
        newChecksum: str(s, 'newChecksum', 'new_checksum'),
        oldSizeBytes: num(s, 'oldSizeBytes', 'old_size_bytes'),
        newSizeBytes: num(s, 'newSizeBytes', 'new_size_bytes'),
        diffDetailAvailable: bool(s, 'diffDetailAvailable', 'diff_detail_available'),
    };
}

function normalizeSummary(raw: unknown): AssetDiffSummary {
    const s = rec(raw);
    return {
        totalChanges: num(s, 'totalChanges', 'total_changes'),
        addedCount: num(s, 'addedCount', 'added_count'),
        removedCount: num(s, 'removedCount', 'removed_count'),
        modifiedCount: num(s, 'modifiedCount', 'modified_count'),
        renamedCount: num(s, 'renamedCount', 'renamed_count'),
        typeChangedCount: num(s, 'typeChangedCount', 'type_changed_count'),
    };
}

function parseContentDispositionFilename(
    header: string | undefined,
    fallback: string,
): string {
    if (!header) {
        return fallback;
    }

    const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        try {
            return decodeURIComponent(utf8Match[1]);
        } catch {
            return fallback;
        }
    }

    const simpleMatch = header.match(/filename="?([^";]+)"?/i);
    if (simpleMatch?.[1]) {
        return simpleMatch[1];
    }

    return fallback;
}

/** Unwrap gateway `{ code, data, message }` envelope. */
function unwrap<T>(payload: unknown): T {
    const r = rec(payload);
    if (typeof r.code === 'number' && 'data' in r) {
        return r.data as T;
    }
    return payload as T;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

/**
 * High-level client for the BusinessAssetBrowserService.
 *
 * Provides a developer-friendly API over the auto-generated REST endpoints,
 * with camelCase normalization, typed responses, and convenience helpers like
 * `saveAndDiffDraft`.
 */
export class AssetBrowserClient {
    private http: AxiosInstance;

    constructor(options: AssetBrowserClientOptions) {
        const baseUrl = options.baseUrl.replace(/\/$/, '');

        this.http = axios.create({
            baseURL: baseUrl,
            timeout: options.timeout ?? 30_000,
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
        });

        this.http.interceptors.request.use((config) => {
            const token = this.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    // ===== Collection =====

    async listCollections(params?: {
        assetSpace?: string;
        scopeValue?: string;
        pageSize?: number;
        pageToken?: string;
    }): Promise<ListCollectionsResult> {
        const { data } = await this.http.get('/api/v1/assets', {
            params: {
                asset_space: params?.assetSpace,
                scope_value: params?.scopeValue,
                page_size: params?.pageSize,
                page_token: params?.pageToken,
            },
        });
        const d = rec(unwrap(data));
        return {
            collections: Array.isArray(d.collections)
                ? d.collections.map(normalizeCollection)
                : [],
            nextPageToken: str(d, 'nextPageToken', 'next_page_token'),
            totalCount: num(d, 'totalCount', 'total_count'),
        };
    }

    async getCollection(
        assetSpace: string,
        assetId: string,
    ): Promise<AssetCollection> {
        const { data } = await this.http.get(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}`,
        );
        return normalizeCollection(unwrap(data));
    }

    // ===== Tree =====

    async listTree(
        assetSpace: string,
        assetId: string,
        params?: {
            versionId?: string;
            folder?: string;
            pageSize?: number;
            pageToken?: string;
            includeFiles?: boolean;
            includeDirectories?: boolean;
        },
    ): Promise<ListTreeResult> {
        const { data } = await this.http.get(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}/tree`,
            {
                params: {
                    version_id: params?.versionId,
                    folder: params?.folder,
                    page_size: params?.pageSize,
                    page_token: params?.pageToken,
                    include_files: params?.includeFiles,
                    include_directories: params?.includeDirectories,
                },
            },
        );
        const d = rec(unwrap(data));
        return {
            collection: normalizeCollection(d.collection),
            version: normalizeVersion(d.version),
            entries: Array.isArray(d.entries)
                ? d.entries.map(normalizeEntry)
                : [],
            nextPageToken: str(d, 'nextPageToken', 'next_page_token'),
            totalCount: num(d, 'totalCount', 'total_count'),
        };
    }

    // ===== Versions =====

    async listVersions(
        assetSpace: string,
        assetId: string,
        params?: { includeArchived?: boolean },
    ): Promise<ListVersionsResult> {
        const { data } = await this.http.get(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}/versions`,
            { params: { include_archived: params?.includeArchived } },
        );
        const d = rec(unwrap(data));
        return {
            collection: normalizeCollection(d.collection),
            versions: Array.isArray(d.versions)
                ? d.versions.map(normalizeVersion)
                : [],
            activeVersionId: str(d, 'activeVersionId', 'active_version_id'),
            draftVersionId: str(d, 'draftVersionId', 'draft_version_id'),
        };
    }

    async getVersion(
        assetSpace: string,
        assetId: string,
        versionId: string,
    ): Promise<{ collection: AssetCollection; version: AssetVersionSummary }> {
        const { data } = await this.http.get(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}/versions/${enc(versionId)}`,
        );
        const d = rec(unwrap(data));
        return {
            collection: normalizeCollection(d.collection),
            version: normalizeVersion(d.version),
        };
    }

    // ===== Draft lifecycle =====

    async createDraft(
        assetSpace: string,
        assetId: string,
        params?: {
            baseVersionId?: string;
            draftVersionId?: string;
            description?: string;
        },
    ): Promise<CreateDraftResult> {
        const { data } = await this.http.post(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:createDraft`,
            {
                asset_space: assetSpace,
                asset_id: assetId,
                base_version_id: params?.baseVersionId,
                draft_version_id: params?.draftVersionId,
                description: params?.description,
            },
        );
        const d = rec(unwrap(data));
        return {
            collection: normalizeCollection(d.collection),
            draftVersion: normalizeVersion(d.draftVersion ?? d.draft_version),
        };
    }

    async discardDraft(
        assetSpace: string,
        assetId: string,
        draftVersionId: string,
    ): Promise<void> {
        await this.http.post(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:discardDraft`,
            {
                asset_space: assetSpace,
                asset_id: assetId,
                draft_version_id: draftVersionId,
            },
        );
    }

    async publishDraft(
        assetSpace: string,
        assetId: string,
        draftVersionId: string,
        params?: { versionId?: string; description?: string },
    ): Promise<PublishResult> {
        const { data } = await this.http.post(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:publishDraft`,
            {
                asset_space: assetSpace,
                asset_id: assetId,
                draft_version_id: draftVersionId,
                version_id: params?.versionId,
                description: params?.description,
            },
        );
        const d = rec(unwrap(data));
        return {
            collection: normalizeCollection(d.collection),
            publishedVersion: normalizeVersion(d.publishedVersion ?? d.published_version),
            activeVersionId: str(d, 'activeVersionId', 'active_version_id'),
        };
    }

    // ===== Draft editing =====

    async getEntryText(
        assetSpace: string,
        assetId: string,
        versionId: string,
        path: string,
    ): Promise<EntryTextResult> {
        const { data } = await this.http.post(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:getEntryText`,
            {
                asset_space: assetSpace,
                asset_id: assetId,
                version_id: versionId,
                path,
            },
        );
        const d = rec(unwrap(data));
        return {
            versionId: str(d, 'versionId', 'version_id'),
            text: str(d, 'text'),
            contentType: str(d, 'contentType', 'content_type'),
            checksum: str(d, 'checksum'),
            sizeBytes: num(d, 'sizeBytes', 'size_bytes'),
            entryRevision: num(d, 'entryRevision', 'entry_revision'),
            truncated: bool(d, 'truncated'),
            lossy: bool(d, 'lossy'),
            languageHint: str(d, 'languageHint', 'language_hint'),
        };
    }

    async saveDraftText(
        assetSpace: string,
        assetId: string,
        params: {
            draftVersionId: string;
            path: string;
            text: string;
            contentType?: string;
            expectedEntryRevision?: number;
        },
    ): Promise<SaveTextResult> {
        const { data } = await this.http.post(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:saveDraftText`,
            {
                asset_space: assetSpace,
                asset_id: assetId,
                draft_version_id: params.draftVersionId,
                path: params.path,
                text: params.text,
                content_type: params.contentType,
                expected_entry_revision: params.expectedEntryRevision,
            },
        );
        const d = rec(unwrap(data));
        return {
            draftVersionId: str(d, 'draftVersionId', 'draft_version_id'),
            fileId: str(d, 'fileId', 'file_id'),
            checksum: str(d, 'checksum'),
            sizeBytes: num(d, 'sizeBytes', 'size_bytes'),
            entryRevision: num(d, 'entryRevision', 'entry_revision'),
            savedAt: str(d, 'savedAt', 'saved_at'),
        };
    }

    async renameDraftEntry(
        assetSpace: string,
        assetId: string,
        params: {
            draftVersionId: string;
            path: string;
            newPath: string;
        },
    ): Promise<{ oldPath: string }> {
        const { data } = await this.http.post(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:renameDraftEntry`,
            {
                asset_space: assetSpace,
                asset_id: assetId,
                draft_version_id: params.draftVersionId,
                path: params.path,
                new_path: params.newPath,
            },
        );
        const d = rec(unwrap(data));
        return { oldPath: str(d, 'oldPath', 'old_path') };
    }

    async deleteDraftEntry(
        assetSpace: string,
        assetId: string,
        params: {
            draftVersionId: string;
            path: string;
        },
    ): Promise<{ deletedPath: string }> {
        const { data } = await this.http.post(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:deleteDraftEntry`,
            {
                asset_space: assetSpace,
                asset_id: assetId,
                draft_version_id: params.draftVersionId,
                path: params.path,
            },
        );
        const d = rec(unwrap(data));
        return { deletedPath: str(d, 'deletedPath', 'deleted_path') };
    }

    // ===== Diff =====

    async diffVersions(
        assetSpace: string,
        assetId: string,
        leftVersionId: string,
        rightVersionId: string,
        params?: { pageSize?: number; pageToken?: string },
    ): Promise<DiffResult> {
        const { data } = await this.http.post(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:diffVersions`,
            {
                asset_space: assetSpace,
                asset_id: assetId,
                left_version_id: leftVersionId,
                right_version_id: rightVersionId,
                page_size: params?.pageSize,
                page_token: params?.pageToken,
            },
        );
        return this.parseDiffResponse(data);
    }

    async diffDraft(
        assetSpace: string,
        assetId: string,
        draftVersionId: string,
        params?: {
            baseVersionId?: string;
            pageSize?: number;
            pageToken?: string;
        },
    ): Promise<DiffResult> {
        const { data } = await this.http.post(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:diffDraft`,
            {
                asset_space: assetSpace,
                asset_id: assetId,
                draft_version_id: draftVersionId,
                base_version_id: params?.baseVersionId,
                page_size: params?.pageSize,
                page_token: params?.pageToken,
            },
        );
        return this.parseDiffResponse(data);
    }

    async getDiffEntryDetail(
        assetSpace: string,
        assetId: string,
        leftVersionId: string,
        rightVersionId: string,
        path: string,
    ): Promise<DiffEntryDetailResult> {
        const { data } = await this.http.post(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:getDiffEntry`,
            {
                asset_space: assetSpace,
                asset_id: assetId,
                left_version_id: leftVersionId,
                right_version_id: rightVersionId,
                path,
            },
        );
        const d = rec(unwrap(data));
        return {
            leftText: str(d, 'leftText', 'left_text'),
            rightText: str(d, 'rightText', 'right_text'),
            leftTruncated: bool(d, 'leftTruncated', 'left_truncated'),
            rightTruncated: bool(d, 'rightTruncated', 'right_truncated'),
            languageHint: str(d, 'languageHint', 'language_hint'),
        };
    }

    // ===== Activation =====

    async activateVersion(
        assetSpace: string,
        assetId: string,
        targetVersionId: string,
    ): Promise<ActivateResult> {
        const { data } = await this.http.post(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:activateVersion`,
            {
                asset_space: assetSpace,
                asset_id: assetId,
                target_version_id: targetVersionId,
            },
        );
        const d = rec(unwrap(data));
        return {
            collection: normalizeCollection(d.collection),
            activeVersionId: str(d, 'activeVersionId', 'active_version_id'),
            activeVersion: normalizeVersion(d.activeVersion ?? d.active_version),
        };
    }

    async downloadEntry(
        assetSpace: string,
        assetId: string,
        params?: {
            versionId?: string;
            path?: string;
        },
    ): Promise<DownloadEntryResult> {
        const fallbackName = params?.path
            ? params.path.split('/').filter(Boolean).pop() || `${assetId}.zip`
            : `${assetId}.zip`;
        const resp = await this.http.get(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}/export`,
            {
                params: {
                    version_id: params?.versionId,
                    path: params?.path,
                },
                responseType: 'blob',
            },
        );

        return {
            blob: resp.data,
            filename: parseContentDispositionFilename(
                resp.headers['content-disposition'],
                fallbackName,
            ),
            contentType:
                (typeof resp.headers['content-type'] === 'string'
                    ? resp.headers['content-type']
                    : '') || resp.data.type || 'application/octet-stream',
        };
    }

    // ===== Convenience helpers =====

    /**
     * Save text to a draft entry and immediately diff the draft against its
     * base version.  Useful for implementing "save-and-preview" workflows.
     */
    async saveAndDiffDraft(
        assetSpace: string,
        assetId: string,
        params: {
            draftVersionId: string;
            path: string;
            text: string;
            contentType?: string;
            expectedEntryRevision?: number;
        },
    ): Promise<{ save: SaveTextResult; diff: DiffResult }> {
        const save = await this.saveDraftText(assetSpace, assetId, params);
        const diff = await this.diffDraft(
            assetSpace,
            assetId,
            params.draftVersionId,
        );
        return { save, diff };
    }

    // ===== Internal =====

    private parseDiffResponse(data: unknown): DiffResult {
        const d = rec(unwrap(data));
        return {
            collection: normalizeCollection(d.collection),
            leftVersion: d.leftVersion || d.left_version
                ? normalizeVersion(d.leftVersion ?? d.left_version)
                : undefined,
            rightVersion: d.rightVersion || d.right_version
                ? normalizeVersion(d.rightVersion ?? d.right_version)
                : undefined,
            draftVersion: d.draftVersion || d.draft_version
                ? normalizeVersion(d.draftVersion ?? d.draft_version)
                : undefined,
            baseVersion: d.baseVersion || d.base_version
                ? normalizeVersion(d.baseVersion ?? d.base_version)
                : undefined,
            summary: normalizeSummary(d.summary),
            entries: Array.isArray(d.entries)
                ? d.entries.map(normalizeDiffEntry)
                : [],
            nextPageToken: str(d, 'nextPageToken', 'next_page_token'),
            totalCount: num(d, 'totalCount', 'total_count'),
        };
    }

    private getToken(): string | null {
        if (typeof window === 'undefined') return null;
        try {
            return (
                window.localStorage.getItem('access_token') ||
                window.localStorage.getItem('token') ||
                window.sessionStorage.getItem('access_token') ||
                window.sessionStorage.getItem('token') ||
                null
            );
        } catch {
            return null;
        }
    }
}

function enc(v: string): string {
    return encodeURIComponent(v);
}
