import { AddPolicyRequest, AuthorizationRequest, AuthorizationResponse, BatchAuthorizationRequest, BatchAuthorizationResponse, GetPolicyRequest, GetPolicyResponse, HealthCheckRequest, HealthCheckResponse, PolicyOperationResponse, QueryAuditLogsRequest, QueryAuditLogsResponse, RemovePolicyRequest, SyncPolicyRequest, SyncPolicyResponse } from './authorization';
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
    check_authorization(request: AuthorizationRequest, headers?: Record<string, string>): Promise<AuthorizationResponse>;
    batch_check_authorization(request: BatchAuthorizationRequest, headers?: Record<string, string>): Promise<BatchAuthorizationResponse>;
    sync_policy(request: SyncPolicyRequest, headers?: Record<string, string>): Promise<SyncPolicyResponse>;
    get_policy(request: GetPolicyRequest, headers?: Record<string, string>): Promise<GetPolicyResponse>;
    add_policy(request: AddPolicyRequest, headers?: Record<string, string>): Promise<PolicyOperationResponse>;
    remove_policy(request: RemovePolicyRequest, headers?: Record<string, string>): Promise<PolicyOperationResponse>;
    query_audit_logs(request: QueryAuditLogsRequest, headers?: Record<string, string>): Promise<QueryAuditLogsResponse>;
    health_check(request: HealthCheckRequest, headers?: Record<string, string>): Promise<HealthCheckResponse>;
}
