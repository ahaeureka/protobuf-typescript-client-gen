import { CancelPlanChangeRequest, CancelSubscriptionRequest, ChangePlanRequest, ChangePlanResponse, CheckFeatureRequest, CheckFeatureResponse, CheckQuotaRequest, CheckQuotaResponse, CreatePlanRequest, CreateSubscriptionRequest, DeletePlanFeatureRequest, DeletePlanQuotaRequest, DeletePlanRequest, DeleteSubscriptionRequest, EntitlementPlan, GetMyEntitlementRequest, GetPlanRequest, GetQuotaUsageRequest, GetSubscriptionBySubjectRequest, GetSubscriptionRequest, IncrementQuotaRequest, ListPlanChangesRequest, ListPlanChangesResponse, ListPlansRequest, ListPlansResponse, ListSubscriptionsRequest, ListSubscriptionsResponse, PlanChangeRecord, QuotaUsage, RenewSubscriptionsRequest, RenewSubscriptionsResponse, ResolvedEntitlementResponse, Subscription, UpdatePlanRequest, UpdateSubscriptionRequest, UpsertPlanFeatureRequest, UpsertPlanQuotaRequest } from './entitlement';
import { Empty } from './google/protobuf/empty';
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
    create_plan(request: CreatePlanRequest, headers?: Record<string, string>): Promise<EntitlementPlan>;
    get_plan(request: GetPlanRequest, headers?: Record<string, string>): Promise<EntitlementPlan>;
    list_plans(request: ListPlansRequest, headers?: Record<string, string>): Promise<ListPlansResponse>;
    update_plan(request: UpdatePlanRequest, headers?: Record<string, string>): Promise<EntitlementPlan>;
    delete_plan(request: DeletePlanRequest, headers?: Record<string, string>): Promise<Empty>;
    upsert_plan_feature(request: UpsertPlanFeatureRequest, headers?: Record<string, string>): Promise<EntitlementPlan>;
    delete_plan_feature(request: DeletePlanFeatureRequest, headers?: Record<string, string>): Promise<EntitlementPlan>;
    upsert_plan_quota(request: UpsertPlanQuotaRequest, headers?: Record<string, string>): Promise<EntitlementPlan>;
    delete_plan_quota(request: DeletePlanQuotaRequest, headers?: Record<string, string>): Promise<EntitlementPlan>;
    create_subscription(request: CreateSubscriptionRequest, headers?: Record<string, string>): Promise<Subscription>;
    get_subscription(request: GetSubscriptionRequest, headers?: Record<string, string>): Promise<Subscription>;
    get_subscription_by_subject(request: GetSubscriptionBySubjectRequest, headers?: Record<string, string>): Promise<Subscription>;
    update_subscription(request: UpdateSubscriptionRequest, headers?: Record<string, string>): Promise<Subscription>;
    cancel_subscription(request: CancelSubscriptionRequest, headers?: Record<string, string>): Promise<Subscription>;
    delete_subscription(request: DeleteSubscriptionRequest, headers?: Record<string, string>): Promise<Empty>;
    list_subscriptions(request: ListSubscriptionsRequest, headers?: Record<string, string>): Promise<ListSubscriptionsResponse>;
    renew_subscriptions(request: RenewSubscriptionsRequest, headers?: Record<string, string>): Promise<RenewSubscriptionsResponse>;
    get_quota_usage(request: GetQuotaUsageRequest, headers?: Record<string, string>): Promise<QuotaUsage>;
    increment_quota(request: IncrementQuotaRequest, headers?: Record<string, string>): Promise<QuotaUsage>;
    check_quota(request: CheckQuotaRequest, headers?: Record<string, string>): Promise<CheckQuotaResponse>;
    get_my_entitlement(request: GetMyEntitlementRequest, headers?: Record<string, string>): Promise<ResolvedEntitlementResponse>;
    check_feature(request: CheckFeatureRequest, headers?: Record<string, string>): Promise<CheckFeatureResponse>;
    change_plan(request: ChangePlanRequest, headers?: Record<string, string>): Promise<ChangePlanResponse>;
    list_plan_changes(request: ListPlanChangesRequest, headers?: Record<string, string>): Promise<ListPlanChangesResponse>;
    cancel_plan_change(request: CancelPlanChangeRequest, headers?: Record<string, string>): Promise<PlanChangeRecord>;
}
