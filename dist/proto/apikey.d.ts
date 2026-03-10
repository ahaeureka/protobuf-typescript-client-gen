import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { Empty } from "./google/protobuf/empty";
export declare const protobufPackage = "stew.api.v1";
/** API Key 信息 */
export interface ApiKey {
    id: string;
    name: string;
    key: string;
    user_id: string;
    description: string;
    scopes: string[];
    created_at: Date | undefined;
    expires_at: Date | undefined;
    last_used_at: Date | undefined;
    is_active: boolean;
    metadata: {
        [key: string]: string;
    };
}
export interface ApiKey_MetadataEntry {
    key: string;
    value: string;
}
/** 创建 API Key 请求 */
export interface CreateApiKeyRequest {
    name: string;
    user_id: string;
    scopes: string[];
    expires_at: Date | undefined;
    metadata: {
        [key: string]: string;
    };
    description: string;
}
export interface CreateApiKeyRequest_MetadataEntry {
    key: string;
    value: string;
}
/** 创建 API Key 响应 */
export interface CreateApiKeyResponse {
    api_key: ApiKey | undefined;
    raw_key: string;
}
/** 列出 API Keys 请求 */
export interface ListApiKeysRequest {
    user_id: string;
    page: number;
    limit: number;
    include_inactive: boolean;
}
/** 列出 API Keys 响应 */
export interface ListApiKeysResponse {
    api_keys: ApiKey[];
    total: number;
    page: number;
    limit: number;
}
/** 获取 API Key 请求 */
export interface GetApiKeyRequest {
    id: string;
}
/** 更新 API Key 请求 */
export interface UpdateApiKeyRequest {
    id: string;
    name: string;
    scopes: string[];
    expires_at: Date | undefined;
    is_active: boolean;
    metadata: {
        [key: string]: string;
    };
}
export interface UpdateApiKeyRequest_MetadataEntry {
    key: string;
    value: string;
}
/** 删除 API Key 请求 */
export interface DeleteApiKeyRequest {
    id: string;
}
/** 验证 API Key 请求 */
export interface ValidateApiKeyRequest {
    api_key: string;
    required_scopes: string[];
}
/** 验证 API Key 响应 */
export interface ValidateApiKeyResponse {
    is_valid: boolean;
    api_key: ApiKey | undefined;
    error_message: string;
}
/** 轮换 API Key 请求 */
export interface RotateApiKeyRequest {
    id: string;
}
/** 轮换 API Key 响应 */
export interface RotateApiKeyResponse {
    api_key: ApiKey | undefined;
    raw_key: string;
}
export declare const ApiKey: MessageFns<ApiKey>;
export declare const ApiKey_MetadataEntry: MessageFns<ApiKey_MetadataEntry>;
export declare const CreateApiKeyRequest: MessageFns<CreateApiKeyRequest>;
export declare const CreateApiKeyRequest_MetadataEntry: MessageFns<CreateApiKeyRequest_MetadataEntry>;
export declare const CreateApiKeyResponse: MessageFns<CreateApiKeyResponse>;
export declare const ListApiKeysRequest: MessageFns<ListApiKeysRequest>;
export declare const ListApiKeysResponse: MessageFns<ListApiKeysResponse>;
export declare const GetApiKeyRequest: MessageFns<GetApiKeyRequest>;
export declare const UpdateApiKeyRequest: MessageFns<UpdateApiKeyRequest>;
export declare const UpdateApiKeyRequest_MetadataEntry: MessageFns<UpdateApiKeyRequest_MetadataEntry>;
export declare const DeleteApiKeyRequest: MessageFns<DeleteApiKeyRequest>;
export declare const ValidateApiKeyRequest: MessageFns<ValidateApiKeyRequest>;
export declare const ValidateApiKeyResponse: MessageFns<ValidateApiKeyResponse>;
export declare const RotateApiKeyRequest: MessageFns<RotateApiKeyRequest>;
export declare const RotateApiKeyResponse: MessageFns<RotateApiKeyResponse>;
/** API Key 管理服务 */
export interface ApiKeyService {
    /** 创建新的 API Key */
    CreateApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse>;
    /** 列出 API Keys */
    ListApiKeys(request: ListApiKeysRequest): Promise<ListApiKeysResponse>;
    /** 获取单个 API Key */
    GetApiKey(request: GetApiKeyRequest): Promise<ApiKey>;
    /** 更新 API Key */
    UpdateApiKey(request: UpdateApiKeyRequest): Promise<ApiKey>;
    /** 删除 API Key */
    DeleteApiKey(request: DeleteApiKeyRequest): Promise<Empty>;
    /** 验证 API Key */
    ValidateApiKey(request: ValidateApiKeyRequest): Promise<ValidateApiKeyResponse>;
    /** 轮换 API Key（生成新密钥值，停用旧密钥） */
    RotateApiKey(request: RotateApiKeyRequest): Promise<RotateApiKeyResponse>;
}
export declare const ApiKeyServiceServiceName = "stew.api.v1.ApiKeyService";
export declare class ApiKeyServiceClientImpl implements ApiKeyService {
    private readonly rpc;
    private readonly service;
    constructor(rpc: Rpc, opts?: {
        service?: string;
    });
    CreateApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse>;
    ListApiKeys(request: ListApiKeysRequest): Promise<ListApiKeysResponse>;
    GetApiKey(request: GetApiKeyRequest): Promise<ApiKey>;
    UpdateApiKey(request: UpdateApiKeyRequest): Promise<ApiKey>;
    DeleteApiKey(request: DeleteApiKeyRequest): Promise<Empty>;
    ValidateApiKey(request: ValidateApiKeyRequest): Promise<ValidateApiKeyResponse>;
    RotateApiKey(request: RotateApiKeyRequest): Promise<RotateApiKeyResponse>;
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
