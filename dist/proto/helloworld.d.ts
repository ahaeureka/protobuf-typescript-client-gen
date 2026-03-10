import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { Observable } from "rxjs";
export declare const protobufPackage = "helloworld";
export interface HelloRequest {
    msg: string;
    name: string;
}
export interface HelloReply {
    message: string;
    name: string;
}
export declare const HelloRequest: MessageFns<HelloRequest>;
export declare const HelloReply: MessageFns<HelloReply>;
export interface Greeter {
    SayHello(request: HelloRequest): Promise<HelloReply>;
    BidiStream(request: Observable<HelloRequest>): Observable<HelloReply>;
    ClientStream(request: Observable<HelloRequest>): Promise<HelloReply>;
    ServerStream(request: HelloRequest): Observable<HelloReply>;
}
export declare const GreeterServiceName = "helloworld.Greeter";
export declare class GreeterClientImpl implements Greeter {
    private readonly rpc;
    private readonly service;
    constructor(rpc: Rpc, opts?: {
        service?: string;
    });
    SayHello(request: HelloRequest): Promise<HelloReply>;
    BidiStream(request: Observable<HelloRequest>): Observable<HelloReply>;
    ClientStream(request: Observable<HelloRequest>): Promise<HelloReply>;
    ServerStream(request: HelloRequest): Observable<HelloReply>;
}
interface Rpc {
    request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
    clientStreamingRequest(service: string, method: string, data: Observable<Uint8Array>): Promise<Uint8Array>;
    serverStreamingRequest(service: string, method: string, data: Uint8Array): Observable<Uint8Array>;
    bidirectionalStreamingRequest(service: string, method: string, data: Observable<Uint8Array>): Observable<Uint8Array>;
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
