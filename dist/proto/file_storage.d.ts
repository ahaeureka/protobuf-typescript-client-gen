import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { Observable } from "rxjs";
import { HttpBody } from "./google/api/httpbody";
import { Empty } from "./google/protobuf/empty";
export declare const protobufPackage = "stew.api.v1";
export declare enum UploadSessionStatus {
    UPLOAD_SESSION_STATUS_UNSPECIFIED = 0,
    UPLOAD_SESSION_STATUS_ACTIVE = 1,
    UPLOAD_SESSION_STATUS_COMPLETED = 2,
    UPLOAD_SESSION_STATUS_ABORTED = 3,
    UNRECOGNIZED = -1
}
export declare function uploadSessionStatusFromJSON(object: any): UploadSessionStatus;
export declare function uploadSessionStatusToJSON(object: UploadSessionStatus): string;
export interface UploadFileRequest {
    payload: //
    /** First message: file metadata. */
    {
        $case: "metadata";
        metadata: UploadFileMetadata;
    } | //
    /** Subsequent messages: raw file data chunks (recommended 64KB each). */
    {
        $case: "chunk_data";
        chunk_data: Uint8Array;
    } | undefined;
}
export interface UploadFileMetadata {
    /** Original filename. */
    filename: string;
    /** MIME content type (e.g. "image/png", "application/pdf"). */
    content_type: string;
    /** Virtual folder path (e.g. "/documents", "/images"). Defaults to "/". */
    folder: string;
    /**
     * Arbitrary business context (JSON string). Forwarded to the callback endpoint
     * to associate this file with a business entity (e.g. order ID, ticket ID).
     */
    business_context: string;
}
export interface UploadFileResponse {
    /** Metadata of the newly created file. */
    file_info: FileInfo | undefined;
    /** Business callback result (if callback is configured and sync mode is enabled). */
    callback_result: CallbackResult | undefined;
}
export interface InitResumableUploadRequest {
    /** Original filename. */
    filename: string;
    /** MIME content type. */
    content_type: string;
    /** Virtual folder path. Defaults to "/". */
    folder: string;
    /** Total file size in bytes. Required for computing part layout. */
    total_size: number;
    /** Desired part size in bytes. Server may adjust. Default: 5MB (5242880). */
    part_size: number;
    /** Arbitrary business context (JSON string). Forwarded to the callback endpoint. */
    business_context: string;
    /** Expected SHA-256 checksum computed by the client before multipart upload starts. */
    checksum: string;
}
export interface InitResumableUploadResponse {
    /** Opaque upload session identifier. */
    upload_id: string;
    /** Actual part size chosen by the server (bytes). */
    part_size: number;
    /** Total number of parts to upload. */
    total_parts: number;
    /** Session expiration time. Client must complete before this. */
    expires_at: Date | undefined;
}
export interface UploadPartRequest {
    payload: //
    /** First message: part header. */
    {
        $case: "header";
        header: UploadPartHeader;
    } | //
    /** Subsequent messages: raw part data chunks. */
    {
        $case: "chunk_data";
        chunk_data: Uint8Array;
    } | undefined;
}
export interface UploadPartHeader {
    /** Upload session ID from InitResumableUpload. */
    upload_id: string;
    /** 1-based part number. */
    part_number: number;
}
export interface UploadPartResponse {
    /** Confirmed part number. */
    part_number: number;
    /** ETag (content hash) of the uploaded part. Required for CompleteResumableUpload. */
    etag: string;
    /** Number of bytes written for this part. */
    bytes_written: number;
}
export interface CompleteResumableUploadRequest {
    /** Upload session ID. */
    upload_id: string;
    /** List of all uploaded parts with their ETags. */
    parts: PartEtag[];
}
export interface PartEtag {
    /** 1-based part number. */
    part_number: number;
    /** ETag returned from UploadPart. */
    etag: string;
}
export interface AbortResumableUploadRequest {
    /** Upload session ID to abort. */
    upload_id: string;
}
export interface GetUploadStatusRequest {
    /** Upload session ID to query. */
    upload_id: string;
}
export interface GetUploadStatusResponse {
    /** Upload session ID. */
    upload_id: string;
    /** Current session status. */
    status: UploadSessionStatus;
    /** Parts that have been successfully uploaded. */
    completed_parts: UploadedPartInfo[];
    /** Total number of parts expected. */
    total_parts: number;
    /** Session expiration time. */
    expires_at: Date | undefined;
    /** Original filename. */
    filename: string;
    /** Total file size in bytes. */
    total_size: number;
}
export interface UploadedPartInfo {
    part_number: number;
    etag: string;
    size: number;
    completed_at: Date | undefined;
}
export interface DownloadFileRequest {
    /** File ID to download. */
    file_id: string;
    /** Expected SHA-256 checksum supplied by the client for post-download verification. */
    checksum: string;
    /** If true, the server verifies checksum and returns an empty body instead of file content. */
    verify_only: boolean;
}
/**
 * HTTP metadata projected from google.api.HttpBody.extensions for download responses.
 * The gateway renderer maps this metadata to concrete HTTP headers.
 */
export interface DownloadFileHttpMetadata {
    /** Original filename. Preserved in the extension payload for downstream use. */
    filename: string;
    /** Full Content-Disposition header value to expose on the HTTP response. */
    content_disposition: string;
    /** Full ETag header value to expose on the HTTP response. */
    etag: string;
}
export interface DownloadFileChunk {
    /** Raw file data chunk. */
    data: Uint8Array;
}
export interface DeleteFileRequest {
    /** File ID to delete. */
    file_id: string;
}
export interface ListFilesRequest {
    /** Virtual folder path to filter by. Empty or "/" lists root. */
    folder: string;
    /** Maximum number of files to return. Default: 100. */
    page_size: number;
    /** Pagination token from previous response. */
    page_token: string;
}
export interface ListFilesResponse {
    files: FileInfo[];
    /** Token for fetching the next page. Empty if no more results. */
    next_page_token: string;
    /** Total number of files matching the filter. */
    total_count: number;
}
export interface GetFileInfoRequest {
    /** File ID to query. */
    file_id: string;
}
/** Business callback result returned when sync callback mode is enabled. */
export interface CallbackResult {
    /** Whether the business side accepted the file. */
    accepted: boolean;
    /** Business-assigned reference ID (e.g. order attachment ID). */
    business_id: string;
    /** Optional message from the business callback. */
    message: string;
}
/** File metadata returned by upload, list, and info operations. */
export interface FileInfo {
    /** Unique file identifier (UUID). */
    id: string;
    /** Original filename. */
    filename: string;
    /** MIME content type. */
    content_type: string;
    /** File size in bytes. */
    file_size: number;
    /** Virtual folder path. */
    folder: string;
    /** Owner user ID (sub claim). */
    owner_id: string;
    /** SHA-256 checksum of the file content. */
    checksum: string;
    /** Storage backend type ("s3" or "local"). */
    storage_backend: string;
    created_at: Date | undefined;
    updated_at: Date | undefined;
    /** Local filesystem path if local_cache is enabled (for business service access). */
    local_path: string;
    /** Storage key (object path in the storage backend). */
    storage_key: string;
}
export declare const UploadFileRequest: MessageFns<UploadFileRequest>;
export declare const UploadFileMetadata: MessageFns<UploadFileMetadata>;
export declare const UploadFileResponse: MessageFns<UploadFileResponse>;
export declare const InitResumableUploadRequest: MessageFns<InitResumableUploadRequest>;
export declare const InitResumableUploadResponse: MessageFns<InitResumableUploadResponse>;
export declare const UploadPartRequest: MessageFns<UploadPartRequest>;
export declare const UploadPartHeader: MessageFns<UploadPartHeader>;
export declare const UploadPartResponse: MessageFns<UploadPartResponse>;
export declare const CompleteResumableUploadRequest: MessageFns<CompleteResumableUploadRequest>;
export declare const PartEtag: MessageFns<PartEtag>;
export declare const AbortResumableUploadRequest: MessageFns<AbortResumableUploadRequest>;
export declare const GetUploadStatusRequest: MessageFns<GetUploadStatusRequest>;
export declare const GetUploadStatusResponse: MessageFns<GetUploadStatusResponse>;
export declare const UploadedPartInfo: MessageFns<UploadedPartInfo>;
export declare const DownloadFileRequest: MessageFns<DownloadFileRequest>;
export declare const DownloadFileHttpMetadata: MessageFns<DownloadFileHttpMetadata>;
export declare const DownloadFileChunk: MessageFns<DownloadFileChunk>;
export declare const DeleteFileRequest: MessageFns<DeleteFileRequest>;
export declare const ListFilesRequest: MessageFns<ListFilesRequest>;
export declare const ListFilesResponse: MessageFns<ListFilesResponse>;
export declare const GetFileInfoRequest: MessageFns<GetFileInfoRequest>;
export declare const CallbackResult: MessageFns<CallbackResult>;
export declare const FileInfo: MessageFns<FileInfo>;
/**
 * File storage service with per-user isolation and resumable upload support.
 * All methods require authentication; user identity is extracted from auth metadata.
 */
export interface FileStorageService {
    /**
     * Simple file upload via client streaming.
     * First message must contain metadata (filename, content_type, folder).
     * Subsequent messages carry raw file data chunks.
     */
    UploadFile(request: Observable<UploadFileRequest>): Promise<UploadFileResponse>;
    /**
     * Initialize a resumable (multipart) upload session.
     * Returns an upload_id and part layout for the client to upload parts independently.
     */
    InitResumableUpload(request: InitResumableUploadRequest): Promise<InitResumableUploadResponse>;
    /**
     * Upload a single part of a resumable upload via client streaming.
     * First message must contain the part header (upload_id, part_number).
     * Subsequent messages carry raw part data chunks.
     */
    UploadPart(request: Observable<UploadPartRequest>): Promise<UploadPartResponse>;
    /** Complete a resumable upload by assembling all uploaded parts. */
    CompleteResumableUpload(request: CompleteResumableUploadRequest): Promise<UploadFileResponse>;
    /** Abort a resumable upload session and clean up all uploaded parts. */
    AbortResumableUpload(request: AbortResumableUploadRequest): Promise<Empty>;
    /**
     * Query the status of a resumable upload session, including completed parts.
     * Clients use this to determine which parts still need to be uploaded (resume).
     */
    GetUploadStatus(request: GetUploadStatusRequest): Promise<GetUploadStatusResponse>;
    /** Download a file via server streaming. */
    DownloadFile(request: DownloadFileRequest): Promise<HttpBody>;
    /** Delete a file owned by the current user. */
    DeleteFile(request: DeleteFileRequest): Promise<Empty>;
    /** List files owned by the current user, with optional folder filter. */
    ListFiles(request: ListFilesRequest): Promise<ListFilesResponse>;
    /** Get metadata for a single file owned by the current user. */
    GetFileInfo(request: GetFileInfoRequest): Promise<FileInfo>;
}
export declare const FileStorageServiceServiceName = "stew.api.v1.FileStorageService";
export declare class FileStorageServiceClientImpl implements FileStorageService {
    private readonly rpc;
    private readonly service;
    constructor(rpc: Rpc, opts?: {
        service?: string;
    });
    UploadFile(request: Observable<UploadFileRequest>): Promise<UploadFileResponse>;
    InitResumableUpload(request: InitResumableUploadRequest): Promise<InitResumableUploadResponse>;
    UploadPart(request: Observable<UploadPartRequest>): Promise<UploadPartResponse>;
    CompleteResumableUpload(request: CompleteResumableUploadRequest): Promise<UploadFileResponse>;
    AbortResumableUpload(request: AbortResumableUploadRequest): Promise<Empty>;
    GetUploadStatus(request: GetUploadStatusRequest): Promise<GetUploadStatusResponse>;
    DownloadFile(request: DownloadFileRequest): Promise<HttpBody>;
    DeleteFile(request: DeleteFileRequest): Promise<Empty>;
    ListFiles(request: ListFilesRequest): Promise<ListFilesResponse>;
    GetFileInfo(request: GetFileInfoRequest): Promise<FileInfo>;
}
interface Rpc {
    request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
    clientStreamingRequest(service: string, method: string, data: Observable<Uint8Array>): Promise<Uint8Array>;
    serverStreamingRequest(service: string, method: string, data: Uint8Array): Observable<Uint8Array>;
    bidirectionalStreamingRequest(service: string, method: string, data: Observable<Uint8Array>): Observable<Uint8Array>;
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
