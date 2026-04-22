import { AbortResumableUploadRequest, CompleteResumableUploadRequest, DeleteFileRequest, DownloadFileRequest, FileInfo, GetFileInfoRequest, GetPathInfoRequest, GetPathInfoResponse, GetUploadStatusRequest, GetUploadStatusResponse, InitResumableUploadRequest, InitResumableUploadResponse, ListFilesRequest, ListFilesResponse, ListFolderRequest, ListFolderResponse, ReadTextFileRequest, ReadTextFileResponse, UploadFileRequest, UploadFileResponse, UploadPartRequest, UploadPartResponse } from './file_storage';
import { Empty } from './google/protobuf/empty';
import { HttpBody } from './google/api/httpbody';
export interface ClientConfig {
    baseUrl: string;
    timeout?: number;
}
export interface EmptyRequest {
}
export declare class V1Client {
    private client;
    private baseUrl;
    private accessToken;
    private tokenExpiry;
    constructor(config: ClientConfig);
    /**
     * 手动登出 - 清除所有认证状态
     * 公共方法，允许用户主动调用
     */
    logout(): void;
    /**
     * 清除所有认证状态
     * 当认证失败时调用，清除 localStorage、sessionStorage 和所有 Cookie
     */
    private clearAuthState;
    /**
     * 确保 session_id Cookie 已设置
     * 从 localStorage 读取 session_id，如果存在则设置到 Cookie
     */
    private ensureSessionCookie;
    /**
     * 从 localStorage/Cookie 获取 session_id
     */
    private getSessionId;
    private getToken;
    private getAuthHeaders;
    upload_file(inputStream: AsyncIterable<UploadFileRequest>, headers?: Record<string, string>): Promise<UploadFileResponse>;
    init_resumable_upload(request: InitResumableUploadRequest, headers?: Record<string, string>): Promise<InitResumableUploadResponse>;
    upload_part(inputStream: AsyncIterable<UploadPartRequest>, headers?: Record<string, string>): Promise<UploadPartResponse>;
    complete_resumable_upload(request: CompleteResumableUploadRequest, headers?: Record<string, string>): Promise<UploadFileResponse>;
    abort_resumable_upload(request: AbortResumableUploadRequest, headers?: Record<string, string>): Promise<Empty>;
    get_upload_status(request: GetUploadStatusRequest, headers?: Record<string, string>): Promise<GetUploadStatusResponse>;
    download_file(request: DownloadFileRequest, headers?: Record<string, string>): Promise<HttpBody>;
    delete_file(request: DeleteFileRequest, headers?: Record<string, string>): Promise<Empty>;
    list_files(request: ListFilesRequest, headers?: Record<string, string>): Promise<ListFilesResponse>;
    get_file_info(request: GetFileInfoRequest, headers?: Record<string, string>): Promise<FileInfo>;
    list_folder(request: ListFolderRequest, headers?: Record<string, string>): Promise<ListFolderResponse>;
    get_path_info(request: GetPathInfoRequest, headers?: Record<string, string>): Promise<GetPathInfoResponse>;
    read_text_file(request: ReadTextFileRequest, headers?: Record<string, string>): Promise<ReadTextFileResponse>;
}
