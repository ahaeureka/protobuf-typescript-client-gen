import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { Any } from "../../../google/protobuf/any";
export declare const protobufPackage = "stew.api.v1";
export interface Tenant {
    sub: string;
    name: string;
    tenant_id: string;
    roles: string[];
    permissions: string[];
    departments: string[];
    attributes: {
        [key: string]: Any;
    };
}
export interface Tenant_AttributesEntry {
    key: string;
    value: Any | undefined;
}
export interface ClientContext {
    ip: string;
    device: string;
    location: string;
    token: string;
    tenant: Tenant | undefined;
    ua: string;
    referer: string;
    origin: string;
    host: string;
    browser: string;
    os: string;
    country: string;
    region: string;
    additional: {
        [key: string]: Any;
    };
}
export interface ClientContext_AdditionalEntry {
    key: string;
    value: Any | undefined;
}
export declare const Tenant: MessageFns<Tenant>;
export declare const Tenant_AttributesEntry: MessageFns<Tenant_AttributesEntry>;
export declare const ClientContext: MessageFns<ClientContext>;
export declare const ClientContext_AdditionalEntry: MessageFns<ClientContext_AdditionalEntry>;
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
