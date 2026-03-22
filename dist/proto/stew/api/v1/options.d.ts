import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "stew.api.v1";
/**
 * AI Guard field semantic annotations.
 * Service owners annotate their proto fields so that the gateway can
 * automatically extract user messages, model name, and max_tokens
 * without any runtime path configuration.
 */
export interface AiGuardFieldOptions {
    /** The field is a messages array (conversation history) */
    is_messages_array: boolean;
    /** The field is the role identifier within a message (e.g. "role") */
    is_role_field: boolean;
    /** The field is the text content within a message (e.g. "content") */
    is_content_field: boolean;
    /** Only extract content when the role field equals this value (empty = all) */
    role_filter: string;
    /** The field is a single prompt string (non-chat format) */
    is_prompt: boolean;
    /** The field is the model name */
    is_model: boolean;
    /** The field is the max_tokens hint */
    is_max_tokens: boolean;
}
export declare const AiGuardFieldOptions: MessageFns<AiGuardFieldOptions>;
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
