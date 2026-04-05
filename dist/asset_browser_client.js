"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetBrowserClient = void 0;
const axios_1 = __importDefault(require("axios"));
function rec(v) {
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}
function str(source, ...keys) {
    for (const k of keys) {
        const v = source[k];
        if (typeof v === 'string')
            return v;
    }
    return '';
}
function num(source, ...keys) {
    for (const k of keys) {
        const v = source[k];
        if (typeof v === 'number')
            return v;
        if (typeof v === 'string') {
            const n = Number(v);
            if (!Number.isNaN(n))
                return n;
        }
    }
    return 0;
}
function bool(source, ...keys) {
    for (const k of keys) {
        const v = source[k];
        if (typeof v === 'boolean')
            return v;
    }
    return false;
}
function normalizeCollection(raw) {
    const s = rec(raw);
    return {
        assetSpace: str(s, 'assetSpace', 'asset_space'),
        assetId: str(s, 'assetId', 'asset_id'),
        displayName: str(s, 'displayName', 'display_name'),
        description: str(s, 'description'),
        scopeKind: str(s, 'scopeKind', 'scope_kind') || 'user',
        scopeValue: str(s, 'scopeValue', 'scope_value'),
        activeVersionId: str(s, 'activeVersionId', 'active_version_id'),
        draftVersionId: str(s, 'draftVersionId', 'draft_version_id'),
        hasDraft: bool(s, 'hasDraft', 'has_draft'),
        totalVersions: num(s, 'totalVersions', 'total_versions'),
        createdAt: str(s, 'createdAt', 'created_at'),
        updatedAt: str(s, 'updatedAt', 'updated_at'),
    };
}
function normalizeVersion(raw) {
    const s = rec(raw);
    return {
        assetSpace: str(s, 'assetSpace', 'asset_space'),
        assetId: str(s, 'assetId', 'asset_id'),
        versionId: str(s, 'versionId', 'version_id'),
        status: (str(s, 'status') || 'draft'),
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
function normalizeEntry(raw) {
    const s = rec(raw);
    return {
        entryKind: (str(s, 'entryKind', 'entry_kind') || 'file'),
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
function normalizeDiffEntry(raw) {
    const s = rec(raw);
    return {
        path: str(s, 'path'),
        changeType: (str(s, 'changeType', 'change_type') || 'modified'),
        oldChecksum: str(s, 'oldChecksum', 'old_checksum'),
        newChecksum: str(s, 'newChecksum', 'new_checksum'),
        oldSizeBytes: num(s, 'oldSizeBytes', 'old_size_bytes'),
        newSizeBytes: num(s, 'newSizeBytes', 'new_size_bytes'),
        diffDetailAvailable: bool(s, 'diffDetailAvailable', 'diff_detail_available'),
    };
}
function normalizeSummary(raw) {
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
function parseContentDispositionFilename(header, fallback) {
    if (!header) {
        return fallback;
    }
    const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        try {
            return decodeURIComponent(utf8Match[1]);
        }
        catch {
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
function unwrap(payload) {
    const r = rec(payload);
    if (typeof r.code === 'number' && 'data' in r) {
        return r.data;
    }
    return payload;
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
class AssetBrowserClient {
    constructor(options) {
        const baseUrl = options.baseUrl.replace(/\/$/, '');
        this.http = axios_1.default.create({
            baseURL: baseUrl,
            timeout: options.timeout ?? 30000,
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
    async listCollections(params) {
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
    async getCollection(assetSpace, assetId) {
        const { data } = await this.http.get(`/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}`);
        return normalizeCollection(unwrap(data));
    }
    // ===== Tree =====
    async listTree(assetSpace, assetId, params) {
        const { data } = await this.http.get(`/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}/tree`, {
            params: {
                version_id: params?.versionId,
                folder: params?.folder,
                page_size: params?.pageSize,
                page_token: params?.pageToken,
                include_files: params?.includeFiles,
                include_directories: params?.includeDirectories,
            },
        });
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
    async listVersions(assetSpace, assetId, params) {
        const { data } = await this.http.get(`/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}/versions`, { params: { include_archived: params?.includeArchived } });
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
    async getVersion(assetSpace, assetId, versionId) {
        const { data } = await this.http.get(`/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}/versions/${enc(versionId)}`);
        const d = rec(unwrap(data));
        return {
            collection: normalizeCollection(d.collection),
            version: normalizeVersion(d.version),
        };
    }
    // ===== Draft lifecycle =====
    async createDraft(assetSpace, assetId, params) {
        const { data } = await this.http.post(`/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:createDraft`, {
            asset_space: assetSpace,
            asset_id: assetId,
            base_version_id: params?.baseVersionId,
            draft_version_id: params?.draftVersionId,
            description: params?.description,
        });
        const d = rec(unwrap(data));
        return {
            collection: normalizeCollection(d.collection),
            draftVersion: normalizeVersion(d.draftVersion ?? d.draft_version),
        };
    }
    async discardDraft(assetSpace, assetId, draftVersionId) {
        await this.http.post(`/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:discardDraft`, {
            asset_space: assetSpace,
            asset_id: assetId,
            draft_version_id: draftVersionId,
        });
    }
    async publishDraft(assetSpace, assetId, draftVersionId, params) {
        const { data } = await this.http.post(`/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:publishDraft`, {
            asset_space: assetSpace,
            asset_id: assetId,
            draft_version_id: draftVersionId,
            version_id: params?.versionId,
            description: params?.description,
        });
        const d = rec(unwrap(data));
        return {
            collection: normalizeCollection(d.collection),
            publishedVersion: normalizeVersion(d.publishedVersion ?? d.published_version),
            activeVersionId: str(d, 'activeVersionId', 'active_version_id'),
        };
    }
    // ===== Draft editing =====
    async getEntryText(assetSpace, assetId, versionId, path) {
        const { data } = await this.http.post(`/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:getEntryText`, {
            asset_space: assetSpace,
            asset_id: assetId,
            version_id: versionId,
            path,
        });
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
    async saveDraftText(assetSpace, assetId, params) {
        const { data } = await this.http.post(`/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:saveDraftText`, {
            asset_space: assetSpace,
            asset_id: assetId,
            draft_version_id: params.draftVersionId,
            path: params.path,
            text: params.text,
            content_type: params.contentType,
            expected_entry_revision: params.expectedEntryRevision,
        });
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
    async renameDraftEntry(assetSpace, assetId, params) {
        const { data } = await this.http.post(`/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:renameDraftEntry`, {
            asset_space: assetSpace,
            asset_id: assetId,
            draft_version_id: params.draftVersionId,
            path: params.path,
            new_path: params.newPath,
        });
        const d = rec(unwrap(data));
        return { oldPath: str(d, 'oldPath', 'old_path') };
    }
    async deleteDraftEntry(assetSpace, assetId, params) {
        const { data } = await this.http.post(`/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:deleteDraftEntry`, {
            asset_space: assetSpace,
            asset_id: assetId,
            draft_version_id: params.draftVersionId,
            path: params.path,
        });
        const d = rec(unwrap(data));
        return { deletedPath: str(d, 'deletedPath', 'deleted_path') };
    }
    // ===== Diff =====
    async diffVersions(assetSpace, assetId, leftVersionId, rightVersionId, params) {
        const { data } = await this.http.post(`/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:diffVersions`, {
            asset_space: assetSpace,
            asset_id: assetId,
            left_version_id: leftVersionId,
            right_version_id: rightVersionId,
            page_size: params?.pageSize,
            page_token: params?.pageToken,
        });
        return this.parseDiffResponse(data);
    }
    async diffDraft(assetSpace, assetId, draftVersionId, params) {
        const { data } = await this.http.post(`/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:diffDraft`, {
            asset_space: assetSpace,
            asset_id: assetId,
            draft_version_id: draftVersionId,
            base_version_id: params?.baseVersionId,
            page_size: params?.pageSize,
            page_token: params?.pageToken,
        });
        return this.parseDiffResponse(data);
    }
    async getDiffEntryDetail(assetSpace, assetId, leftVersionId, rightVersionId, path) {
        const { data } = await this.http.post(`/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:getDiffEntry`, {
            asset_space: assetSpace,
            asset_id: assetId,
            left_version_id: leftVersionId,
            right_version_id: rightVersionId,
            path,
        });
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
    async activateVersion(assetSpace, assetId, targetVersionId) {
        const { data } = await this.http.post(`/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}:activateVersion`, {
            asset_space: assetSpace,
            asset_id: assetId,
            target_version_id: targetVersionId,
        });
        const d = rec(unwrap(data));
        return {
            collection: normalizeCollection(d.collection),
            activeVersionId: str(d, 'activeVersionId', 'active_version_id'),
            activeVersion: normalizeVersion(d.activeVersion ?? d.active_version),
        };
    }
    async downloadEntry(assetSpace, assetId, params) {
        const fallbackName = params?.path
            ? params.path.split('/').filter(Boolean).pop() || `${assetId}.zip`
            : `${assetId}.zip`;
        const resp = await this.http.get(`/api/v1/assets/${enc(assetSpace)}/${enc(assetId)}/export`, {
            params: {
                version_id: params?.versionId,
                path: params?.path,
            },
            responseType: 'blob',
        });
        return {
            blob: resp.data,
            filename: parseContentDispositionFilename(resp.headers['content-disposition'], fallbackName),
            contentType: (typeof resp.headers['content-type'] === 'string'
                ? resp.headers['content-type']
                : '') || resp.data.type || 'application/octet-stream',
        };
    }
    // ===== Convenience helpers =====
    /**
     * Save text to a draft entry and immediately diff the draft against its
     * base version.  Useful for implementing "save-and-preview" workflows.
     */
    async saveAndDiffDraft(assetSpace, assetId, params) {
        const save = await this.saveDraftText(assetSpace, assetId, params);
        const diff = await this.diffDraft(assetSpace, assetId, params.draftVersionId);
        return { save, diff };
    }
    // ===== Internal =====
    parseDiffResponse(data) {
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
    getToken() {
        if (typeof window === 'undefined')
            return null;
        try {
            return (window.localStorage.getItem('access_token') ||
                window.localStorage.getItem('token') ||
                window.sessionStorage.getItem('access_token') ||
                window.sessionStorage.getItem('token') ||
                null);
        }
        catch {
            return null;
        }
    }
}
exports.AssetBrowserClient = AssetBrowserClient;
function enc(v) {
    return encodeURIComponent(v);
}
