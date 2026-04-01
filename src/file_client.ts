import axios, { AxiosInstance, AxiosProgressEvent } from 'axios';

const STORAGE_PREFIX = 'stew_file_upload_';

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
    partSize: number;
    uploadedParts: number;
    totalParts: number;
    completedEtags: UploadPartResult[];
}

export interface FileStorageClientOptions {
    baseUrl: string;
    timeout?: number;
    /** Part size for resumable uploads in bytes (default: 5MB) */
    partSize?: number;
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
        return resp.data;
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
                totalSize: totalSize.toString(),
                folder: options?.folder ?? '',
                contentType: options?.contentType ?? 'application/octet-stream',
                partSize: (options?.partSize ?? this.partSize).toString(),
                businessContext: options?.businessContext
                    ? JSON.stringify(options.businessContext)
                    : '',
            },
            { headers },
        );

        const data = resp.data;
        this.saveProgress(data.uploadId, {
            uploadId: data.uploadId,
            filename,
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
                uploadId,
                partEtags: partEtags.map((p) => ({
                    partNumber: p.partNumber,
                    etag: p.etag,
                })),
            },
        );

        this.clearProgress(uploadId);
        return resp.data;
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
    ): Promise<{
        uploadId: string;
        status: string;
        completedParts: number;
        totalParts: number;
        expiresAt: string;
    }> {
        const resp = await this.client.get(
            `/api/v1/files/upload/${uploadId}/status`,
        );
        return resp.data;
    }

    /**
     * Download a file by its ID. Returns a Blob.
     */
    async downloadFile(fileId: string): Promise<{ blob: Blob; filename: string }> {
        const resp = await this.client.get(`/api/v1/files/${fileId}/download`, {
            responseType: 'blob',
        });

        // Try to extract filename from content-disposition header
        const disposition = resp.headers['content-disposition'];
        let filename = fileId;
        if (disposition) {
            const match = disposition.match(/filename="?(.+?)"?$/);
            if (match) {
                filename = match[1];
            }
        }

        return { blob: resp.data, filename };
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
        return resp.data;
    }

    /**
     * Get file metadata by its ID.
     */
    async getFileInfo(fileId: string): Promise<FileInfo> {
        const resp = await this.client.get<FileInfo>(
            `/api/v1/files/${fileId}/info`,
        );
        return resp.data;
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
            businessContext?: Record<string, unknown>;
            callbackUrl?: string;
            onPartComplete?: (partNumber: number, totalParts: number) => void;
            onProgress?: (uploaded: number, total: number) => void;
        },
    ): Promise<UploadResponse> {
        const partSize = options?.partSize ?? this.partSize;
        const totalParts = Math.ceil(file.size / partSize);

        // Check if there is a saved session for this file
        const existingProgress = this.findProgressForFile(file.name, file.size);
        let uploadId: string;
        let completedEtags: UploadPartResult[];
        let startPart: number;

        if (existingProgress) {
            // Resume existing upload
            const status = await this.getUploadStatus(existingProgress.uploadId).catch(() => null);
            if (status && status.status === 'in_progress') {
                uploadId = existingProgress.uploadId;
                completedEtags = existingProgress.completedEtags;
                startPart = existingProgress.uploadedParts + 1;
            } else {
                // Session expired or invalid, start over
                this.clearProgress(existingProgress.uploadId);
                const session = await this.initResumableUpload(file.name, file.size, {
                    folder: options?.folder,
                    contentType: options?.contentType ?? file.type,
                    partSize,
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
    ): ResumableUploadProgress | null {
        try {
            if (typeof localStorage === 'undefined') return null;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STORAGE_PREFIX)) {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const progress: ResumableUploadProgress = JSON.parse(raw);
                        if (progress.filename === filename) {
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
