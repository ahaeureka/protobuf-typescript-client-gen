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
export declare enum BillingPolicyArtifactType {
    BILLING_POLICY_ARTIFACT_TYPE_UNSPECIFIED = 0,
    BILLING_POLICY_ARTIFACT_TYPE_PROVIDER_RATE_CARD = 1,
    BILLING_POLICY_ARTIFACT_TYPE_POINT_POLICY = 2,
    BILLING_POLICY_ARTIFACT_TYPE_MONEY_POLICY = 3,
    BILLING_POLICY_ARTIFACT_TYPE_ESTIMATOR = 4,
    UNRECOGNIZED = -1
}
export declare function billingPolicyArtifactTypeFromJSON(object: any): BillingPolicyArtifactType;
export declare function billingPolicyArtifactTypeToJSON(object: BillingPolicyArtifactType): string;
export interface ServiceBillingConfig {
    enabled: boolean;
    businessId: string;
    policyId: string;
    subjectMode: BillingSubjectType;
    preauthMode: BillingPreauthMode;
    allowAnonymousSubject: boolean;
    missingReportAction: BillingMissingReportAction;
    releaseTimeoutSeconds: number;
    reportTransport: BillingReportTransport;
    reportHeaderPrefix: string;
    factorSchemaVersion: string;
    maxReservationTtlSeconds: number;
    idempotencyWindowSeconds: number;
    captureRequiresReport: boolean;
    reconcileScanIntervalSeconds: number;
    maxReportSizeBytes: number;
    strictPolicySnapshot: boolean;
}
export interface AuthorizationContext {
    businessId: string;
    userId: string;
    authorizationId: string;
    requestId: string;
    policyId: string;
    subjectId: string;
    subjectType: BillingSubjectType;
    factorSchemaVersion: string;
}
export interface BillingUsageTotals {
    promptTokens: number;
    completionTokens: number;
    embeddingTokens: number;
    ocrPages: number;
    asrMinutes: number;
    infraUnits: number;
}
export interface BillingCostBreakdown {
    chatInMicros: number;
    chatOutMicros: number;
    embedMicros: number;
    mediaMicros: number;
    infraMicros: number;
    totalCostMicros: number;
}
export interface BillingPointBreakdown {
    basePoints: number;
    factorPoints: number;
    finalPoints: number;
    minPoints: number;
    pointPolicyArtifactId: string;
    pointPolicyVersion: string;
}
export interface BillingMoneySnapshot {
    faceValueMinor: number;
    recognizedRevenueMinor: number;
    budgetConsumedMinor: number;
    faceValueMinorPerPoint: number;
    recognizedRevenueMinorPerPoint: number;
    budgetMinorPerPoint: number;
    moneyPolicyArtifactId: string;
    moneyPolicyVersion: string;
}
export interface BillingPolicyArtifact {
    artifactId: string;
    businessId: string;
    artifactType: BillingPolicyArtifactType;
    artifactVersion: string;
    content: {
        [key: string]: any;
    } | undefined;
    contentHash: string;
    createdAt: Date | undefined;
}
export interface BillingPolicyBundle {
    policyId: string;
    businessId: string;
    bundleVersion: number;
    factorSchemaVersion: string;
    providerRateCardArtifactId: string;
    pointPolicyArtifactId: string;
    moneyPolicyArtifactId: string;
    estimatorArtifactId: string;
    status: string;
    publishedAt: Date | undefined;
}
export interface CreateBillingPolicyArtifactRequest {
    businessId: string;
    policyId: string;
    artifactType: BillingPolicyArtifactType;
    artifactVersion: string;
    content: {
        [key: string]: any;
    } | undefined;
}
export interface GetBillingPolicyArtifactRequest {
    artifactId: string;
}
export interface ListBillingPolicyArtifactsRequest {
    businessId: string;
    policyId: string;
    artifactType: BillingPolicyArtifactType;
}
export interface ListBillingPolicyArtifactsResponse {
    artifacts: BillingPolicyArtifact[];
}
export interface PublishBillingPolicyBundleRequest {
    businessId: string;
    policyId: string;
    bundleVersion: number;
    factorSchemaVersion: string;
    providerRateCardArtifactId: string;
    pointPolicyArtifactId: string;
    moneyPolicyArtifactId: string;
    estimatorArtifactId: string;
}
export interface GetBillingPolicyBundleRequest {
    businessId: string;
    policyId: string;
    bundleVersion: number;
}
export interface ListBillingPolicyBundlesRequest {
    businessId: string;
    policyId: string;
    activeOnly: boolean;
}
export interface ListBillingPolicyBundlesResponse {
    bundles: BillingPolicyBundle[];
}
export interface BillingReport {
    businessId: string;
    authorizationId: string;
    requestId: string;
    userId: string;
    usageSource: BillingUsageSource;
    finalStatus: BillingFinalStatus;
    rawUsageTotals: BillingUsageTotals | undefined;
    providerUsageFacts: {
        [key: string]: any;
    } | undefined;
    businessFactors: {
        [key: string]: any;
    } | undefined;
    executionHints: {
        [key: string]: any;
    } | undefined;
    refundReason: string;
    dedupeKey: string;
}
export interface EstimateChargeRequest {
    context: AuthorizationContext | undefined;
    requestFactors: {
        [key: string]: any;
    } | undefined;
}
export interface EstimateChargeResponse {
    success: boolean;
    estimatedPoints: number;
    message: string;
}
export interface AuthorizeRequest {
    context: AuthorizationContext | undefined;
    estimatedPoints: number;
}
export interface BillingAuthorizationResponse {
    success: boolean;
    authorizationId: string;
    heldPoints: number;
    message: string;
}
export interface FinalizeRequest {
    context: AuthorizationContext | undefined;
    report: BillingReport | undefined;
}
export interface SettlementDecision {
    success: boolean;
    transactionType: BillingTransactionType;
    points: number;
    faceValueMinor: number;
    recognizedRevenueMinor: number;
    budgetConsumedMinor: number;
    message: string;
}
export interface ReleaseRequest {
    authorizationId: string;
    requestId: string;
    reason: string;
}
export interface RefundRequest {
    authorizationId: string;
    requestId: string;
    reason: string;
}
export interface QueryBalanceRequest {
    businessId: string;
    subjectId: string;
    subjectType: BillingSubjectType;
    userId: string;
}
export interface BalanceSnapshot {
    businessId: string;
    subjectId: string;
    subjectType: BillingSubjectType;
    userId: string;
    availableBalance: number;
    heldBalance: number;
    totalGranted: number;
    totalConsumed: number;
    updatedAt: Date | undefined;
}
export interface CreditGrant {
    grantId: string;
    businessId: string;
    userId: string;
    subjectId: string;
    subjectType: BillingSubjectType;
    creditType: string;
    amount: number;
    consumed: number;
    expiresAt: Date | undefined;
    status: string;
}
export interface GrantCreditsRequest {
    businessId: string;
    userId: string;
    subjectId: string;
    subjectType: BillingSubjectType;
    creditType: string;
    amount: number;
}
export interface ListGrantsRequest {
    businessId: string;
    subjectId: string;
    subjectType: BillingSubjectType;
    userId: string;
}
export interface ListGrantsResponse {
    grants: CreditGrant[];
}
export interface BillingTransaction {
    transactionId: string;
    businessId: string;
    userId: string;
    authorizationId: string;
    requestId: string;
    subjectId: string;
    subjectType: BillingSubjectType;
    transactionType: BillingTransactionType;
    points: number;
    faceValueMinor: number;
    recognizedRevenueMinor: number;
    budgetConsumedMinor: number;
    createdAt: Date | undefined;
}
export interface QueryTransactionsRequest {
    businessId: string;
    requestId: string;
    authorizationId: string;
    subjectId: string;
    subjectType: BillingSubjectType;
    userId: string;
}
export interface QueryTransactionsResponse {
    transactions: BillingTransaction[];
}
export interface BillingSettlementSnapshot {
    businessId: string;
    userId: string;
    authorizationId: string;
    requestId: string;
    subjectId: string;
    subjectType: BillingSubjectType;
    usageSnapshot: BillingUsageTotals | undefined;
    providerUsageFacts: {
        [key: string]: any;
    } | undefined;
    businessFactors: {
        [key: string]: any;
    } | undefined;
    executionHints: {
        [key: string]: any;
    } | undefined;
    rawCostSnapshot: BillingCostBreakdown | undefined;
    pointBreakdown: BillingPointBreakdown | undefined;
    moneySnapshot: BillingMoneySnapshot | undefined;
    policyId: string;
    policyBundleVersion: number;
    factorSchemaVersion: string;
    providerRateCardArtifactId: string;
    pointPolicyArtifactId: string;
    moneyPolicyArtifactId: string;
    estimatorArtifactId: string;
    appliedPoints: number;
    faceValueMinor: number;
    recognizedRevenueMinor: number;
    budgetConsumedMinor: number;
    createdAt: Date | undefined;
}
export interface QuerySnapshotRequest {
    requestId: string;
}
export interface ManualReconcileRequest {
    requestId: string;
    authorizationId: string;
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
export declare const BillingPointBreakdown: MessageFns<BillingPointBreakdown>;
export declare const BillingMoneySnapshot: MessageFns<BillingMoneySnapshot>;
export declare const BillingPolicyArtifact: MessageFns<BillingPolicyArtifact>;
export declare const BillingPolicyBundle: MessageFns<BillingPolicyBundle>;
export declare const CreateBillingPolicyArtifactRequest: MessageFns<CreateBillingPolicyArtifactRequest>;
export declare const GetBillingPolicyArtifactRequest: MessageFns<GetBillingPolicyArtifactRequest>;
export declare const ListBillingPolicyArtifactsRequest: MessageFns<ListBillingPolicyArtifactsRequest>;
export declare const ListBillingPolicyArtifactsResponse: MessageFns<ListBillingPolicyArtifactsResponse>;
export declare const PublishBillingPolicyBundleRequest: MessageFns<PublishBillingPolicyBundleRequest>;
export declare const GetBillingPolicyBundleRequest: MessageFns<GetBillingPolicyBundleRequest>;
export declare const ListBillingPolicyBundlesRequest: MessageFns<ListBillingPolicyBundlesRequest>;
export declare const ListBillingPolicyBundlesResponse: MessageFns<ListBillingPolicyBundlesResponse>;
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
export declare const BillingSettlementSnapshot: MessageFns<BillingSettlementSnapshot>;
export declare const QuerySnapshotRequest: MessageFns<QuerySnapshotRequest>;
export declare const ManualReconcileRequest: MessageFns<ManualReconcileRequest>;
export declare const ManualReconcileResponse: MessageFns<ManualReconcileResponse>;
/** BillingService exposes billing authorization, settlement, balance, and snapshot APIs. */
export interface BillingService {
    /** EstimateCharge computes a request-side point estimate for pre-authorization. */
    EstimateCharge(request: EstimateChargeRequest): Promise<EstimateChargeResponse>;
    /** Authorize holds points for a request before business execution starts. */
    Authorize(request: AuthorizeRequest): Promise<BillingAuthorizationResponse>;
    /** Finalize settles an authorization from business-reported usage facts. */
    Finalize(request: FinalizeRequest): Promise<SettlementDecision>;
    /** Release releases held points without capture. */
    Release(request: ReleaseRequest): Promise<SettlementDecision>;
    /** Refund compensates a captured authorization or releases an uncaptured hold. */
    Refund(request: RefundRequest): Promise<SettlementDecision>;
    /** QueryBalance returns the current derived balance snapshot for a subject. */
    QueryBalance(request: QueryBalanceRequest): Promise<BalanceSnapshot>;
    /** GrantCredits grants credits to a billing subject. */
    GrantCredits(request: GrantCreditsRequest): Promise<CreditGrant>;
    /** ListGrants lists credit grants for a billing subject. */
    ListGrants(request: ListGrantsRequest): Promise<ListGrantsResponse>;
    /** QueryTransactions lists matching billing transactions. */
    QueryTransactions(request: QueryTransactionsRequest): Promise<QueryTransactionsResponse>;
    /** CreatePolicyArtifact creates or returns an immutable policy artifact version. */
    CreatePolicyArtifact(request: CreateBillingPolicyArtifactRequest): Promise<BillingPolicyArtifact>;
    /** GetPolicyArtifact returns a single immutable policy artifact. */
    GetPolicyArtifact(request: GetBillingPolicyArtifactRequest): Promise<BillingPolicyArtifact>;
    /** ListPolicyArtifacts lists policy artifacts under a business, optionally filtered by policy and type. */
    ListPolicyArtifacts(request: ListBillingPolicyArtifactsRequest): Promise<ListBillingPolicyArtifactsResponse>;
    /** PublishPolicyBundle publishes a concrete bundle and makes it the active version for the policy_id. */
    PublishPolicyBundle(request: PublishBillingPolicyBundleRequest): Promise<BillingPolicyBundle>;
    /** GetPolicyBundle returns a concrete published bundle version. */
    GetPolicyBundle(request: GetBillingPolicyBundleRequest): Promise<BillingPolicyBundle>;
    /** ListPolicyBundles lists published bundle versions, or only active bundles when requested. */
    ListPolicyBundles(request: ListBillingPolicyBundlesRequest): Promise<ListBillingPolicyBundlesResponse>;
    /** QuerySnapshot returns the immutable settlement snapshot for a finalized request. */
    QuerySnapshot(request: QuerySnapshotRequest): Promise<BillingSettlementSnapshot>;
    /** ManualReconcile triggers a reconciliation pass for a request and authorization pair. */
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
    CreatePolicyArtifact(request: CreateBillingPolicyArtifactRequest): Promise<BillingPolicyArtifact>;
    GetPolicyArtifact(request: GetBillingPolicyArtifactRequest): Promise<BillingPolicyArtifact>;
    ListPolicyArtifacts(request: ListBillingPolicyArtifactsRequest): Promise<ListBillingPolicyArtifactsResponse>;
    PublishPolicyBundle(request: PublishBillingPolicyBundleRequest): Promise<BillingPolicyBundle>;
    GetPolicyBundle(request: GetBillingPolicyBundleRequest): Promise<BillingPolicyBundle>;
    ListPolicyBundles(request: ListBillingPolicyBundlesRequest): Promise<ListBillingPolicyBundlesResponse>;
    QuerySnapshot(request: QuerySnapshotRequest): Promise<BillingSettlementSnapshot>;
    ManualReconcile(request: ManualReconcileRequest): Promise<ManualReconcileResponse>;
}
interface Rpc {
    request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
}
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
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
