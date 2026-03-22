import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { Any } from "./google/protobuf/any";
export declare const protobufPackage = "stew.api.v1";
/**
 * pub enum BalanceType {
 *     // RoundRobin 轮询
 *     RR,
 *     // WeightedRoundRobin 加权轮询
 *     WRR,
 *     // ConsistentHash
 *     ConsistentHash,
 *     // LeastConnections 最少连接
 *     LC,
 *     // SourceIPHash 源地址哈希
 *     SED,
 *     // WeightedLeastConnections 加权最少连接
 *     WLC,
 *     // // NeverQueuejum
 *     NQ,
 * }
 */
export declare enum BalanceType {
    BALANCE_TYPE_UNKNOWN = 0,
    /** BALANCE_TYPE_ROUND_ROBIN - RR */
    BALANCE_TYPE_ROUND_ROBIN = 1,
    /** BALANCE_TYPE_WEIGHTED_ROUND_ROBIN - WRR */
    BALANCE_TYPE_WEIGHTED_ROUND_ROBIN = 2,
    /** BALANCE_TYPE_CONSISTENT_HASH - ConsistentHash */
    BALANCE_TYPE_CONSISTENT_HASH = 3,
    /** BALANCE_TYPE_LEAST_CONNECTIONS - LC */
    BALANCE_TYPE_LEAST_CONNECTIONS = 4,
    /** BALANCE_TYPE_SED - SED Shortest Expected Delay */
    BALANCE_TYPE_SED = 5,
    /** BALANCE_TYPE_WEIGHTED_LEAST_CONNECTIONS - WLC */
    BALANCE_TYPE_WEIGHTED_LEAST_CONNECTIONS = 6,
    /** BALANCE_TYPE_NEVER_QUEUE - NQ Never Queue */
    BALANCE_TYPE_NEVER_QUEUE = 7,
    UNRECOGNIZED = -1
}
export declare function balanceTypeFromJSON(object: any): BalanceType;
export declare function balanceTypeToJSON(object: BalanceType): string;
/** 服务状态枚举 */
export declare enum ServiceStatus {
    SERVICE_STATUS_UNKNOWN = 0,
    SERVICE_STATUS_HEALTHY = 1,
    SERVICE_STATUS_UNHEALTHY = 2,
    SERVICE_STATUS_MAINTENANCE = 3,
    SERVICE_STATUS_DRAINING = 4,
    UNRECOGNIZED = -1
}
export declare function serviceStatusFromJSON(object: any): ServiceStatus;
export declare function serviceStatusToJSON(object: ServiceStatus): string;
export interface Endpoint {
    address: string;
    port: number;
    /** 服务权重（负载均衡用） */
    weight: number;
}
export interface LoadBalancer {
    type: BalanceType;
    /** 负载均衡参数 */
    endpoints: Endpoint[];
}
/** 健康检查配置 */
export interface HealthCheckConfig {
    /**
     * gRPC 方法名（例如："stew.api.v1.UserService/Get"）
     * 如果为空，则使用服务的第一个可用方法
     */
    grpc_method: string;
    /** HTTP 健康检查路径（例如："/health" 或 "/api/v1/health"） */
    http_path: string;
    /** 检查间隔（秒），默认 30 秒 */
    interval_seconds: number;
    /** 超时时间（秒），默认 5 秒 */
    timeout_seconds: number;
    /** 连续成功次数阈值（达到后标记为健康） */
    healthy_threshold: number;
    /** 连续失败次数阈值（达到后标记为不健康） */
    unhealthy_threshold: number;
    /** 是否启用健康检查（默认启用） */
    enabled: boolean;
}
export interface ServiceCorsConfig {
    enabled: boolean;
    allow_origins: string[];
    allow_methods: string[];
    allow_headers: string[];
    expose_headers: string[];
    allow_credentials: boolean;
    max_age_secs: number;
}
export interface ServiceRiskRuleConfig {
    name: string;
    enabled: boolean;
    path_prefixes: string[];
    countries: string[];
    proxy?: boolean | undefined;
    tor?: boolean | undefined;
    datacenter?: boolean | undefined;
    min_bot_score?: number | undefined;
    max_bot_score?: number | undefined;
    action: string;
}
export interface ServiceRiskConfig {
    enabled: boolean;
    mode: string;
    default_action: string;
    challenge_paths: string[];
    block_paths: string[];
    observe_only_paths: string[];
    high_risk_countries: string[];
    challenge_proxy_traffic: boolean;
    block_datacenter_traffic: boolean;
    allow_tor_exit_nodes: boolean;
    bot_score_threshold: number;
    proxy_score_threshold: number;
    action_overrides: ServiceRiskRuleConfig[];
}
export interface ServiceTurnstileConfig {
    enabled: boolean;
    required_paths: string[];
    skip_paths: string[];
    expected_action: string;
    expected_hostname: string;
    enforce_on_risk_challenge: boolean;
}
/**
 * AI Guard: configurable body field path mapping (Tier 2 extraction strategy).
 * When set, the gateway uses these paths to locate user messages, model name,
 * etc. in the JSON request body. Leave empty to fall back to heuristic detection.
 */
export interface AiBodyFieldMap {
    messages_path: string;
    role_field: string;
    content_field: string;
    user_role_value: string;
    prompt_path: string;
    model_path: string;
    max_tokens_path: string;
}
/**
 * AI SaaS abuse prevention configuration (per-service).
 * Controls token quotas, intent classification, context truncation,
 * and topic filtering for AI-related API endpoints.
 */
export interface ServiceAiGuardConfig {
    enabled: boolean;
    mode: string;
    include_paths: string[];
    request_body_max_bytes: number;
    max_input_tokens: number;
    max_output_tokens: number;
    max_context_tokens: number;
    history_policy: string;
    daily_token_quota: number;
    daily_request_quota: number;
    minute_request_quota: number;
    allow_free_chat: boolean;
    allowed_topics: string[];
    deny_keywords: string[];
    enable_audit: boolean;
    classifier_type: string;
    llm_endpoint: string;
    llm_model: string;
    llm_system_prompt: string;
    llm_timeout_ms: number;
    llm_confidence_threshold: number;
    body_map: AiBodyFieldMap | undefined;
    quota_window_secs: number;
    /**
     * Business intent configuration for the LLM classifier.
     * When llm_system_prompt is empty, these fields are used to automatically
     * build the intent classification prompt.
     */
    business_description: string;
    valid_intent_examples: string[];
    invalid_intent_examples: string[];
    /**
     * Per-endpoint configuration overrides (v2.0).
     * Each entry can override service-level defaults for a specific API endpoint.
     * Non-zero/non-empty fields override the parent ServiceAiGuardConfig value.
     * Matching priority: exact_paths > pattern_paths (by literal score) > longest prefix_paths > service-level default.
     */
    endpoint_overrides: AiGuardEndpointConfig[];
}
/**
 * Per-endpoint AI Guard configuration override.
 * Binds to specific API paths via exact or prefix matching.
 * Non-zero/non-empty fields override the parent ServiceAiGuardConfig value;
 * zero/empty fields inherit the service-level default.
 */
export interface AiGuardEndpointConfig {
    /**
     * Endpoint identifier (admin-assigned, used in Redis keys and audit logs).
     * Must be unique within the same service.
     */
    endpoint_id: string;
    /** Exact path matches, e.g. ["/stew.api.v1.ChatService/SendMessage", "/v1/chat/completions"] */
    exact_paths: string[];
    /** Prefix path matches, e.g. ["/stew.api.v1.Chat"] matches all methods under that prefix */
    prefix_paths: string[];
    /**
     * Path template matches using {param} placeholders for single-segment wildcards,
     * e.g. ["/api/v1/sessions/{session_id}/reflection"] matches any session ID.
     * Matching priority: exact_paths > pattern_paths (by literal score) > prefix_paths.
     */
    pattern_paths: string[];
    /** Disable AI Guard for this endpoint (true = skip even if service-level is enabled) */
    disabled?: boolean | undefined;
    mode: string;
    request_body_max_bytes: number;
    max_input_tokens: number;
    max_output_tokens: number;
    max_context_tokens: number;
    history_policy: string;
    daily_token_quota: number;
    daily_request_quota: number;
    minute_request_quota: number;
    quota_window_secs: number;
    allow_free_chat?: boolean | undefined;
    allowed_topics: string[];
    deny_keywords: string[];
    enable_audit?: boolean | undefined;
    classifier_type: string;
    llm_endpoint: string;
    llm_model: string;
    llm_system_prompt: string;
    business_description: string;
    valid_intent_examples: string[];
    invalid_intent_examples: string[];
    llm_timeout_ms: number;
    llm_confidence_threshold: number;
    body_map: AiBodyFieldMap | undefined;
}
/**
 * 每个下游服务的中间件开关配置
 * 注册或编辑服务时可单独控制各中间件的启用状态和参数。
 * 配置随 ServiceInstance 一起存储在 ETCD，运行时热生效。
 */
export interface ServiceMiddlewareConfig {
    /** 是否为该服务启用限流（false = 跳过限流检查） */
    rate_limit_enabled: boolean;
    /** 该服务的每分钟请求数上限（0 = 沿用全局默认值） */
    rate_limit_rpm: number;
    /** 该服务的每用户每分钟请求数上限（0 = 沿用全局默认值） */
    rate_limit_user_rpm: number;
    cors_enabled: boolean;
    cors: ServiceCorsConfig | undefined;
    risk_enabled: boolean;
    risk: ServiceRiskConfig | undefined;
    turnstile_enabled: boolean;
    turnstile: ServiceTurnstileConfig | undefined;
    ai_guard_enabled: boolean;
    ai_guard: ServiceAiGuardConfig | undefined;
}
/** 服务实例定义 */
export interface ServiceInstance {
    /** 服务名称 */
    service_name: string;
    /** 实例ID（服务内唯一） */
    instance_id: string;
    /**
     * // 服务端口
     *   uint32 port = 4 [json_name="port", (pydantic.field) = {description: "Service port", required: true}];
     */
    lb: LoadBalancer | undefined;
    /** 服务版本 */
    version: string;
    /** 服务元数据 */
    metadata: {
        [key: string]: Any;
    };
    /** 健康检查端点 */
    health_endpoint: string;
    /** 健康检查配置（新增） */
    health_check_config: HealthCheckConfig | undefined;
    /** 注册时间戳 */
    registered_at: Date | undefined;
    /** 服务状态 */
    status: ServiceStatus;
    /** 服务权重（负载均衡用） */
    weight: number;
    /** 服务标签 */
    tags: {
        [key: string]: string;
    };
    /** 协议类型 */
    protocol: string;
    /** 是否支持TLS */
    tls_enabled: boolean;
    /** 服务的 protobuf 描述符文件（.pb 二进制数据） */
    protobuf_descriptor: Uint8Array;
    /** 每服务中间件配置（注册/编辑服务时设置，存储在 ETCD） */
    middleware_config: ServiceMiddlewareConfig | undefined;
}
export interface ServiceInstance_MetadataEntry {
    key: string;
    value: Any | undefined;
}
export interface ServiceInstance_TagsEntry {
    key: string;
    value: string;
}
/**
 * 初始化服务请求（管理端专属）
 * 管理员在管理端初始化服务后，系统生成 app_id + app_secret 凭证供业务侧使用
 */
export interface InitServiceRequest {
    /** Globally unique service name. Duplicate names are rejected. */
    service_name: string;
    description: string;
    protocol: string;
}
/** 初始化服务响应 */
export interface InitServiceResponse {
    success: boolean;
    message: string;
    app_id: string;
    app_secret: string;
    service_name: string;
}
/** 注册服务请求 */
export interface RegisterServiceRequest {
    service: ServiceInstance | undefined;
    /** TTL（生存时间，秒） */
    ttl: number;
}
/** 注册服务响应 */
export interface RegisterServiceResponse {
    success: boolean;
    message: string;
    lease_id: string;
    instance_id: string;
}
/** 注销服务请求 */
export interface DeregisterServiceRequest {
    service_name: string;
    instance_id: string;
}
/** 注销服务响应 */
export interface DeregisterServiceResponse {
    success: boolean;
    message: string;
}
/** 删除持久化服务记录请求 */
export interface DeleteServiceRecordRequest {
    service_name: string;
    instance_id: string;
}
/** 删除持久化服务记录响应 */
export interface DeleteServiceRecordResponse {
    success: boolean;
    message: string;
}
/** 更新服务实例请求 */
export interface UpdateServiceInstanceRequest {
    service: ServiceInstance | undefined;
}
/** 更新服务实例响应 */
export interface UpdateServiceInstanceResponse {
    success: boolean;
    message: string;
    updated_service: ServiceInstance | undefined;
}
/** 获取服务实例请求 */
export interface GetServiceInstancesRequest {
    service_name: string;
    /** 可选的标签过滤 */
    tag_filters: {
        [key: string]: string;
    };
    /** 是否只返回健康的实例 */
    healthy_only: boolean;
}
export interface GetServiceInstancesRequest_TagFiltersEntry {
    key: string;
    value: string;
}
/** 获取服务实例响应 */
export interface GetServiceInstancesResponse {
    instances: ServiceInstance[];
    total_count: number;
}
/** 列出所有服务请求 */
export interface ListServicesRequest {
    /** 服务名前缀过滤 */
    name_prefix: string;
    /** 标签过滤 */
    tag_filters: {
        [key: string]: string;
    };
}
export interface ListServicesRequest_TagFiltersEntry {
    key: string;
    value: string;
}
/** 列出所有服务响应 */
export interface ListServicesResponse {
    services: ServiceInstance[];
    /**
     * 服务名称列表
     *   repeated string service_names = 1 [json_name="service_names", (pydantic.field) = {description: "List of service names"}];
     * 服务统计信息
     *   map<string, ServiceSummary> service_summaries = 2 [json_name="service_summaries", (pydantic.field) = {description: "Service summary information"}];
     */
    total_count: number;
}
/** 服务摘要信息 */
export interface ServiceSummary {
    service_name: string;
    instance_count: number;
    healthy_count: number;
    versions: string[];
}
/** 更新服务健康状态请求 */
export interface UpdateServiceHealthRequest {
    service_name: string;
    instance_id: string;
    status: ServiceStatus;
    health_message: string;
}
/** 更新服务健康状态响应 */
export interface UpdateServiceHealthResponse {
    success: boolean;
    message: string;
}
/** 服务健康检查请求 */
export interface ServiceHealthCheckRequest {
    service_name: string;
    instance_id: string;
}
/** 服务健康检查响应 */
export interface ServiceHealthCheckResponse {
    instance_healths: ServiceInstanceHealth[];
}
/** 服务实例健康状态 */
export interface ServiceInstanceHealth {
    instance: ServiceInstance | undefined;
    status: ServiceStatus;
    message: string;
    last_check: Date | undefined;
}
/** 上传服务配置请求 */
export interface UploadServiceConfigRequest {
    service_name: string;
    config_version: string;
    config_data: {
        [key: string]: any;
    } | undefined;
    description: string;
}
/** 上传服务配置响应 */
export interface UploadServiceConfigResponse {
    success: boolean;
    message: string;
    config_key: string;
}
/** 获取服务配置请求 */
export interface GetServiceConfigRequest {
    service_name: string;
    config_version: string;
}
/** 获取服务配置响应 */
export interface GetServiceConfigResponse {
    config_data: {
        [key: string]: any;
    } | undefined;
    config_version: string;
    updated_at: Date | undefined;
    description: string;
}
/** 上传 protobuf 描述符请求 */
export interface UploadProtobufDescriptorRequest {
    service_name: string;
    descriptor_version: string;
    descriptor_data: Uint8Array;
    description: string;
    /** HMAC-SHA256(descriptor_data, shared_secret) - optional integrity verification */
    signature: string;
    /** Force update, skip compatibility warnings */
    force: boolean;
    /** Previous version for optimistic locking (reject if active version != previous_version) */
    previous_version: string;
}
/** 上传 protobuf 描述符响应 */
export interface UploadProtobufDescriptorResponse {
    success: boolean;
    message: string;
    descriptor_key: string;
    discovered_services: string[];
    /** Compatibility warnings (breaking changes detected but not blocked) */
    compatibility_warnings: string[];
    /** Actual version applied (may differ from requested if auto-generated) */
    applied_version: string;
    /** SHA-256 hash of the descriptor data */
    descriptor_hash: string;
}
/** 获取 protobuf 描述符请求 */
export interface GetProtobufDescriptorRequest {
    service_name: string;
    descriptor_version: string;
}
/** 获取 protobuf 描述符响应 */
export interface GetProtobufDescriptorResponse {
    descriptor_data: Uint8Array;
    descriptor_version: string;
    updated_at: Date | undefined;
    description: string;
    services: string[];
}
/** 列出可用的 protobuf 描述符请求 */
export interface ListProtobufDescriptorsRequest {
    service_name_prefix: string;
}
/** 列出可用的 protobuf 描述符响应 */
export interface ListProtobufDescriptorsResponse {
    descriptors: ProtobufDescriptorInfo[];
}
/** protobuf 描述符信息 */
export interface ProtobufDescriptorInfo {
    service_name: string;
    descriptor_version: string;
    updated_at: Date | undefined;
    description: string;
    services: string[];
    size_bytes: number;
    descriptor_hash: string;
    is_active: boolean;
}
/** 描述符版本详细信息 */
export interface DescriptorVersionInfo {
    version: string;
    descriptor_hash: string;
    created_at: Date | undefined;
    description: string;
    services: string[];
    size_bytes: number;
    is_active: boolean;
}
/** 回滚描述符请求 */
export interface RollbackDescriptorRequest {
    service_name: string;
    target_version: string;
}
/** 回滚描述符响应 */
export interface RollbackDescriptorResponse {
    success: boolean;
    message: string;
    active_version: string;
    discovered_services: string[];
}
/** 列出描述符版本请求 */
export interface ListDescriptorVersionsRequest {
    service_name: string;
}
/** 列出描述符版本响应 */
export interface ListDescriptorVersionsResponse {
    versions: DescriptorVersionInfo[];
    active_version: string;
}
export declare const Endpoint: MessageFns<Endpoint>;
export declare const LoadBalancer: MessageFns<LoadBalancer>;
export declare const HealthCheckConfig: MessageFns<HealthCheckConfig>;
export declare const ServiceCorsConfig: MessageFns<ServiceCorsConfig>;
export declare const ServiceRiskRuleConfig: MessageFns<ServiceRiskRuleConfig>;
export declare const ServiceRiskConfig: MessageFns<ServiceRiskConfig>;
export declare const ServiceTurnstileConfig: MessageFns<ServiceTurnstileConfig>;
export declare const AiBodyFieldMap: MessageFns<AiBodyFieldMap>;
export declare const ServiceAiGuardConfig: MessageFns<ServiceAiGuardConfig>;
export declare const AiGuardEndpointConfig: MessageFns<AiGuardEndpointConfig>;
export declare const ServiceMiddlewareConfig: MessageFns<ServiceMiddlewareConfig>;
export declare const ServiceInstance: MessageFns<ServiceInstance>;
export declare const ServiceInstance_MetadataEntry: MessageFns<ServiceInstance_MetadataEntry>;
export declare const ServiceInstance_TagsEntry: MessageFns<ServiceInstance_TagsEntry>;
export declare const InitServiceRequest: MessageFns<InitServiceRequest>;
export declare const InitServiceResponse: MessageFns<InitServiceResponse>;
export declare const RegisterServiceRequest: MessageFns<RegisterServiceRequest>;
export declare const RegisterServiceResponse: MessageFns<RegisterServiceResponse>;
export declare const DeregisterServiceRequest: MessageFns<DeregisterServiceRequest>;
export declare const DeregisterServiceResponse: MessageFns<DeregisterServiceResponse>;
export declare const DeleteServiceRecordRequest: MessageFns<DeleteServiceRecordRequest>;
export declare const DeleteServiceRecordResponse: MessageFns<DeleteServiceRecordResponse>;
export declare const UpdateServiceInstanceRequest: MessageFns<UpdateServiceInstanceRequest>;
export declare const UpdateServiceInstanceResponse: MessageFns<UpdateServiceInstanceResponse>;
export declare const GetServiceInstancesRequest: MessageFns<GetServiceInstancesRequest>;
export declare const GetServiceInstancesRequest_TagFiltersEntry: MessageFns<GetServiceInstancesRequest_TagFiltersEntry>;
export declare const GetServiceInstancesResponse: MessageFns<GetServiceInstancesResponse>;
export declare const ListServicesRequest: MessageFns<ListServicesRequest>;
export declare const ListServicesRequest_TagFiltersEntry: MessageFns<ListServicesRequest_TagFiltersEntry>;
export declare const ListServicesResponse: MessageFns<ListServicesResponse>;
export declare const ServiceSummary: MessageFns<ServiceSummary>;
export declare const UpdateServiceHealthRequest: MessageFns<UpdateServiceHealthRequest>;
export declare const UpdateServiceHealthResponse: MessageFns<UpdateServiceHealthResponse>;
export declare const ServiceHealthCheckRequest: MessageFns<ServiceHealthCheckRequest>;
export declare const ServiceHealthCheckResponse: MessageFns<ServiceHealthCheckResponse>;
export declare const ServiceInstanceHealth: MessageFns<ServiceInstanceHealth>;
export declare const UploadServiceConfigRequest: MessageFns<UploadServiceConfigRequest>;
export declare const UploadServiceConfigResponse: MessageFns<UploadServiceConfigResponse>;
export declare const GetServiceConfigRequest: MessageFns<GetServiceConfigRequest>;
export declare const GetServiceConfigResponse: MessageFns<GetServiceConfigResponse>;
export declare const UploadProtobufDescriptorRequest: MessageFns<UploadProtobufDescriptorRequest>;
export declare const UploadProtobufDescriptorResponse: MessageFns<UploadProtobufDescriptorResponse>;
export declare const GetProtobufDescriptorRequest: MessageFns<GetProtobufDescriptorRequest>;
export declare const GetProtobufDescriptorResponse: MessageFns<GetProtobufDescriptorResponse>;
export declare const ListProtobufDescriptorsRequest: MessageFns<ListProtobufDescriptorsRequest>;
export declare const ListProtobufDescriptorsResponse: MessageFns<ListProtobufDescriptorsResponse>;
export declare const ProtobufDescriptorInfo: MessageFns<ProtobufDescriptorInfo>;
export declare const DescriptorVersionInfo: MessageFns<DescriptorVersionInfo>;
export declare const RollbackDescriptorRequest: MessageFns<RollbackDescriptorRequest>;
export declare const RollbackDescriptorResponse: MessageFns<RollbackDescriptorResponse>;
export declare const ListDescriptorVersionsRequest: MessageFns<ListDescriptorVersionsRequest>;
export declare const ListDescriptorVersionsResponse: MessageFns<ListDescriptorVersionsResponse>;
/** 服务注册和发现服务 */
export interface ServiceDiscoveryService {
    /** 初始化服务（管理端专属，生成 app_id + app_secret） */
    InitService(request: InitServiceRequest): Promise<InitServiceResponse>;
    /** 注册服务实例 */
    RegisterService(request: RegisterServiceRequest): Promise<RegisterServiceResponse>;
    /** 注销服务实例 */
    DeregisterService(request: DeregisterServiceRequest): Promise<DeregisterServiceResponse>;
    /** 删除持久化服务记录 */
    DeleteServiceRecord(request: DeleteServiceRecordRequest): Promise<DeleteServiceRecordResponse>;
    /** 更新服务实例 */
    UpdateServiceInstance(request: UpdateServiceInstanceRequest): Promise<ServiceInstance>;
    /** 获取服务实例列表 */
    GetServiceInstances(request: GetServiceInstancesRequest): Promise<GetServiceInstancesResponse>;
    /** 列出所有服务 */
    ListServices(request: ListServicesRequest): Promise<ListServicesResponse>;
    /** 更新服务健康状态 */
    UpdateServiceHealth(request: UpdateServiceHealthRequest): Promise<UpdateServiceHealthResponse>;
    /** 服务健康检查 */
    ServiceHealthCheck(request: ServiceHealthCheckRequest): Promise<ServiceHealthCheckResponse>;
    /** 上传服务配置 */
    UploadServiceConfig(request: UploadServiceConfigRequest): Promise<UploadServiceConfigResponse>;
    /** 获取服务配置 */
    GetServiceConfig(request: GetServiceConfigRequest): Promise<GetServiceConfigResponse>;
    /** 上传 protobuf 描述符 */
    UploadProtobufDescriptor(request: UploadProtobufDescriptorRequest): Promise<UploadProtobufDescriptorResponse>;
    /** 获取 protobuf 描述符 */
    GetProtobufDescriptor(request: GetProtobufDescriptorRequest): Promise<GetProtobufDescriptorResponse>;
    /** 列出可用的 protobuf 描述符 */
    ListProtobufDescriptors(request: ListProtobufDescriptorsRequest): Promise<ListProtobufDescriptorsResponse>;
    /** 回滚描述符到指定版本 */
    RollbackDescriptor(request: RollbackDescriptorRequest): Promise<RollbackDescriptorResponse>;
    /** 列出描述符版本历史 */
    ListDescriptorVersions(request: ListDescriptorVersionsRequest): Promise<ListDescriptorVersionsResponse>;
}
export declare const ServiceDiscoveryServiceServiceName = "stew.api.v1.ServiceDiscoveryService";
export declare class ServiceDiscoveryServiceClientImpl implements ServiceDiscoveryService {
    private readonly rpc;
    private readonly service;
    constructor(rpc: Rpc, opts?: {
        service?: string;
    });
    InitService(request: InitServiceRequest): Promise<InitServiceResponse>;
    RegisterService(request: RegisterServiceRequest): Promise<RegisterServiceResponse>;
    DeregisterService(request: DeregisterServiceRequest): Promise<DeregisterServiceResponse>;
    DeleteServiceRecord(request: DeleteServiceRecordRequest): Promise<DeleteServiceRecordResponse>;
    UpdateServiceInstance(request: UpdateServiceInstanceRequest): Promise<ServiceInstance>;
    GetServiceInstances(request: GetServiceInstancesRequest): Promise<GetServiceInstancesResponse>;
    ListServices(request: ListServicesRequest): Promise<ListServicesResponse>;
    UpdateServiceHealth(request: UpdateServiceHealthRequest): Promise<UpdateServiceHealthResponse>;
    ServiceHealthCheck(request: ServiceHealthCheckRequest): Promise<ServiceHealthCheckResponse>;
    UploadServiceConfig(request: UploadServiceConfigRequest): Promise<UploadServiceConfigResponse>;
    GetServiceConfig(request: GetServiceConfigRequest): Promise<GetServiceConfigResponse>;
    UploadProtobufDescriptor(request: UploadProtobufDescriptorRequest): Promise<UploadProtobufDescriptorResponse>;
    GetProtobufDescriptor(request: GetProtobufDescriptorRequest): Promise<GetProtobufDescriptorResponse>;
    ListProtobufDescriptors(request: ListProtobufDescriptorsRequest): Promise<ListProtobufDescriptorsResponse>;
    RollbackDescriptor(request: RollbackDescriptorRequest): Promise<RollbackDescriptorResponse>;
    ListDescriptorVersions(request: ListDescriptorVersionsRequest): Promise<ListDescriptorVersionsResponse>;
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
