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
    displayVersion: string;
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

function enumValue(source: Rec, ...keys: string[]): string | number | undefined {
    for (const k of keys) {
        const value = source[k];
        if (typeof value === 'string' || typeof value === 'number') {
            return value;
        }
    }
    return undefined;
}

function normalizeScopeKindValue(value: string | number | undefined): AssetScopeKind {
    if (typeof value === 'number') {
        if (value === 1) return 'user';
        if (value === 2) return 'service';
        if (value === 3) return 'tenant';
        if (value === 4) return 'global';
        return 'service';
    }

    const normalized = (value || '').toLowerCase();
    if (normalized.includes('user')) return 'user';
    if (normalized.includes('tenant')) return 'tenant';
    if (normalized.includes('global')) return 'global';
    return 'service';
}

function normalizeVersionStatusValue(value: string | number | undefined): AssetVersionStatus {
    if (typeof value === 'number') {
        if (value === 2) return 'ready';
        if (value === 3) return 'archived';
        if (value === 4) return 'failed';
        return 'draft';
    }

    const normalized = (value || '').toLowerCase();
    if (normalized.includes('ready')) return 'ready';
    if (normalized.includes('archived')) return 'archived';
    if (normalized.includes('failed')) return 'failed';
    return 'draft';
}

function normalizeEntryKindValue(value: string | number | undefined): AssetEntryKind {
    if (typeof value === 'number') {
        return value === 2 ? 'directory' : 'file';
    }

    const normalized = (value || '').toLowerCase();
    if (normalized.includes('directory')) return 'directory';
    return 'file';
}

function normalizeChangeTypeValue(value: string | number | undefined): AssetChangeType {
    if (typeof value === 'number') {
        if (value === 1) return 'added';
        if (value === 2) return 'removed';
        if (value === 3) return 'modified';
        if (value === 4) return 'renamed';
        if (value === 5) return 'type_changed';
        return 'modified';
    }

    const normalized = (value || '').toLowerCase();
    if (normalized.includes('added')) return 'added';
    if (normalized.includes('removed')) return 'removed';
    if (normalized.includes('renamed')) return 'renamed';
    if (normalized.includes('type_changed') || normalized.includes('typechanged')) {
        return 'type_changed';
    }
    return 'modified';
}

function normalizeDiffModeValue(value: string | number | undefined): AssetDiffMode {
    if (typeof value === 'number') {
        return value === 1 ? 'structure_only' : 'with_text';
    }

    const normalized = (value || '').toLowerCase();
    return normalized.includes('structure_only') || normalized.includes('structureonly')
        ? 'structure_only'
        : 'with_text';
}

function normalizeTextDiffStatusValue(value: string | number | undefined): AssetTextDiffStatus {
    if (typeof value === 'number') {
        if (value === 2) return 'ready';
        if (value === 3) return 'binary';
        if (value === 4) return 'too_large';
        if (value === 5) return 'lossy';
        if (value === 6) return 'error';
        return 'not_requested';
    }

    const normalized = (value || '').toLowerCase();
    if (normalized.includes('ready')) return 'ready';
    if (normalized.includes('binary')) return 'binary';
    if (normalized.includes('too_large') || normalized.includes('toolarge')) return 'too_large';
    if (normalized.includes('lossy')) return 'lossy';
    if (normalized.includes('error')) return 'error';
    return 'not_requested';
}

function normalizeCollection(raw: unknown): AssetCollection {
    const s = rec(raw);
    return {
        assetSpace: str(s, 'assetSpace', 'asset_space'),
        assetId: str(s, 'assetId', 'asset_id'),
        displayName: str(s, 'displayName', 'display_name'),
        description: str(s, 'description'),
        scopeKind: normalizeScopeKindValue(enumValue(s, 'scopeKind', 'scope_kind')),
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
        status: normalizeVersionStatusValue(enumValue(s, 'status')),
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
        displayVersion: str(s, 'displayVersion', 'display_version'),
    };
}

function normalizeEntry(raw: unknown): AssetTreeEntry {
    const s = rec(raw);
    return {
        entryKind: normalizeEntryKindValue(enumValue(s, 'entryKind', 'entry_kind')),
        path: str(s, 'path'),
        parentPath: str(s, 'parentPath', 'parent_path'),
        name: str(s, 'name'),
        fileId: str(s, 'fileId', 'file_id'),
        contentType: str(s, 'contentType', 'content_type'),
        sizeBytes: num(s, 'sizeBytes', 'size_bytes'),
        checksum: str(s, 'checksum'),
        hasChildren: bool(s, 'hasChildren', 'has_children'),
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
        oldPath: str(s, 'oldPath', 'old_path'),
        changeType: normalizeChangeTypeValue(enumValue(s, 'changeType', 'change_type')),
        oldEntryKind: normalizeOptionalEntryKindValue(enumValue(s, 'oldEntryKind', 'old_entry_kind')),
        newEntryKind: normalizeOptionalEntryKindValue(enumValue(s, 'newEntryKind', 'new_entry_kind')),
        oldFileId: str(s, 'oldFileId', 'old_file_id'),
        newFileId: str(s, 'newFileId', 'new_file_id'),
        oldChecksum: str(s, 'oldChecksum', 'old_checksum'),
        newChecksum: str(s, 'newChecksum', 'new_checksum'),
        oldSizeBytes: num(s, 'oldSizeBytes', 'old_size_bytes'),
        newSizeBytes: num(s, 'newSizeBytes', 'new_size_bytes'),
        isText: bool(s, 'isText', 'is_text'),
        languageHint: str(s, 'languageHint', 'language_hint'),
        textDiffStatus: normalizeTextDiffStatusValue(enumValue(s, 'textDiffStatus', 'text_diff_status')),
        unifiedDiff: str(s, 'unifiedDiff', 'unified_diff'),
        diffTruncated: bool(s, 'diffTruncated', 'diff_truncated'),
        oldPreview: str(s, 'oldPreview', 'old_preview'),
        newPreview: str(s, 'newPreview', 'new_preview'),
        diffDetailAvailable: bool(s, 'diffDetailAvailable', 'diff_detail_available'),
    };
}

function normalizeOptionalEntryKindValue(value: string | number | undefined): AssetEntryKind | '' {
    if (value === undefined || value === '' || value === 0 || value === 'ASSET_ENTRY_KIND_UNSPECIFIED') {
        return '';
    }
    return normalizeEntryKindValue(value);
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
        textDiffCount: num(s, 'textDiffCount', 'text_diff_count'),
        binaryChangeCount: num(s, 'binaryChangeCount', 'binary_change_count'),
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
 *
 * All public version-related fields and parameters use the business version
 * identifier from `asset_versions.version_id`.
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

    async ensureCollection(
        assetSpace: string,
        assetId: string,
        params?: {
            scopeKind?: AssetScopeKind;
            scopeValue?: string;
            displayName?: string;
            description?: string;
        },
    ): Promise<AssetCollection> {
        const { data } = await this.http.post('/api/v1/assets:ensure', {
            asset_space: assetSpace,
            asset_id: assetId,
            scope_kind: params?.scopeKind ? `ASSET_SCOPE_KIND_${params.scopeKind.toUpperCase()}` : undefined,
            scope_value: params?.scopeValue,
            display_name: params?.displayName,
            description: params?.description,
        });
        return normalizeCollection(unwrap(data));
    }

    // ===== Tree =====

    async listTree(
        assetSpace: string,
        assetId: string,
        params?: {
            versionId?: AssetVersionId;
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
        versionId: AssetVersionId,
    ): Promise<AssetVersionDetailResult> {
        const { data } = await this.http.get(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}/versions/${enc(versionId)}`,
        );
        const d = rec(unwrap(data));
        return {
            collection: normalizeCollection(d.collection),
            version: normalizeVersion(d.version),
            baseVersion: d.baseVersion || d.base_version
                ? normalizeVersion(d.baseVersion ?? d.base_version)
                : undefined,
            draftDiffSummary: d.draftDiffSummary || d.draft_diff_summary
                ? normalizeSummary(d.draftDiffSummary ?? d.draft_diff_summary)
                : undefined,
        };
    }

    // ===== Draft lifecycle =====

    async createDraft(
        assetSpace: string,
        assetId: string,
        params?: {
            baseVersionId?: AssetVersionId;
            draftVersionId?: AssetVersionId;
            description?: string;
            displayVersion?: string;
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
                display_version: params?.displayVersion,
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
        draftVersionId: AssetVersionId,
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
        draftVersionId: AssetVersionId,
        params?: { versionId?: AssetVersionId; description?: string; displayVersion?: string },
    ): Promise<PublishResult> {
        const { data } = await this.http.post(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:publishDraft`,
            {
                asset_space: assetSpace,
                asset_id: assetId,
                draft_version_id: draftVersionId,
                version_id: params?.versionId,
                description: params?.description,
                display_version: params?.displayVersion,
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
        versionId: AssetVersionId,
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
            draftVersionId: AssetVersionId;
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
            draftVersionId: AssetVersionId;
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
            draftVersionId: AssetVersionId;
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
        leftVersionId: AssetVersionId,
        rightVersionId: AssetVersionId,
        params?: {
            diffMode?: AssetDiffMode;
            pathPrefix?: string;
            pageSize?: number;
            pageToken?: string;
        },
    ): Promise<DiffResult> {
        const { data } = await this.http.post(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:diffVersions`,
            {
                asset_space: assetSpace,
                asset_id: assetId,
                left_version_id: leftVersionId,
                right_version_id: rightVersionId,
                diff_mode: params?.diffMode ? toProtoDiffMode(params.diffMode) : undefined,
                path_prefix: params?.pathPrefix,
                page_size: params?.pageSize,
                page_token: params?.pageToken,
            },
        );
        return this.parseDiffResponse(data);
    }

    async diffDraft(
        assetSpace: string,
        assetId: string,
        draftVersionId: AssetVersionId,
        params?: {
            baseVersionId?: AssetVersionId;
            diffMode?: AssetDiffMode;
            pathPrefix?: string;
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
                diff_mode: params?.diffMode ? toProtoDiffMode(params.diffMode) : undefined,
                path_prefix: params?.pathPrefix,
                page_size: params?.pageSize,
                page_token: params?.pageToken,
            },
        );
        return this.parseDiffResponse(data);
    }

    async getDiffEntryDetail(
        assetSpace: string,
        assetId: string,
        leftVersionId: AssetVersionId,
        rightVersionId: AssetVersionId,
        path: string,
        params?: { diffMode?: AssetDiffMode },
    ): Promise<DiffEntryDetailResult> {
        const { data } = await this.http.post(
            `/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:getDiffEntry`,
            {
                asset_space: assetSpace,
                asset_id: assetId,
                left_version_id: leftVersionId,
                right_version_id: rightVersionId,
                path,
                diff_mode: params?.diffMode ? toProtoDiffMode(params.diffMode) : undefined,
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
        targetVersionId: AssetVersionId,
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
            versionId?: AssetVersionId;
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
            draftVersionId: AssetVersionId;
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

function toProtoDiffMode(mode: AssetDiffMode): string {
    return mode === 'structure_only'
        ? 'ASSET_DIFF_MODE_STRUCTURE_ONLY'
        : 'ASSET_DIFF_MODE_WITH_TEXT';
}

function enc(v: string): string {
    return encodeURIComponent(v);
}
