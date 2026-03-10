import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { Empty } from "./google/protobuf/empty";
import { ClientContext } from "./stew/api/v1/context";
import { RedirectResponse } from "./stew/api/v1/web";
import { User } from "./user";
export declare const protobufPackage = "stew.api.v1";
export interface OpenIDConnectCallbackRequest {
    code: string;
    state: string;
    nonce: string;
    callback: string;
    session_id: string;
}
export interface LoginRequest {
    callback: string;
}
export interface LoginCallbackResponse {
    user: User | undefined;
    token: string;
}
export interface LogoutRequest {
    callback: string;
    token: string;
    session_id: string;
}
export interface LogoutCallbackRequest {
    state: string;
    callback: string;
}
export interface AuthServiceUris {
    login_url: string;
    logout_url: string;
}
/** ===== Session Management Messages ===== */
export interface GetCurrentUserRequest {
}
export interface CurrentUserResponse {
    user: User | undefined;
    session_id: string;
    expires_at: number;
}
export interface ValidateSessionRequest {
    session_id: string;
}
export interface ValidateSessionResponse {
    valid: boolean;
    user_id: string;
    expires_at: number;
}
export interface RefreshTokenRequest {
    session_id: string;
}
export interface RefreshTokenResponse {
    access_token: string;
    expires_in: number;
}
export declare const OpenIDConnectCallbackRequest: MessageFns<OpenIDConnectCallbackRequest>;
export declare const LoginRequest: MessageFns<LoginRequest>;
export declare const LoginCallbackResponse: MessageFns<LoginCallbackResponse>;
export declare const LogoutRequest: MessageFns<LogoutRequest>;
export declare const LogoutCallbackRequest: MessageFns<LogoutCallbackRequest>;
export declare const AuthServiceUris: MessageFns<AuthServiceUris>;
export declare const GetCurrentUserRequest: MessageFns<GetCurrentUserRequest>;
export declare const CurrentUserResponse: MessageFns<CurrentUserResponse>;
export declare const ValidateSessionRequest: MessageFns<ValidateSessionRequest>;
export declare const ValidateSessionResponse: MessageFns<ValidateSessionResponse>;
export declare const RefreshTokenRequest: MessageFns<RefreshTokenRequest>;
export declare const RefreshTokenResponse: MessageFns<RefreshTokenResponse>;
export interface AuthService {
    /** OpenID Connect callback endpoint */
    Callback(request: OpenIDConnectCallbackRequest): Promise<RedirectResponse>;
    Login(request: LoginRequest): Promise<RedirectResponse>;
    Context(request: ClientContext): Promise<Empty>;
    Logout(request: LogoutRequest): Promise<RedirectResponse>;
    LogoutCallback(request: OpenIDConnectCallbackRequest): Promise<RedirectResponse>;
    /** 获取当前登录用户信息（基于 session_id） */
    GetCurrentUser(request: GetCurrentUserRequest): Promise<CurrentUserResponse>;
    /** 验证 Session 有效性 */
    ValidateSession(request: ValidateSessionRequest): Promise<ValidateSessionResponse>;
    /** 刷新 Access Token */
    RefreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse>;
}
export declare const AuthServiceServiceName = "stew.api.v1.AuthService";
export declare class AuthServiceClientImpl implements AuthService {
    private readonly rpc;
    private readonly service;
    constructor(rpc: Rpc, opts?: {
        service?: string;
    });
    Callback(request: OpenIDConnectCallbackRequest): Promise<RedirectResponse>;
    Login(request: LoginRequest): Promise<RedirectResponse>;
    Context(request: ClientContext): Promise<Empty>;
    Logout(request: LogoutRequest): Promise<RedirectResponse>;
    LogoutCallback(request: OpenIDConnectCallbackRequest): Promise<RedirectResponse>;
    GetCurrentUser(request: GetCurrentUserRequest): Promise<CurrentUserResponse>;
    ValidateSession(request: ValidateSessionRequest): Promise<ValidateSessionResponse>;
    RefreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse>;
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
