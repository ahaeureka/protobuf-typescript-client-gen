import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
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
        [key: string]: any;
    } | undefined;
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
export interface ServiceInstance_TagsEntry {
    key: string;
    value: string;
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
}
/** 上传 protobuf 描述符响应 */
export interface UploadProtobufDescriptorResponse {
    success: boolean;
    message: string;
    descriptor_key: string;
    discovered_services: string[];
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
}
export declare const Endpoint: MessageFns<Endpoint>;
export declare const LoadBalancer: MessageFns<LoadBalancer>;
export declare const HealthCheckConfig: MessageFns<HealthCheckConfig>;
export declare const ServiceMiddlewareConfig: MessageFns<ServiceMiddlewareConfig>;
export declare const ServiceInstance: MessageFns<ServiceInstance>;
export declare const ServiceInstance_TagsEntry: MessageFns<ServiceInstance_TagsEntry>;
export declare const RegisterServiceRequest: MessageFns<RegisterServiceRequest>;
export declare const RegisterServiceResponse: MessageFns<RegisterServiceResponse>;
export declare const DeregisterServiceRequest: MessageFns<DeregisterServiceRequest>;
export declare const DeregisterServiceResponse: MessageFns<DeregisterServiceResponse>;
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
/** 服务注册和发现服务 */
export interface ServiceDiscoveryService {
    /** 注册服务实例 */
    RegisterService(request: RegisterServiceRequest): Promise<RegisterServiceResponse>;
    /** 注销服务实例 */
    DeregisterService(request: DeregisterServiceRequest): Promise<DeregisterServiceResponse>;
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
}
export declare const ServiceDiscoveryServiceServiceName = "stew.api.v1.ServiceDiscoveryService";
export declare class ServiceDiscoveryServiceClientImpl implements ServiceDiscoveryService {
    private readonly rpc;
    private readonly service;
    constructor(rpc: Rpc, opts?: {
        service?: string;
    });
    RegisterService(request: RegisterServiceRequest): Promise<RegisterServiceResponse>;
    DeregisterService(request: DeregisterServiceRequest): Promise<DeregisterServiceResponse>;
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
