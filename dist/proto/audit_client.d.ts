import { GetAuditLogsRequest, GetAuditLogsResponse, GetAuditStatisticsRequest, GetAuditStatisticsResponse } from './audit';
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
    get_audit_logs(request: GetAuditLogsRequest, headers?: Record<string, string>): Promise<GetAuditLogsResponse>;
    get_audit_statistics(request: GetAuditStatisticsRequest, headers?: Record<string, string>): Promise<GetAuditStatisticsResponse>;
}
