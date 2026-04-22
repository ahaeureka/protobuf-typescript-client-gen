import { AuthorizeRequest, BalanceSnapshot, BillingAuthorizationResponse, BillingPolicyArtifact, BillingPolicyBundle, BillingSettlementSnapshot, BillingTransaction, CreateBillingPolicyArtifactRequest, CreditGrant, EstimateChargeRequest, EstimateChargeResponse, FinalizeRequest, GetBillingPolicyArtifactRequest, GetBillingPolicyBundleRequest, GetBillingTransactionRequest, GrantCreditsRequest, ListBillingPolicyArtifactsRequest, ListBillingPolicyArtifactsResponse, ListBillingPolicyBundlesRequest, ListBillingPolicyBundlesResponse, ListGrantsRequest, ListGrantsResponse, ManualReconcileRequest, ManualReconcileResponse, PublishBillingPolicyBundleRequest, QueryBalanceRequest, QuerySnapshotRequest, QueryTransactionsRequest, QueryTransactionsResponse, RefundRequest, ReleaseRequest, SettlementDecision } from './billing';
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
    estimate_charge(request: EstimateChargeRequest, headers?: Record<string, string>): Promise<EstimateChargeResponse>;
    authorize(request: AuthorizeRequest, headers?: Record<string, string>): Promise<BillingAuthorizationResponse>;
    finalize(request: FinalizeRequest, headers?: Record<string, string>): Promise<SettlementDecision>;
    release(request: ReleaseRequest, headers?: Record<string, string>): Promise<SettlementDecision>;
    refund(request: RefundRequest, headers?: Record<string, string>): Promise<SettlementDecision>;
    query_balance(request: QueryBalanceRequest, headers?: Record<string, string>): Promise<BalanceSnapshot>;
    grant_credits(request: GrantCreditsRequest, headers?: Record<string, string>): Promise<CreditGrant>;
    list_grants(request: ListGrantsRequest, headers?: Record<string, string>): Promise<ListGrantsResponse>;
    get_transaction(request: GetBillingTransactionRequest, headers?: Record<string, string>): Promise<BillingTransaction>;
    query_transactions(request: QueryTransactionsRequest, headers?: Record<string, string>): Promise<QueryTransactionsResponse>;
    query_snapshot(request: QuerySnapshotRequest, headers?: Record<string, string>): Promise<BillingSettlementSnapshot>;
    manual_reconcile(request: ManualReconcileRequest, headers?: Record<string, string>): Promise<ManualReconcileResponse>;
    create_policy_artifact(request: CreateBillingPolicyArtifactRequest, headers?: Record<string, string>): Promise<BillingPolicyArtifact>;
    get_policy_artifact(request: GetBillingPolicyArtifactRequest, headers?: Record<string, string>): Promise<BillingPolicyArtifact>;
    list_policy_artifacts(request: ListBillingPolicyArtifactsRequest, headers?: Record<string, string>): Promise<ListBillingPolicyArtifactsResponse>;
    publish_policy_bundle(request: PublishBillingPolicyBundleRequest, headers?: Record<string, string>): Promise<BillingPolicyBundle>;
    get_policy_bundle(request: GetBillingPolicyBundleRequest, headers?: Record<string, string>): Promise<BillingPolicyBundle>;
    list_policy_bundles(request: ListBillingPolicyBundlesRequest, headers?: Record<string, string>): Promise<ListBillingPolicyBundlesResponse>;
}
