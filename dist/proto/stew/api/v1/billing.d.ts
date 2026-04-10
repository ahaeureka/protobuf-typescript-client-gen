import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "stew.api.v1";
export declare enum BillingSubjectType {
    BILLING_SUBJECT_TYPE_UNSPECIFIED = 0,
    BILLING_SUBJECT_TYPE_USER = 1,
    BILLING_SUBJECT_TYPE_API_KEY = 2,
    BILLING_SUBJECT_TYPE_ORG = 3,
    BILLING_SUBJECT_TYPE_PROJECT = 4,
    UNRECOGNIZED = -1
}
export declare function billingSubjectTypeFromJSON(object: any): BillingSubjectType;
export declare function billingSubjectTypeToJSON(object: BillingSubjectType): string;
export declare enum BillingPreauthMode {
    BILLING_PREAUTH_MODE_UNSPECIFIED = 0,
    BILLING_PREAUTH_MODE_REQUIRED = 1,
    BILLING_PREAUTH_MODE_BEST_EFFORT = 2,
    BILLING_PREAUTH_MODE_DISABLED = 3,
    UNRECOGNIZED = -1
}
export declare function billingPreauthModeFromJSON(object: any): BillingPreauthMode;
export declare function billingPreauthModeToJSON(object: BillingPreauthMode): string;
export declare enum BillingMissingReportAction {
    BILLING_MISSING_REPORT_ACTION_UNSPECIFIED = 0,
    BILLING_MISSING_REPORT_ACTION_RELEASE = 1,
    BILLING_MISSING_REPORT_ACTION_MARK_PENDING = 2,
    BILLING_MISSING_REPORT_ACTION_CAPTURE_ESTIMATE = 3,
    UNRECOGNIZED = -1
}
export declare function billingMissingReportActionFromJSON(object: any): BillingMissingReportAction;
export declare function billingMissingReportActionToJSON(object: BillingMissingReportAction): string;
export declare enum BillingReportTransport {
    BILLING_REPORT_TRANSPORT_UNSPECIFIED = 0,
    BILLING_REPORT_TRANSPORT_HEADER = 1,
    BILLING_REPORT_TRANSPORT_TRAILER = 2,
    BILLING_REPORT_TRANSPORT_BOTH = 3,
    UNRECOGNIZED = -1
}
export declare function billingReportTransportFromJSON(object: any): BillingReportTransport;
export declare function billingReportTransportToJSON(object: BillingReportTransport): string;
export declare enum BillingFinalStatus {
    BILLING_FINAL_STATUS_UNSPECIFIED = 0,
    BILLING_FINAL_STATUS_SUCCESS = 1,
    BILLING_FINAL_STATUS_FAILED = 2,
    BILLING_FINAL_STATUS_COMPENSATED = 3,
    UNRECOGNIZED = -1
}
export declare function billingFinalStatusFromJSON(object: any): BillingFinalStatus;
export declare function billingFinalStatusToJSON(object: BillingFinalStatus): string;
export declare enum BillingUsageSource {
    BILLING_USAGE_SOURCE_UNSPECIFIED = 0,
    BILLING_USAGE_SOURCE_ESTIMATED = 1,
    BILLING_USAGE_SOURCE_ACTUAL = 2,
    UNRECOGNIZED = -1
}
export declare function billingUsageSourceFromJSON(object: any): BillingUsageSource;
export declare function billingUsageSourceToJSON(object: BillingUsageSource): string;
export declare enum BillingTransactionType {
    BILLING_TRANSACTION_TYPE_UNSPECIFIED = 0,
    BILLING_TRANSACTION_TYPE_AUTHORIZE = 1,
    BILLING_TRANSACTION_TYPE_CAPTURE = 2,
    BILLING_TRANSACTION_TYPE_RELEASE = 3,
    BILLING_TRANSACTION_TYPE_REFUND = 4,
    BILLING_TRANSACTION_TYPE_EXPIRE = 5,
    BILLING_TRANSACTION_TYPE_GRANT = 6,
    BILLING_TRANSACTION_TYPE_COMPENSATION = 7,
    UNRECOGNIZED = -1
}
export declare function billingTransactionTypeFromJSON(object: any): BillingTransactionType;
export declare function billingTransactionTypeToJSON(object: BillingTransactionType): string;
export interface ServiceBillingConfig {
    enabled: boolean;
    business_id: string;
    policy_id: string;
    subject_mode: BillingSubjectType;
    preauth_mode: BillingPreauthMode;
    allow_anonymous_subject: boolean;
    missing_report_action: BillingMissingReportAction;
    release_timeout_seconds: number;
    report_transport: BillingReportTransport;
    report_header_prefix: string;
    factor_schema_version: string;
    max_reservation_ttl_seconds: number;
    idempotency_window_seconds: number;
    capture_requires_report: boolean;
    reconcile_scan_interval_seconds: number;
    max_report_size_bytes: number;
    strict_policy_snapshot: boolean;
}
export interface AuthorizationContext {
    business_id: string;
    user_id: string;
    authorization_id: string;
    request_id: string;
    policy_id: string;
    subject_id: string;
    subject_type: BillingSubjectType;
    factor_schema_version: string;
}
export interface BillingUsageTotals {
    prompt_tokens: number;
    completion_tokens: number;
    embedding_tokens: number;
    ocr_pages: number;
    asr_minutes: number;
    infra_units: number;
}
export interface BillingCostBreakdown {
    chat_in_micros: number;
    chat_out_micros: number;
    embed_micros: number;
    media_micros: number;
    infra_micros: number;
}
export interface BillingReport {
    business_id: string;
    authorization_id: string;
    request_id: string;
    user_id: string;
    usage_source: BillingUsageSource;
    final_status: BillingFinalStatus;
    raw_usage_totals: BillingUsageTotals | undefined;
    cost_breakdown: BillingCostBreakdown | undefined;
    business_factors: {
        [key: string]: any;
    } | undefined;
    billed_points_candidate: number;
    refund_reason: string;
    dedupe_key: string;
}
export interface EstimateChargeRequest {
    context: AuthorizationContext | undefined;
    request_factors: {
        [key: string]: any;
    } | undefined;
}
export interface EstimateChargeResponse {
    success: boolean;
    estimated_points: number;
    message: string;
}
export interface AuthorizeRequest {
    context: AuthorizationContext | undefined;
    estimated_points: number;
}
export interface BillingAuthorizationResponse {
    success: boolean;
    authorization_id: string;
    held_points: number;
    message: string;
}
export interface FinalizeRequest {
    context: AuthorizationContext | undefined;
    report: BillingReport | undefined;
}
export interface SettlementDecision {
    success: boolean;
    transaction_type: BillingTransactionType;
    points: number;
    face_value_minor: number;
    recognized_revenue_minor: number;
    budget_consumed_minor: number;
    message: string;
}
export interface ReleaseRequest {
    authorization_id: string;
    request_id: string;
    reason: string;
}
export interface RefundRequest {
    authorization_id: string;
    request_id: string;
    reason: string;
}
export interface QueryBalanceRequest {
    business_id: string;
    subject_id: string;
    subject_type: BillingSubjectType;
    user_id: string;
}
export interface BalanceSnapshot {
    business_id: string;
    subject_id: string;
    subject_type: BillingSubjectType;
    user_id: string;
    available_balance: number;
    held_balance: number;
    total_granted: number;
    total_consumed: number;
    updated_at: Date | undefined;
}
export interface CreditGrant {
    grant_id: string;
    business_id: string;
    user_id: string;
    subject_id: string;
    subject_type: BillingSubjectType;
    credit_type: string;
    amount: number;
    consumed: number;
    expires_at: Date | undefined;
    status: string;
}
export interface GrantCreditsRequest {
    business_id: string;
    user_id: string;
    subject_id: string;
    subject_type: BillingSubjectType;
    credit_type: string;
    amount: number;
}
export interface ListGrantsRequest {
    business_id: string;
    subject_id: string;
    subject_type: BillingSubjectType;
    user_id: string;
}
export interface ListGrantsResponse {
    grants: CreditGrant[];
}
export interface BillingTransaction {
    transaction_id: string;
    business_id: string;
    user_id: string;
    authorization_id: string;
    request_id: string;
    subject_id: string;
    subject_type: BillingSubjectType;
    transaction_type: BillingTransactionType;
    points: number;
    face_value_minor: number;
    recognized_revenue_minor: number;
    budget_consumed_minor: number;
    created_at: Date | undefined;
}
export interface QueryTransactionsRequest {
    business_id: string;
    request_id: string;
    authorization_id: string;
    subject_id: string;
    subject_type: BillingSubjectType;
    user_id: string;
}
export interface QueryTransactionsResponse {
    transactions: BillingTransaction[];
}
export interface UsageCostSnapshot {
    business_id: string;
    user_id: string;
    request_id: string;
    usage_snapshot: {
        [key: string]: any;
    } | undefined;
    cost_snapshot: {
        [key: string]: any;
    } | undefined;
    business_factors: {
        [key: string]: any;
    } | undefined;
    policy_id: string;
    created_at: Date | undefined;
}
export interface QuerySnapshotRequest {
    request_id: string;
}
export interface ManualReconcileRequest {
    request_id: string;
    authorization_id: string;
    reason: string;
}
export interface ManualReconcileResponse {
    success: boolean;
    message: string;
}
export declare const ServiceBillingConfig: MessageFns<ServiceBillingConfig>;
export declare const AuthorizationContext: MessageFns<AuthorizationContext>;
export declare const BillingUsageTotals: MessageFns<BillingUsageTotals>;
export declare const BillingCostBreakdown: MessageFns<BillingCostBreakdown>;
export declare const BillingReport: MessageFns<BillingReport>;
export declare const EstimateChargeRequest: MessageFns<EstimateChargeRequest>;
export declare const EstimateChargeResponse: MessageFns<EstimateChargeResponse>;
export declare const AuthorizeRequest: MessageFns<AuthorizeRequest>;
export declare const BillingAuthorizationResponse: MessageFns<BillingAuthorizationResponse>;
export declare const FinalizeRequest: MessageFns<FinalizeRequest>;
export declare const SettlementDecision: MessageFns<SettlementDecision>;
export declare const ReleaseRequest: MessageFns<ReleaseRequest>;
export declare const RefundRequest: MessageFns<RefundRequest>;
export declare const QueryBalanceRequest: MessageFns<QueryBalanceRequest>;
export declare const BalanceSnapshot: MessageFns<BalanceSnapshot>;
export declare const CreditGrant: MessageFns<CreditGrant>;
export declare const GrantCreditsRequest: MessageFns<GrantCreditsRequest>;
export declare const ListGrantsRequest: MessageFns<ListGrantsRequest>;
export declare const ListGrantsResponse: MessageFns<ListGrantsResponse>;
export declare const BillingTransaction: MessageFns<BillingTransaction>;
export declare const QueryTransactionsRequest: MessageFns<QueryTransactionsRequest>;
export declare const QueryTransactionsResponse: MessageFns<QueryTransactionsResponse>;
export declare const UsageCostSnapshot: MessageFns<UsageCostSnapshot>;
export declare const QuerySnapshotRequest: MessageFns<QuerySnapshotRequest>;
export declare const ManualReconcileRequest: MessageFns<ManualReconcileRequest>;
export declare const ManualReconcileResponse: MessageFns<ManualReconcileResponse>;
export interface BillingService {
    EstimateCharge(request: EstimateChargeRequest): Promise<EstimateChargeResponse>;
    Authorize(request: AuthorizeRequest): Promise<BillingAuthorizationResponse>;
    Finalize(request: FinalizeRequest): Promise<SettlementDecision>;
    Release(request: ReleaseRequest): Promise<SettlementDecision>;
    Refund(request: RefundRequest): Promise<SettlementDecision>;
    QueryBalance(request: QueryBalanceRequest): Promise<BalanceSnapshot>;
    GrantCredits(request: GrantCreditsRequest): Promise<CreditGrant>;
    ListGrants(request: ListGrantsRequest): Promise<ListGrantsResponse>;
    QueryTransactions(request: QueryTransactionsRequest): Promise<QueryTransactionsResponse>;
    QuerySnapshot(request: QuerySnapshotRequest): Promise<UsageCostSnapshot>;
    ManualReconcile(request: ManualReconcileRequest): Promise<ManualReconcileResponse>;
}
export declare const BillingServiceServiceName = "stew.api.v1.BillingService";
export declare class BillingServiceClientImpl implements BillingService {
    private readonly rpc;
    private readonly service;
    constructor(rpc: Rpc, opts?: {
        service?: string;
    });
    EstimateCharge(request: EstimateChargeRequest): Promise<EstimateChargeResponse>;
    Authorize(request: AuthorizeRequest): Promise<BillingAuthorizationResponse>;
    Finalize(request: FinalizeRequest): Promise<SettlementDecision>;
    Release(request: ReleaseRequest): Promise<SettlementDecision>;
    Refund(request: RefundRequest): Promise<SettlementDecision>;
    QueryBalance(request: QueryBalanceRequest): Promise<BalanceSnapshot>;
    GrantCredits(request: GrantCreditsRequest): Promise<CreditGrant>;
    ListGrants(request: ListGrantsRequest): Promise<ListGrantsResponse>;
    QueryTransactions(request: QueryTransactionsRequest): Promise<QueryTransactionsResponse>;
    QuerySnapshot(request: QuerySnapshotRequest): Promise<UsageCostSnapshot>;
    ManualReconcile(request: ManualReconcileRequest): Promise<ManualReconcileResponse>;
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
