import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { User } from "./user";
export declare const protobufPackage = "stew.api.v1";
/** OIDC 令牌请求 */
export interface TokenRequest {
    code: string;
    redirect_uri: string;
    state: string;
}
/** JWT 令牌响应 */
export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    id_token: string;
    user_info: User | undefined;
}
/** 令牌验证请求 */
export interface ValidateTokenRequest {
    token: string;
}
/** 令牌验证响应 */
export interface ValidateTokenResponse {
    valid: boolean;
    user: User | undefined;
    claims: {
        [key: string]: any;
    } | undefined;
    expires_at: number;
}
/** 授权检查请求 */
export interface AuthorizationRequest {
    /** 主体信息（用户或 API Key） */
    subject: string;
    /** 操作（动作） */
    action: string;
    /** 资源（对象） */
    resource: string;
    /** 上下文信息（用于复杂决策） */
    context: {
        [key: string]: any;
    } | undefined;
    /** 域/租户信息（多租户场景） */
    domain: string;
    /** 是否强制使用 OPA（跳过 Casbin 缓存） */
    force_opa: boolean;
    /** 主体类型（user, apikey, service） */
    subject_type: string;
}
/** 授权检查响应 */
export interface AuthorizationResponse {
    /** 是否允许 */
    allowed: boolean;
    /** 决策原因 */
    reason: string;
    /** 决策来源（casbin 或 opa） */
    decision_source: string;
    /** 决策时间（毫秒） */
    decision_time_ms: number;
    /** 建议（可选的补充信息） */
    recommendations: string[];
    /** 审计追踪 ID */
    trace_id: string;
}
/** 批量授权检查请求 */
export interface BatchAuthorizationRequest {
    requests: AuthorizationRequest[];
}
/** 批量授权检查响应 */
export interface BatchAuthorizationResponse {
    responses: AuthorizationResponse[];
}
/** 策略规则（Casbin 格式） */
export interface PolicyRule {
    ptype: string;
    rule: string[];
}
/** 策略同步请求 */
export interface SyncPolicyRequest {
    domain: string;
    policies: PolicyRule[];
    version: number;
}
/** 策略同步响应 */
export interface SyncPolicyResponse {
    success: boolean;
    message: string;
    synced_count: number;
    synced_at: Date | undefined;
}
/** 获取策略请求 */
export interface GetPolicyRequest {
    domain: string;
    subject: string;
}
/** 获取策略响应 */
export interface GetPolicyResponse {
    policies: PolicyRule[];
    version: number;
    updated_at: Date | undefined;
}
/** 添加策略请求 */
export interface AddPolicyRequest {
    domain: string;
    policy: PolicyRule | undefined;
}
/** 删除策略请求 */
export interface RemovePolicyRequest {
    domain: string;
    policy: PolicyRule | undefined;
}
/** 策略操作响应 */
export interface PolicyOperationResponse {
    success: boolean;
    message: string;
}
/** 审计日志条目 */
export interface AuditLog {
    trace_id: string;
    timestamp: Date | undefined;
    subject: string;
    action: string;
    resource: string;
    allowed: boolean;
    decision_source: string;
    reason: string;
    context: {
        [key: string]: any;
    } | undefined;
    ip_address: string;
    user_agent: string;
}
/** 查询审计日志请求 */
export interface QueryAuditLogsRequest {
    subject: string;
    resource: string;
    start_time: Date | undefined;
    end_time: Date | undefined;
    page_size: number;
    page_token: string;
}
/** 查询审计日志响应 */
export interface QueryAuditLogsResponse {
    logs: AuditLog[];
    next_page_token: string;
    total_count: number;
}
/** 健康检查请求 */
export interface HealthCheckRequest {
    service: string;
}
/** 健康检查响应 */
export interface HealthCheckResponse {
    status: HealthCheckResponse_ServingStatus;
    components: {
        [key: string]: any;
    } | undefined;
    version: string;
}
export declare enum HealthCheckResponse_ServingStatus {
    UNKNOWN = 0,
    SERVING = 1,
    NOT_SERVING = 2,
    SERVICE_UNKNOWN = 3,
    UNRECOGNIZED = -1
}
export declare function healthCheckResponse_ServingStatusFromJSON(object: any): HealthCheckResponse_ServingStatus;
export declare function healthCheckResponse_ServingStatusToJSON(object: HealthCheckResponse_ServingStatus): string;
export declare const TokenRequest: MessageFns<TokenRequest>;
export declare const TokenResponse: MessageFns<TokenResponse>;
export declare const ValidateTokenRequest: MessageFns<ValidateTokenRequest>;
export declare const ValidateTokenResponse: MessageFns<ValidateTokenResponse>;
export declare const AuthorizationRequest: MessageFns<AuthorizationRequest>;
export declare const AuthorizationResponse: MessageFns<AuthorizationResponse>;
export declare const BatchAuthorizationRequest: MessageFns<BatchAuthorizationRequest>;
export declare const BatchAuthorizationResponse: MessageFns<BatchAuthorizationResponse>;
export declare const PolicyRule: MessageFns<PolicyRule>;
export declare const SyncPolicyRequest: MessageFns<SyncPolicyRequest>;
export declare const SyncPolicyResponse: MessageFns<SyncPolicyResponse>;
export declare const GetPolicyRequest: MessageFns<GetPolicyRequest>;
export declare const GetPolicyResponse: MessageFns<GetPolicyResponse>;
export declare const AddPolicyRequest: MessageFns<AddPolicyRequest>;
export declare const RemovePolicyRequest: MessageFns<RemovePolicyRequest>;
export declare const PolicyOperationResponse: MessageFns<PolicyOperationResponse>;
export declare const AuditLog: MessageFns<AuditLog>;
export declare const QueryAuditLogsRequest: MessageFns<QueryAuditLogsRequest>;
export declare const QueryAuditLogsResponse: MessageFns<QueryAuditLogsResponse>;
export declare const HealthCheckRequest: MessageFns<HealthCheckRequest>;
export declare const HealthCheckResponse: MessageFns<HealthCheckResponse>;
/** 授权服务（OPA + Casbin 混合决策） */
export interface AuthorizationService {
    /** 单次授权检查 */
    CheckAuthorization(request: AuthorizationRequest): Promise<AuthorizationResponse>;
    /** 批量授权检查 */
    BatchCheckAuthorization(request: BatchAuthorizationRequest): Promise<BatchAuthorizationResponse>;
    /** 同步策略（从 OPA 到 Casbin） */
    SyncPolicy(request: SyncPolicyRequest): Promise<SyncPolicyResponse>;
    /** 获取策略 */
    GetPolicy(request: GetPolicyRequest): Promise<GetPolicyResponse>;
    /** 添加策略 */
    AddPolicy(request: AddPolicyRequest): Promise<PolicyOperationResponse>;
    /** 删除策略 */
    RemovePolicy(request: RemovePolicyRequest): Promise<PolicyOperationResponse>;
    /** 查询审计日志 */
    QueryAuditLogs(request: QueryAuditLogsRequest): Promise<QueryAuditLogsResponse>;
    /** 健康检查 */
    HealthCheck(request: HealthCheckRequest): Promise<HealthCheckResponse>;
}
export declare const AuthorizationServiceServiceName = "stew.api.v1.AuthorizationService";
export declare class AuthorizationServiceClientImpl implements AuthorizationService {
    private readonly rpc;
    private readonly service;
    constructor(rpc: Rpc, opts?: {
        service?: string;
    });
    CheckAuthorization(request: AuthorizationRequest): Promise<AuthorizationResponse>;
    BatchCheckAuthorization(request: BatchAuthorizationRequest): Promise<BatchAuthorizationResponse>;
    SyncPolicy(request: SyncPolicyRequest): Promise<SyncPolicyResponse>;
    GetPolicy(request: GetPolicyRequest): Promise<GetPolicyResponse>;
    AddPolicy(request: AddPolicyRequest): Promise<PolicyOperationResponse>;
    RemovePolicy(request: RemovePolicyRequest): Promise<PolicyOperationResponse>;
    QueryAuditLogs(request: QueryAuditLogsRequest): Promise<QueryAuditLogsResponse>;
    HealthCheck(request: HealthCheckRequest): Promise<HealthCheckResponse>;
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
