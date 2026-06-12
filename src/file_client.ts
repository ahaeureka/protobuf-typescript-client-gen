import axios, { AxiosInstance, AxiosProgressEvent } from 'axios';

const STORAGE_PREFIX = 'stew_file_upload_';

type UnknownRecord = Record<string, unknown>;

export interface FileInfo {
    fileId: string;
    filename: string;
    contentType: string;
    fileSize: number;
    folder: string;
    checksum: string;
    createdAt: string;
    updatedAt: string;
    /** Storage key (object path in the storage backend). */
    storageKey?: string;
    /** Local filesystem path if S3 local_cache is enabled. */
    localPath?: string;
}

export interface CallbackResult {
    /** Whether the business side accepted the file. */
    accepted: boolean;
    /** Business-assigned reference ID. */
    businessId?: string;
    /** Optional message from the callback. */
    message?: string;
}

export interface UploadResponse {
    fileId: string;
    filename: string;
    fileSize: number;
    contentType: string;
    checksum: string;
    /** Local filesystem path if S3 local_cache is enabled. */
    localPath?: string;
    /** Callback result (only present when sync callback is enabled). */
    callbackResult?: CallbackResult;
}

export interface ListFilesResponse {
    files: FileInfo[];
    totalCount: number;
    nextPageToken: string;
}

export interface UploadPartResult {
    etag: string;
    partNumber: number;
}

export interface UploadSession {
    uploadId: string;
    fileId: string;
    filename: string;
    totalParts: number;
    completedParts: UploadPartResult[];
}

export interface ResumableUploadProgress {
    uploadId: string;
    filename: string;
    checksum: string;
    partSize: number;
    uploadedParts: number;
    totalParts: number;
    completedEtags: UploadPartResult[];
}

export interface UploadStatusResult {
    uploadId: string;
    status: number | string;
    completedParts: UploadPartResult[];
    totalParts: number;
    expiresAt: string;
    filename?: string;
    totalSize?: number;
}

export interface ChunkDownloadProgress {
    downloadedBytes: number;
    totalBytes: number;
    chunkIndex: number;
    totalChunks: number;
}

export interface ChunkDownloadResult {
    blob: Blob;
    filename: string;
    chunkCount: number;
    totalBytes: number;
    checksum: string;
    verifiedByServer: boolean;
}

export interface FileStorageClientOptions {
    baseUrl: string;
    timeout?: number;
    /** Part size for resumable uploads in bytes (default: 5MB) */
    partSize?: number;
}

function asRecord(value: unknown): UnknownRecord {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as UnknownRecord)
        : {};
}

function readString(source: UnknownRecord, ...keys: string[]): string | undefined {
    for (const key of keys) {
        const value = source[key];
        if (typeof value === 'string' && value.trim() !== '') {
            return value;
        }
    }
    return undefined;
}

function readNumber(source: UnknownRecord, ...keys: string[]): number | undefined {
    for (const key of keys) {
        const value = source[key];
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === 'string' && value.trim() !== '') {
            const parsed = Number(value);
            if (!Number.isNaN(parsed)) {
                return parsed;
            }
        }
    }
    return undefined;
}

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((value) => value.toString(16).padStart(2, '0'))
        .join('');
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

function normalizeFileInfo(payload: unknown): FileInfo {
    const source = asRecord(payload);
    return {
        fileId: readString(source, 'fileId', 'file_id', 'id') ?? '',
        filename: readString(source, 'filename') ?? '',
        contentType:
            readString(source, 'contentType', 'content_type') ??
            'application/octet-stream',
        fileSize: readNumber(source, 'fileSize', 'file_size') ?? 0,
        folder: readString(source, 'folder') ?? '/',
        checksum: readString(source, 'checksum') ?? '',
        createdAt: readString(source, 'createdAt', 'created_at') ?? '',
        updatedAt: readString(source, 'updatedAt', 'updated_at') ?? '',
        storageKey: readString(source, 'storageKey', 'storage_key'),
        localPath: readString(source, 'localPath', 'local_path'),
    };
}

function normalizeUploadResponse(payload: unknown): UploadResponse {
    const source = asRecord(payload);
    const fileInfo = asRecord(source.fileInfo);
    const normalizedFile = normalizeFileInfo(
        Object.keys(fileInfo).length > 0 ? fileInfo : source,
    );
    const callbackResult = asRecord(source.callbackResult);

    return {
        fileId: normalizedFile.fileId,
        filename: normalizedFile.filename,
        fileSize: normalizedFile.fileSize,
        contentType: normalizedFile.contentType,
        checksum: normalizedFile.checksum,
        localPath: normalizedFile.localPath,
        callbackResult:
            Object.keys(callbackResult).length > 0
                ? {
                      accepted: Boolean(callbackResult.accepted),
                      businessId: readString(callbackResult, 'businessId', 'business_id'),
                      message: readString(callbackResult, 'message'),
                  }
                : undefined,
    };
}

function normalizeUploadStatus(payload: unknown): UploadStatusResult {
    const source = asRecord(payload);
    const completedParts = Array.isArray(source.completedParts)
        ? source.completedParts
              .map((item) => {
                  const record = asRecord(item);
                  const partNumber = readNumber(
                      record,
                      'partNumber',
                      'part_number',
                  );
                  const etag = readString(record, 'etag');
                  if (!partNumber || !etag) {
                      return null;
                  }
                  return { partNumber, etag };
              })
              .filter((item): item is UploadPartResult => item !== null)
        : [];

    return {
        uploadId: readString(source, 'uploadId', 'upload_id') ?? '',
        status:
            source.status === undefined
                ? ''
                : (source.status as number | string),
        completedParts,
        totalParts: readNumber(source, 'totalParts', 'total_parts') ?? 0,
        expiresAt: readString(source, 'expiresAt', 'expires_at') ?? '',
        filename: readString(source, 'filename'),
        totalSize: readNumber(source, 'totalSize', 'total_size'),
    };
}

function isActiveUploadStatus(status: number | string): boolean {
    return (
        status === 1 ||
        status === '1' ||
        status === 'active' ||
        status === 'UPLOAD_SESSION_STATUS_ACTIVE'
    );
}

export class FileStorageClient {
    private client: AxiosInstance;
    private partSize: number;

    constructor(options: FileStorageClientOptions) {
        this.partSize = options.partSize ?? 5 * 1024 * 1024;
        this.client = axios.create({
            baseURL: options.baseUrl,
            timeout: options.timeout ?? 30000,
            withCredentials: true,
        });
    }

    async computeChecksum(file: Blob): Promise<string> {
        if (!globalThis.crypto?.subtle) {
            throw new Error(
                'Current runtime does not support Web Crypto SHA-256.',
            );
        }

        const digest = await globalThis.crypto.subtle.digest(
            'SHA-256',
            await file.arrayBuffer(),
        );
        return bytesToHex(new Uint8Array(digest));
    }

    /**
     * Simple file upload (for files smaller than partSize).
     * @param businessContext - Arbitrary JSON to forward to the business callback.
     * @param callbackUrl - Per-request callback URL override.
     */
    async uploadFile(
        file: File | Blob,
        options?: {
            folder?: string;
            contentType?: string;
            filename?: string;
            /** Arbitrary JSON context forwarded to the business callback. */
            businessContext?: Record<string, unknown>;
            /** Per-request callback URL override. */
            callbackUrl?: string;
            onProgress?: (event: AxiosProgressEvent) => void;
        },
    ): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append('file', file, options?.filename);
        if (options?.folder) {
            formData.append('folder', options.folder);
        }
        if (options?.contentType) {
            formData.append('content_type', options.contentType);
        }
        if (options?.businessContext) {
            formData.append(
                'business_context',
                JSON.stringify(options.businessContext),
            );
        }

        const headers: Record<string, string> = {};
        if (options?.callbackUrl) {
            headers['X-Upload-Callback-Url'] = options.callbackUrl;
        }

        const resp = await this.client.post<UploadResponse>(
            '/api/v1/files/upload',
            formData,
            {
                onUploadProgress: options?.onProgress,
                headers,
            },
        );
        return normalizeUploadResponse(resp.data);
    }

    /**
     * Resumable upload: initializes a new upload session.
     * @param businessContext - Arbitrary JSON to forward to the business callback on completion.
     * @param callbackUrl - Per-request callback URL override.
     */
    async initResumableUpload(
        filename: string,
        totalSize: number,
        options?: {
            folder?: string;
            contentType?: string;
            partSize?: number;
            checksum?: string;
            /** Arbitrary JSON context forwarded to the business callback on completion. */
            businessContext?: Record<string, unknown>;
            /** Per-request callback URL override (stored in session for completion). */
            callbackUrl?: string;
        },
    ): Promise<{ uploadId: string; partSize: number; totalParts: number }> {
        const headers: Record<string, string> = {};
        if (options?.callbackUrl) {
            headers['X-Upload-Callback-Url'] = options.callbackUrl;
        }

        const resp = await this.client.post(
            '/api/v1/files/upload/init',
            {
                filename,
                total_size: totalSize.toString(),
                folder: options?.folder ?? '',
                content_type:
                    options?.contentType ?? 'application/octet-stream',
                part_size: (options?.partSize ?? this.partSize).toString(),
                business_context: options?.businessContext
                    ? JSON.stringify(options.businessContext)
                    : '',
                checksum: options?.checksum ?? '',
            },
            { headers },
        );

        const source = asRecord(resp.data);
        const data = {
            uploadId: readString(source, 'uploadId', 'upload_id') ?? '',
            partSize:
                readNumber(source, 'partSize', 'part_size') ??
                (options?.partSize ?? this.partSize),
            totalParts: readNumber(source, 'totalParts', 'total_parts') ?? 0,
        };
        this.saveProgress(data.uploadId, {
            uploadId: data.uploadId,
            filename,
            checksum: options?.checksum ?? '',
            partSize: options?.partSize ?? this.partSize,
            uploadedParts: 0,
            totalParts: data.totalParts,
            completedEtags: [],
        });

        return data;
    }

    /**
     * Resumable upload: upload a single part.
     */
    async uploadPart(
        uploadId: string,
        partNumber: number,
        data: Blob | ArrayBuffer,
        onProgress?: (event: AxiosProgressEvent) => void,
    ): Promise<UploadPartResult> {
        const formData = new FormData();
        const blob = data instanceof Blob ? data : new Blob([data]);
        formData.append('file', blob);

        const resp = await this.client.post<{ etag: string }>(
            `/api/v1/files/upload/${uploadId}/parts/${partNumber}`,
            formData,
            { onUploadProgress: onProgress },
        );

        const result: UploadPartResult = { etag: resp.data.etag, partNumber };

        // Update saved progress
        const progress = this.loadProgress(uploadId);
        if (progress) {
            progress.completedEtags.push(result);
            progress.uploadedParts = progress.completedEtags.length;
            this.saveProgress(uploadId, progress);
        }

        return result;
    }

    /**
     * Resumable upload: complete the upload session by combining all parts.
     */
    async completeResumableUpload(
        uploadId: string,
        partEtags: UploadPartResult[],
    ): Promise<UploadResponse> {
        const resp = await this.client.post<UploadResponse>(
            `/api/v1/files/upload/${uploadId}/complete`,
            {
                upload_id: uploadId,
                parts: partEtags.map((p) => ({
                    part_number: p.partNumber,
                    etag: p.etag,
                })),
            },
        );

        this.clearProgress(uploadId);
        return normalizeUploadResponse(resp.data);
    }

    /**
     * Resumable upload: abort and clean up an upload session.
     */
    async abortResumableUpload(uploadId: string): Promise<void> {
        await this.client.delete(`/api/v1/files/upload/${uploadId}`);
        this.clearProgress(uploadId);
    }

    /**
     * Get upload session status from the server.
     */
    async getUploadStatus(
        uploadId: string,
    ): Promise<UploadStatusResult> {
        const resp = await this.client.get(
            `/api/v1/files/upload/${uploadId}/status`,
        );
        return normalizeUploadStatus(resp.data);
    }

    /**
     * Download a file by its ID. Returns a Blob.
     */
    async downloadFile(fileId: string): Promise<{ blob: Blob; filename: string }> {
        const resp = await this.client.get(`/api/v1/files/${fileId}/download`, {
            responseType: 'blob',
        });

        return {
            blob: resp.data,
            filename: parseContentDispositionFilename(
                resp.headers['content-disposition'],
                fileId,
            ),
        };
    }

    async verifyDownloadChecksum(
        fileId: string,
        checksum: string,
    ): Promise<boolean> {
        const resp = await this.client.get(`/api/v1/files/${fileId}/download`, {
            params: {
                checksum,
                verify_only: 'true',
            },
            responseType: 'blob',
            validateStatus: (status) =>
                (status >= 200 && status < 300) || status === 412,
        });

        if (resp.status === 412) {
            return false;
        }

        return resp.headers['x-checksum-verified'] === 'true' || resp.status === 204;
    }

    /**
     * Delete a file by its ID.
     */
    async deleteFile(fileId: string): Promise<void> {
        await this.client.delete(`/api/v1/files/${fileId}`);
    }

    /**
     * List files for the current user.
     */
    async listFiles(options?: {
        folder?: string;
        pageSize?: number;
        pageToken?: string;
    }): Promise<ListFilesResponse> {
        const params: Record<string, string> = {};
        if (options?.folder) params['folder'] = options.folder;
        if (options?.pageSize) params['pageSize'] = options.pageSize.toString();
        if (options?.pageToken) params['pageToken'] = options.pageToken;

        const resp = await this.client.get<ListFilesResponse>('/api/v1/files', {
            params,
        });
        const source = asRecord(resp.data);
        const files = Array.isArray(source.files)
            ? source.files.map((item) => normalizeFileInfo(item))
            : [];
        return {
            files,
            totalCount: readNumber(source, 'totalCount', 'total_count') ?? files.length,
            nextPageToken:
                readString(source, 'nextPageToken', 'next_page_token') ?? '',
        };
    }

    /**
     * Get file metadata by its ID.
     */
    async getFileInfo(fileId: string): Promise<FileInfo> {
        const resp = await this.client.get<FileInfo>(
            `/api/v1/files/${fileId}/info`,
        );
        return normalizeFileInfo(resp.data);
    }

    async downloadFileInChunks(
        file: FileInfo,
        options?: {
            chunkSize?: number;
            verifyChecksum?: boolean;
            onProgress?: (progress: ChunkDownloadProgress) => void;
        },
    ): Promise<ChunkDownloadResult> {
        const info = file.fileSize > 0 ? file : await this.getFileInfo(file.fileId);
        if (info.fileSize <= 0) {
            throw new Error('File size is unknown, cannot download in chunks.');
        }

        const chunkSize = Math.max(options?.chunkSize ?? 1024 * 1024, 256 * 1024);
        const totalChunks = Math.ceil(info.fileSize / chunkSize);
        const blobs: Blob[] = [];
        let resolvedFilename = info.filename || info.fileId;

        for (let index = 0; index < totalChunks; index += 1) {
            const start = index * chunkSize;
            const end = Math.min(info.fileSize - 1, start + chunkSize - 1);
            const resp = await this.client.get(`/api/v1/files/${info.fileId}/download`, {
                headers: {
                    Range: `bytes=${start}-${end}`,
                },
                responseType: 'blob',
                validateStatus: (status) => status === 200 || status === 206,
            });

            resolvedFilename = parseContentDispositionFilename(
                resp.headers['content-disposition'],
                resolvedFilename,
            );
            blobs.push(resp.data);

            options?.onProgress?.({
                downloadedBytes: Math.min(end + 1, info.fileSize),
                totalBytes: info.fileSize,
                chunkIndex: index + 1,
                totalChunks,
            });
        }

        const blob = new Blob(blobs, {
            type: info.contentType || 'application/octet-stream',
        });
        const checksum = await this.computeChecksum(blob);
        const verifiedByServer =
            options?.verifyChecksum === false
                ? false
                : await this.verifyDownloadChecksum(info.fileId, checksum);

        return {
            blob,
            filename: resolvedFilename,
            chunkCount: totalChunks,
            totalBytes: info.fileSize,
            checksum,
            verifiedByServer,
        };
    }

    /**
     * Upload a large file with automatic chunking and resumable support.
     * Persists progress to localStorage for crash recovery.
     */
    async uploadFileResumable(
        file: File,
        options?: {
            folder?: string;
            contentType?: string;
            partSize?: number;
            checksum?: string;
            businessContext?: Record<string, unknown>;
            callbackUrl?: string;
            onPartComplete?: (partNumber: number, totalParts: number) => void;
            onProgress?: (uploaded: number, total: number) => void;
        },
    ): Promise<UploadResponse> {
        const partSize = options?.partSize ?? this.partSize;
        const checksum = options?.checksum ?? (await this.computeChecksum(file));
        const totalParts = Math.ceil(file.size / partSize);

        // Check if there is a saved session for this file
        const existingProgress = this.findProgressForFile(file.name, file.size, checksum);
        let uploadId: string;
        let completedEtags: UploadPartResult[];
        let startPart: number;

        if (existingProgress) {
            // Resume existing upload
            const status = await this.getUploadStatus(existingProgress.uploadId).catch(() => null);
            if (status && isActiveUploadStatus(status.status)) {
                uploadId = existingProgress.uploadId;
                completedEtags =
                    status.completedParts.length > 0
                        ? status.completedParts
                        : existingProgress.completedEtags;
                startPart = completedEtags.length + 1;
            } else {
                // Session expired or invalid, start over
                this.clearProgress(existingProgress.uploadId);
                const session = await this.initResumableUpload(file.name, file.size, {
                    folder: options?.folder,
                    contentType: options?.contentType ?? file.type,
                    partSize,
                    checksum,
                    businessContext: options?.businessContext,
                    callbackUrl: options?.callbackUrl,
                });
                uploadId = session.uploadId;
                completedEtags = [];
                startPart = 1;
            }
        } else {
            const session = await this.initResumableUpload(file.name, file.size, {
                folder: options?.folder,
                contentType: options?.contentType ?? file.type,
                partSize,
                checksum,
                businessContext: options?.businessContext,
                callbackUrl: options?.callbackUrl,
            });
            uploadId = session.uploadId;
            completedEtags = [];
            startPart = 1;
        }

        // Upload remaining parts
        for (let i = startPart; i <= totalParts; i++) {
            const start = (i - 1) * partSize;
            const end = Math.min(i * partSize, file.size);
            const chunk = file.slice(start, end);

            const result = await this.uploadPart(uploadId, i, chunk);
            completedEtags.push(result);

            options?.onPartComplete?.(i, totalParts);
            options?.onProgress?.(end, file.size);
        }

        // Complete the upload
        return this.completeResumableUpload(uploadId, completedEtags);
    }

    listSavedResumableUploads(): ResumableUploadProgress[] {
        const uploads: ResumableUploadProgress[] = [];
        try {
            if (typeof localStorage === 'undefined') {
                return uploads;
            }

            for (let i = 0; i < localStorage.length; i += 1) {
                const key = localStorage.key(i);
                if (!key || !key.startsWith(STORAGE_PREFIX)) {
                    continue;
                }

                const raw = localStorage.getItem(key);
                if (!raw) {
                    continue;
                }

                uploads.push(JSON.parse(raw) as ResumableUploadProgress);
            }
        } catch {
            return uploads;
        }

        return uploads;
    }

    // -- localStorage persistence for crash recovery --

    private saveProgress(uploadId: string, progress: ResumableUploadProgress): void {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(
                    STORAGE_PREFIX + uploadId,
                    JSON.stringify(progress),
                );
            }
        } catch {
            // localStorage may be unavailable
        }
    }

    private loadProgress(uploadId: string): ResumableUploadProgress | null {
        try {
            if (typeof localStorage !== 'undefined') {
                const raw = localStorage.getItem(STORAGE_PREFIX + uploadId);
                return raw ? JSON.parse(raw) : null;
            }
        } catch {
            // ignore
        }
        return null;
    }

    private clearProgress(uploadId: string): void {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(STORAGE_PREFIX + uploadId);
            }
        } catch {
            // ignore
        }
    }

    private findProgressForFile(
        filename: string,
        _fileSize: number,
        checksum: string,
    ): ResumableUploadProgress | null {
        try {
            if (typeof localStorage === 'undefined') return null;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STORAGE_PREFIX)) {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const progress: ResumableUploadProgress = JSON.parse(raw);
                        if (
                            progress.filename === filename &&
                            (!progress.checksum || progress.checksum === checksum)
                        ) {
                            return progress;
                        }
                    }
                }
            }
        } catch {
            // ignore
        }
        return null;
    }
}
