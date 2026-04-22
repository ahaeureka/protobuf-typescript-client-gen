import { DeleteServiceRecordRequest, DeleteServiceRecordResponse, DeregisterServiceEndpointRequest, DeregisterServiceEndpointResponse, DeregisterServiceRequest, DeregisterServiceResponse, GetProtobufDescriptorRequest, GetProtobufDescriptorResponse, GetServiceConfigRequest, GetServiceConfigResponse, GetServiceInstancesRequest, GetServiceInstancesResponse, InitServiceRequest, InitServiceResponse, ListDescriptorVersionsRequest, ListDescriptorVersionsResponse, ListProtobufDescriptorsRequest, ListProtobufDescriptorsResponse, ListServicesRequest, ListServicesResponse, RegisterServiceEndpointRequest, RegisterServiceEndpointResponse, RegisterServiceRequest, RegisterServiceResponse, RollbackDescriptorRequest, RollbackDescriptorResponse, ServiceHealthCheckRequest, ServiceHealthCheckResponse, ServiceInstance, UpdateServiceHealthRequest, UpdateServiceHealthResponse, UpdateServiceInstanceRequest, UploadProtobufDescriptorRequest, UploadProtobufDescriptorResponse, UploadServiceConfigRequest, UploadServiceConfigResponse } from './service_discovery';
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
    init_service(request: InitServiceRequest, headers?: Record<string, string>): Promise<InitServiceResponse>;
    register_service(request: RegisterServiceRequest, headers?: Record<string, string>): Promise<RegisterServiceResponse>;
    register_service_endpoint(request: RegisterServiceEndpointRequest, headers?: Record<string, string>): Promise<RegisterServiceEndpointResponse>;
    deregister_service_endpoint(request: DeregisterServiceEndpointRequest, headers?: Record<string, string>): Promise<DeregisterServiceEndpointResponse>;
    deregister_service(request: DeregisterServiceRequest, headers?: Record<string, string>): Promise<DeregisterServiceResponse>;
    delete_service_record(request: DeleteServiceRecordRequest, headers?: Record<string, string>): Promise<DeleteServiceRecordResponse>;
    update_service_instance(request: UpdateServiceInstanceRequest, headers?: Record<string, string>): Promise<ServiceInstance>;
    get_service_instances(request: GetServiceInstancesRequest, headers?: Record<string, string>): Promise<GetServiceInstancesResponse>;
    list_services(request: ListServicesRequest, headers?: Record<string, string>): Promise<ListServicesResponse>;
    update_service_health(request: UpdateServiceHealthRequest, headers?: Record<string, string>): Promise<UpdateServiceHealthResponse>;
    service_health_check(request: ServiceHealthCheckRequest, headers?: Record<string, string>): Promise<ServiceHealthCheckResponse>;
    upload_service_config(request: UploadServiceConfigRequest, headers?: Record<string, string>): Promise<UploadServiceConfigResponse>;
    get_service_config(request: GetServiceConfigRequest, headers?: Record<string, string>): Promise<GetServiceConfigResponse>;
    upload_protobuf_descriptor(request: UploadProtobufDescriptorRequest, headers?: Record<string, string>): Promise<UploadProtobufDescriptorResponse>;
    get_protobuf_descriptor(request: GetProtobufDescriptorRequest, headers?: Record<string, string>): Promise<GetProtobufDescriptorResponse>;
    list_protobuf_descriptors(request: ListProtobufDescriptorsRequest, headers?: Record<string, string>): Promise<ListProtobufDescriptorsResponse>;
    rollback_descriptor(request: RollbackDescriptorRequest, headers?: Record<string, string>): Promise<RollbackDescriptorResponse>;
    list_descriptor_versions(request: ListDescriptorVersionsRequest, headers?: Record<string, string>): Promise<ListDescriptorVersionsResponse>;
}
