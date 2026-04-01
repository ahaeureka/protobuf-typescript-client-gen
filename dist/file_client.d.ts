import { AxiosProgressEvent } from 'axios';
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
export declare class FileStorageClient {
    private client;
    private partSize;
    constructor(options: FileStorageClientOptions);
    /**
     * Simple file upload (for files smaller than partSize).
     * @param businessContext - Arbitrary JSON to forward to the business callback.
     * @param callbackUrl - Per-request callback URL override.
     */
    uploadFile(file: File | Blob, options?: {
        folder?: string;
        contentType?: string;
        filename?: string;
        /** Arbitrary JSON context forwarded to the business callback. */
        businessContext?: Record<string, unknown>;
        /** Per-request callback URL override. */
        callbackUrl?: string;
        onProgress?: (event: AxiosProgressEvent) => void;
    }): Promise<UploadResponse>;
    /**
     * Resumable upload: initializes a new upload session.
     * @param businessContext - Arbitrary JSON to forward to the business callback on completion.
     * @param callbackUrl - Per-request callback URL override.
     */
    initResumableUpload(filename: string, totalSize: number, options?: {
        folder?: string;
        contentType?: string;
        partSize?: number;
        /** Arbitrary JSON context forwarded to the business callback on completion. */
        businessContext?: Record<string, unknown>;
        /** Per-request callback URL override (stored in session for completion). */
        callbackUrl?: string;
    }): Promise<{
        uploadId: string;
        partSize: number;
        totalParts: number;
    }>;
    /**
     * Resumable upload: upload a single part.
     */
    uploadPart(uploadId: string, partNumber: number, data: Blob | ArrayBuffer, onProgress?: (event: AxiosProgressEvent) => void): Promise<UploadPartResult>;
    /**
     * Resumable upload: complete the upload session by combining all parts.
     */
    completeResumableUpload(uploadId: string, partEtags: UploadPartResult[]): Promise<UploadResponse>;
    /**
     * Resumable upload: abort and clean up an upload session.
     */
    abortResumableUpload(uploadId: string): Promise<void>;
    /**
     * Get upload session status from the server.
     */
    getUploadStatus(uploadId: string): Promise<{
        uploadId: string;
        status: string;
        completedParts: number;
        totalParts: number;
        expiresAt: string;
    }>;
    /**
     * Download a file by its ID. Returns a Blob.
     */
    downloadFile(fileId: string): Promise<{
        blob: Blob;
        filename: string;
    }>;
    /**
     * Delete a file by its ID.
     */
    deleteFile(fileId: string): Promise<void>;
    /**
     * List files for the current user.
     */
    listFiles(options?: {
        folder?: string;
        pageSize?: number;
        pageToken?: string;
    }): Promise<ListFilesResponse>;
    /**
     * Get file metadata by its ID.
     */
    getFileInfo(fileId: string): Promise<FileInfo>;
    /**
     * Upload a large file with automatic chunking and resumable support.
     * Persists progress to localStorage for crash recovery.
     */
    uploadFileResumable(file: File, options?: {
        folder?: string;
        contentType?: string;
        partSize?: number;
        businessContext?: Record<string, unknown>;
        callbackUrl?: string;
        onPartComplete?: (partNumber: number, totalParts: number) => void;
        onProgress?: (uploaded: number, total: number) => void;
    }): Promise<UploadResponse>;
    private saveProgress;
    private loadProgress;
    private clearProgress;
    private findProgressForFile;
}
