import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { Empty } from "./google/protobuf/empty";
export declare const protobufPackage = "stew.api.v1";
/** EntitlementPlan represents a subscription plan with features and quotas. */
export interface EntitlementPlan {
    id: string;
    business_id: string;
    name: string;
    description: string;
    is_active: boolean;
    sort_order: number;
    features: PlanFeature[];
    quotas: PlanQuota[];
    metadata: {
        [key: string]: string;
    };
    created_at: Date | undefined;
    updated_at: Date | undefined;
    deleted_at: Date | undefined;
}
export interface EntitlementPlan_MetadataEntry {
    key: string;
    value: string;
}
export interface PlanFeature {
    feature_key: string;
    enabled: boolean;
    config: {
        [key: string]: any;
    } | undefined;
    created_at: Date | undefined;
    updated_at: Date | undefined;
    deleted_at: Date | undefined;
}
export interface PlanQuota {
    quota_key: string;
    quota_limit: number;
    quota_unit: string;
    reset_period: string;
    created_at: Date | undefined;
    updated_at: Date | undefined;
    deleted_at: Date | undefined;
}
/** Subscription represents a subject's active plan binding. */
export interface Subscription {
    id: string;
    business_id: string;
    subject_id: string;
    subject_type: number;
    plan_id: string;
    status: string;
    billing_cycle: string;
    current_period_start: number;
    current_period_end: number;
    metadata: {
        [key: string]: string;
    };
    created_at: Date | undefined;
    updated_at: Date | undefined;
    deleted_at: Date | undefined;
}
export interface Subscription_MetadataEntry {
    key: string;
    value: string;
}
export interface QuotaUsage {
    business_id: string;
    subject_id: string;
    quota_key: string;
    period_start: number;
    period_end: number;
    used: number;
    created_at: Date | undefined;
    updated_at: Date | undefined;
    deleted_at: Date | undefined;
}
export interface CreatePlanRequest {
    business_id: string;
    name: string;
    description: string;
    is_active: boolean;
    sort_order: number;
    features: PlanFeature[];
    quotas: PlanQuota[];
    metadata: {
        [key: string]: string;
    };
}
export interface CreatePlanRequest_MetadataEntry {
    key: string;
    value: string;
}
export interface GetPlanRequest {
    business_id: string;
    plan_id: string;
}
export interface ListPlansRequest {
    business_id: string;
    active_only: boolean;
}
export interface ListPlansResponse {
    plans: EntitlementPlan[];
}
export interface UpdatePlanRequest {
    business_id: string;
    plan_id: string;
    name: string;
    description: string;
    is_active: boolean;
    sort_order: number;
    features: PlanFeature[];
    quotas: PlanQuota[];
    metadata: {
        [key: string]: string;
    };
}
export interface UpdatePlanRequest_MetadataEntry {
    key: string;
    value: string;
}
export interface CreateSubscriptionRequest {
    business_id: string;
    subject_id: string;
    subject_type: number;
    plan_id: string;
    billing_cycle: string;
    current_period_start: number;
    current_period_end: number;
    metadata: {
        [key: string]: string;
    };
}
export interface CreateSubscriptionRequest_MetadataEntry {
    key: string;
    value: string;
}
export interface GetSubscriptionRequest {
    business_id: string;
    subscription_id: string;
}
export interface GetSubscriptionBySubjectRequest {
    business_id: string;
    subject_id: string;
}
export interface UpdateSubscriptionRequest {
    business_id: string;
    subscription_id: string;
    plan_id: string;
    status: string;
    billing_cycle: string;
    current_period_start: number;
    current_period_end: number;
    metadata: {
        [key: string]: string;
    };
}
export interface UpdateSubscriptionRequest_MetadataEntry {
    key: string;
    value: string;
}
export interface CancelSubscriptionRequest {
    business_id: string;
    subscription_id: string;
}
/**
 * DeleteSubscription performs a soft delete by marking the subscription as
 * deleted and excluding it from normal subject resolution/listing.
 */
export interface DeleteSubscriptionRequest {
    business_id: string;
    subscription_id: string;
}
/**
 * ListSubscriptions allows admins to query subscriptions across subjects.
 * Filters are AND-combined; empty fields are ignored.
 */
export interface ListSubscriptionsRequest {
    business_id: string;
    status: string;
    plan_id: string;
    page_size: number;
    page_token: string;
}
export interface ListSubscriptionsResponse {
    subscriptions: Subscription[];
    next_page_token: string;
}
/**
 * RenewSubscriptions performs a batch renew. If subscription_ids is empty,
 * renews all subscriptions whose current_period_end is within horizon_seconds.
 */
export interface RenewSubscriptionsRequest {
    subscription_ids: string[];
    horizon_seconds: number;
}
export interface RenewSubscriptionResult {
    subscription_id: string;
    succeeded: boolean;
    error_message: string;
    subscription: Subscription | undefined;
}
export interface RenewSubscriptionsResponse {
    results: RenewSubscriptionResult[];
    succeeded_count: number;
    failed_count: number;
}
/**
 * DeletePlan removes a plan and all its features/quotas. Subscriptions
 * referencing the plan are not modified; callers must reassign them first.
 */
export interface DeletePlanRequest {
    business_id: string;
    plan_id: string;
}
/**
 * Per-feature granular updates. UpsertPlanFeature inserts or replaces a single
 * feature row. DeletePlanFeature removes a single feature row. Both return
 * the refreshed plan.
 */
export interface UpsertPlanFeatureRequest {
    business_id: string;
    plan_id: string;
    feature: PlanFeature | undefined;
}
export interface DeletePlanFeatureRequest {
    business_id: string;
    plan_id: string;
    feature_key: string;
}
/** Per-quota granular updates. */
export interface UpsertPlanQuotaRequest {
    business_id: string;
    plan_id: string;
    quota: PlanQuota | undefined;
}
export interface DeletePlanQuotaRequest {
    business_id: string;
    plan_id: string;
    quota_key: string;
}
export interface GetQuotaUsageRequest {
    business_id: string;
    subject_id: string;
    quota_key: string;
}
export interface IncrementQuotaRequest {
    business_id: string;
    subject_id: string;
    quota_key: string;
    delta: number;
}
export interface CheckQuotaRequest {
    business_id: string;
    subject_id: string;
    quota_key: string;
}
export interface CheckQuotaResponse {
    used: number;
    limit: number;
}
/** PlanChangeRecord captures the audit trail of a subscription plan change. */
export interface PlanChangeRecord {
    id: string;
    business_id: string;
    subscription_id: string;
    subject_id: string;
    previous_plan_id: string;
    new_plan_id: string;
    change_type: string;
    change_mode: string;
    status: string;
    effective_at: number;
    executed_at: number;
    metadata: {
        [key: string]: string;
    };
    created_at: Date | undefined;
    updated_at: Date | undefined;
    deleted_at: Date | undefined;
}
export interface PlanChangeRecord_MetadataEntry {
    key: string;
    value: string;
}
export interface ChangePlanRequest {
    business_id: string;
    subscription_id: string;
    subject_id: string;
    new_plan_id: string;
    change_mode: string;
    reset_quota: boolean;
    metadata: {
        [key: string]: string;
    };
}
export interface ChangePlanRequest_MetadataEntry {
    key: string;
    value: string;
}
export interface ChangePlanResponse {
    subscription: Subscription | undefined;
    change_record: PlanChangeRecord | undefined;
}
export interface ListPlanChangesRequest {
    business_id: string;
    subscription_id: string;
    subject_id: string;
    page_size: number;
    page_token: string;
}
export interface ListPlanChangesResponse {
    changes: PlanChangeRecord[];
    next_page_token: string;
}
export interface CancelPlanChangeRequest {
    business_id: string;
    change_id: string;
}
/**
 * ResolvedEntitlementResponse is the composite /me response containing
 * subscription, plan, and current quota usage in a single payload.
 */
export interface ResolvedEntitlementResponse {
    subscription: Subscription | undefined;
    plan: EntitlementPlan | undefined;
    quota_usages: QuotaUsage[];
}
export interface GetMyEntitlementRequest {
    business_id: string;
    subject_id: string;
}
export interface CheckFeatureRequest {
    business_id: string;
    subject_id: string;
    feature_key: string;
}
export interface CheckFeatureResponse {
    enabled: boolean;
    feature_key: string;
    plan_id: string;
    config: {
        [key: string]: any;
    } | undefined;
}
export declare const EntitlementPlan: MessageFns<EntitlementPlan>;
export declare const EntitlementPlan_MetadataEntry: MessageFns<EntitlementPlan_MetadataEntry>;
export declare const PlanFeature: MessageFns<PlanFeature>;
export declare const PlanQuota: MessageFns<PlanQuota>;
export declare const Subscription: MessageFns<Subscription>;
export declare const Subscription_MetadataEntry: MessageFns<Subscription_MetadataEntry>;
export declare const QuotaUsage: MessageFns<QuotaUsage>;
export declare const CreatePlanRequest: MessageFns<CreatePlanRequest>;
export declare const CreatePlanRequest_MetadataEntry: MessageFns<CreatePlanRequest_MetadataEntry>;
export declare const GetPlanRequest: MessageFns<GetPlanRequest>;
export declare const ListPlansRequest: MessageFns<ListPlansRequest>;
export declare const ListPlansResponse: MessageFns<ListPlansResponse>;
export declare const UpdatePlanRequest: MessageFns<UpdatePlanRequest>;
export declare const UpdatePlanRequest_MetadataEntry: MessageFns<UpdatePlanRequest_MetadataEntry>;
export declare const CreateSubscriptionRequest: MessageFns<CreateSubscriptionRequest>;
export declare const CreateSubscriptionRequest_MetadataEntry: MessageFns<CreateSubscriptionRequest_MetadataEntry>;
export declare const GetSubscriptionRequest: MessageFns<GetSubscriptionRequest>;
export declare const GetSubscriptionBySubjectRequest: MessageFns<GetSubscriptionBySubjectRequest>;
export declare const UpdateSubscriptionRequest: MessageFns<UpdateSubscriptionRequest>;
export declare const UpdateSubscriptionRequest_MetadataEntry: MessageFns<UpdateSubscriptionRequest_MetadataEntry>;
export declare const CancelSubscriptionRequest: MessageFns<CancelSubscriptionRequest>;
export declare const DeleteSubscriptionRequest: MessageFns<DeleteSubscriptionRequest>;
export declare const ListSubscriptionsRequest: MessageFns<ListSubscriptionsRequest>;
export declare const ListSubscriptionsResponse: MessageFns<ListSubscriptionsResponse>;
export declare const RenewSubscriptionsRequest: MessageFns<RenewSubscriptionsRequest>;
export declare const RenewSubscriptionResult: MessageFns<RenewSubscriptionResult>;
export declare const RenewSubscriptionsResponse: MessageFns<RenewSubscriptionsResponse>;
export declare const DeletePlanRequest: MessageFns<DeletePlanRequest>;
export declare const UpsertPlanFeatureRequest: MessageFns<UpsertPlanFeatureRequest>;
export declare const DeletePlanFeatureRequest: MessageFns<DeletePlanFeatureRequest>;
export declare const UpsertPlanQuotaRequest: MessageFns<UpsertPlanQuotaRequest>;
export declare const DeletePlanQuotaRequest: MessageFns<DeletePlanQuotaRequest>;
export declare const GetQuotaUsageRequest: MessageFns<GetQuotaUsageRequest>;
export declare const IncrementQuotaRequest: MessageFns<IncrementQuotaRequest>;
export declare const CheckQuotaRequest: MessageFns<CheckQuotaRequest>;
export declare const CheckQuotaResponse: MessageFns<CheckQuotaResponse>;
export declare const PlanChangeRecord: MessageFns<PlanChangeRecord>;
export declare const PlanChangeRecord_MetadataEntry: MessageFns<PlanChangeRecord_MetadataEntry>;
export declare const ChangePlanRequest: MessageFns<ChangePlanRequest>;
export declare const ChangePlanRequest_MetadataEntry: MessageFns<ChangePlanRequest_MetadataEntry>;
export declare const ChangePlanResponse: MessageFns<ChangePlanResponse>;
export declare const ListPlanChangesRequest: MessageFns<ListPlanChangesRequest>;
export declare const ListPlanChangesResponse: MessageFns<ListPlanChangesResponse>;
export declare const CancelPlanChangeRequest: MessageFns<CancelPlanChangeRequest>;
export declare const ResolvedEntitlementResponse: MessageFns<ResolvedEntitlementResponse>;
export declare const GetMyEntitlementRequest: MessageFns<GetMyEntitlementRequest>;
export declare const CheckFeatureRequest: MessageFns<CheckFeatureRequest>;
export declare const CheckFeatureResponse: MessageFns<CheckFeatureResponse>;
/** EntitlementService manages subscription plans, subscriptions, and quota usage. */
export interface EntitlementService {
    /** Create a subscription plan for a business. */
    CreatePlan(request: CreatePlanRequest): Promise<EntitlementPlan>;
    /** Fetch a subscription plan by business ID and plan ID. */
    GetPlan(request: GetPlanRequest): Promise<EntitlementPlan>;
    /** List all plans defined for a business. */
    ListPlans(request: ListPlansRequest): Promise<ListPlansResponse>;
    /** Update an existing subscription plan. */
    UpdatePlan(request: UpdatePlanRequest): Promise<EntitlementPlan>;
    /** Delete a subscription plan. */
    DeletePlan(request: DeletePlanRequest): Promise<Empty>;
    /** Upsert a feature configuration on a plan. */
    UpsertPlanFeature(request: UpsertPlanFeatureRequest): Promise<EntitlementPlan>;
    /** Delete a feature configuration from a plan. */
    DeletePlanFeature(request: DeletePlanFeatureRequest): Promise<EntitlementPlan>;
    /** Upsert a quota definition on a plan. */
    UpsertPlanQuota(request: UpsertPlanQuotaRequest): Promise<EntitlementPlan>;
    /** Delete a quota definition from a plan. */
    DeletePlanQuota(request: DeletePlanQuotaRequest): Promise<EntitlementPlan>;
    /** Create a subscription bound to a business subject. */
    CreateSubscription(request: CreateSubscriptionRequest): Promise<Subscription>;
    /** Fetch a subscription by business ID and subscription ID. */
    GetSubscription(request: GetSubscriptionRequest): Promise<Subscription>;
    /** Resolve the active subscription for a specific subject. */
    GetSubscriptionBySubject(request: GetSubscriptionBySubjectRequest): Promise<Subscription>;
    /** Update a subscription record. */
    UpdateSubscription(request: UpdateSubscriptionRequest): Promise<Subscription>;
    /** Cancel an active subscription. */
    CancelSubscription(request: CancelSubscriptionRequest): Promise<Subscription>;
    /** Soft-delete a subscription. */
    DeleteSubscription(request: DeleteSubscriptionRequest): Promise<Empty>;
    /** List subscriptions for a business. */
    ListSubscriptions(request: ListSubscriptionsRequest): Promise<ListSubscriptionsResponse>;
    /** Trigger subscription renewal processing. */
    RenewSubscriptions(request: RenewSubscriptionsRequest): Promise<RenewSubscriptionsResponse>;
    /** Fetch quota usage for a subject and quota key. */
    GetQuotaUsage(request: GetQuotaUsageRequest): Promise<QuotaUsage>;
    /** Increment quota consumption for a subject. */
    IncrementQuota(request: IncrementQuotaRequest): Promise<QuotaUsage>;
    /** Check whether a subject can consume more quota. */
    CheckQuota(request: CheckQuotaRequest): Promise<CheckQuotaResponse>;
    /** Front-end facing: resolve full entitlement snapshot for the current subject. */
    GetMyEntitlement(request: GetMyEntitlementRequest): Promise<ResolvedEntitlementResponse>;
    /** Front-end facing: check if a specific feature is available for the subject. */
    CheckFeature(request: CheckFeatureRequest): Promise<CheckFeatureResponse>;
    /**
     * Change the plan bound to a subscription (upgrade/downgrade/crossgrade).
     * Supports immediate execution or scheduling for end of current period.
     */
    ChangePlan(request: ChangePlanRequest): Promise<ChangePlanResponse>;
    /** List plan change history for a subscription or subject. */
    ListPlanChanges(request: ListPlanChangesRequest): Promise<ListPlanChangesResponse>;
    /** Cancel a pending (end_of_period) plan change before it takes effect. */
    CancelPlanChange(request: CancelPlanChangeRequest): Promise<PlanChangeRecord>;
}
export declare const EntitlementServiceServiceName = "stew.api.v1.EntitlementService";
export declare class EntitlementServiceClientImpl implements EntitlementService {
    private readonly rpc;
    private readonly service;
    constructor(rpc: Rpc, opts?: {
        service?: string;
    });
    CreatePlan(request: CreatePlanRequest): Promise<EntitlementPlan>;
    GetPlan(request: GetPlanRequest): Promise<EntitlementPlan>;
    ListPlans(request: ListPlansRequest): Promise<ListPlansResponse>;
    UpdatePlan(request: UpdatePlanRequest): Promise<EntitlementPlan>;
    DeletePlan(request: DeletePlanRequest): Promise<Empty>;
    UpsertPlanFeature(request: UpsertPlanFeatureRequest): Promise<EntitlementPlan>;
    DeletePlanFeature(request: DeletePlanFeatureRequest): Promise<EntitlementPlan>;
    UpsertPlanQuota(request: UpsertPlanQuotaRequest): Promise<EntitlementPlan>;
    DeletePlanQuota(request: DeletePlanQuotaRequest): Promise<EntitlementPlan>;
    CreateSubscription(request: CreateSubscriptionRequest): Promise<Subscription>;
    GetSubscription(request: GetSubscriptionRequest): Promise<Subscription>;
    GetSubscriptionBySubject(request: GetSubscriptionBySubjectRequest): Promise<Subscription>;
    UpdateSubscription(request: UpdateSubscriptionRequest): Promise<Subscription>;
    CancelSubscription(request: CancelSubscriptionRequest): Promise<Subscription>;
    DeleteSubscription(request: DeleteSubscriptionRequest): Promise<Empty>;
    ListSubscriptions(request: ListSubscriptionsRequest): Promise<ListSubscriptionsResponse>;
    RenewSubscriptions(request: RenewSubscriptionsRequest): Promise<RenewSubscriptionsResponse>;
    GetQuotaUsage(request: GetQuotaUsageRequest): Promise<QuotaUsage>;
    IncrementQuota(request: IncrementQuotaRequest): Promise<QuotaUsage>;
    CheckQuota(request: CheckQuotaRequest): Promise<CheckQuotaResponse>;
    GetMyEntitlement(request: GetMyEntitlementRequest): Promise<ResolvedEntitlementResponse>;
    CheckFeature(request: CheckFeatureRequest): Promise<CheckFeatureResponse>;
    ChangePlan(request: ChangePlanRequest): Promise<ChangePlanResponse>;
    ListPlanChanges(request: ListPlanChangesRequest): Promise<ListPlanChangesResponse>;
    CancelPlanChange(request: CancelPlanChangeRequest): Promise<PlanChangeRecord>;
}
interface Rpc {
    request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
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
