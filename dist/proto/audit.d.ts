import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "stew.api.v1";
/** 审计日志条目 */
export interface AuditLogEntry {
    id: string;
    trace_id: string;
    user_id: string;
    api_key_id: string;
    session_id: string;
    action: string;
    resource: string;
    domain: string;
    ip_address: string;
    user_agent: string;
    success: boolean;
    decision_source: string;
    reason: string;
    error_message: string;
    request_size: number;
    response_size: number;
    duration_ms: number;
    metadata: {
        [key: string]: string;
    };
    created_at: Date | undefined;
}
export interface AuditLogEntry_MetadataEntry {
    key: string;
    value: string;
}
/** 获取审计日志请求 */
export interface GetAuditLogsRequest {
    trace_id: string;
    user_id: string;
    api_key_id: string;
    session_id: string;
    action: string;
    resource: string;
    domain: string;
    success_filter: number;
    decision_source: string;
    start_time: Date | undefined;
    end_time: Date | undefined;
    page: number;
    limit: number;
}
/** 获取审计日志响应 */
export interface GetAuditLogsResponse {
    logs: AuditLogEntry[];
    total: number;
    page: number;
    limit: number;
}
/** 获取审计统计请求 */
export interface GetAuditStatisticsRequest {
    start_time: Date | undefined;
    end_time: Date | undefined;
}
/** 动作统计 */
export interface ActionStatistic {
    action: string;
    count: number;
}
/** 获取审计统计响应 */
export interface GetAuditStatisticsResponse {
    total_count: number;
    success_count: number;
    failure_count: number;
    action_stats: ActionStatistic[];
}
export declare const AuditLogEntry: MessageFns<AuditLogEntry>;
export declare const AuditLogEntry_MetadataEntry: MessageFns<AuditLogEntry_MetadataEntry>;
export declare const GetAuditLogsRequest: MessageFns<GetAuditLogsRequest>;
export declare const GetAuditLogsResponse: MessageFns<GetAuditLogsResponse>;
export declare const GetAuditStatisticsRequest: MessageFns<GetAuditStatisticsRequest>;
export declare const ActionStatistic: MessageFns<ActionStatistic>;
export declare const GetAuditStatisticsResponse: MessageFns<GetAuditStatisticsResponse>;
/** 审计日志服务 */
export interface AuditService {
    /** 获取审计日志 */
    GetAuditLogs(request: GetAuditLogsRequest): Promise<GetAuditLogsResponse>;
    /** 获取审计统计信息 */
    GetAuditStatistics(request: GetAuditStatisticsRequest): Promise<GetAuditStatisticsResponse>;
}
export declare const AuditServiceServiceName = "stew.api.v1.AuditService";
export declare class AuditServiceClientImpl implements AuditService {
    private readonly rpc;
    private readonly service;
    constructor(rpc: Rpc, opts?: {
        service?: string;
    });
    GetAuditLogs(request: GetAuditLogsRequest): Promise<GetAuditLogsResponse>;
    GetAuditStatistics(request: GetAuditStatisticsRequest): Promise<GetAuditStatisticsResponse>;
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
