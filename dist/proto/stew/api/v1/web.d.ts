import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "stew.api.v1";
export declare enum Code {
    UNKNOWN = 0,
    OK = 2000,
    /** PARAMS_ERROR - 请求参数错误 */
    PARAMS_ERROR = 4000,
    /** AUTH_ERROR - AUTH_ERROR */
    AUTH_ERROR = 4001,
    PREMISSION_DENIED = 4003,
    NOT_FOUND = 4004,
    TOKEN_NOT_FOUND = 4006,
    RESOURCE_EXHAUSTED = 4008,
    INTERNAL_ERROR = 5000,
    NOT_IMPLEMENTED = 5001,
    TIMEOUT_ERROR = 5004,
    METADATA_MISSING = 4007,
    CONFLICT = 4009,
    UNRECOGNIZED = -1
}
export declare function codeFromJSON(object: any): Code;
export declare function codeToJSON(object: Code): string;
export interface APIResponse {
    message: string;
    code: number;
    response_type: string;
    data: Uint8Array;
}
export interface HttpResponse {
    message: string;
    code: number;
    data: {
        [key: string]: any;
    } | undefined;
}
export interface EventStreamResponse {
    event: string;
    data: string;
    id: number;
    retry: number;
}
export interface RedirectResponse {
    url: string;
    code: number;
}
/** } */
export interface Errors {
    code: number;
    message: string;
    action: string;
    file: string;
    line: number;
    fn: string;
    stack: string;
    to_client_message: string;
}
export interface Headers {
    Uid: string;
    authentication: string;
    filename: string;
    token: string;
}
export interface EventStream {
    event: string;
    data: string;
    id: number;
    retry: number;
}
export declare const APIResponse: MessageFns<APIResponse>;
export declare const HttpResponse: MessageFns<HttpResponse>;
export declare const EventStreamResponse: MessageFns<EventStreamResponse>;
export declare const RedirectResponse: MessageFns<RedirectResponse>;
export declare const Errors: MessageFns<Errors>;
export declare const Headers: MessageFns<Headers>;
export declare const EventStream: MessageFns<EventStream>;
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
