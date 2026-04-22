import { AnonymousSessionResponse, CurrentUserResponse, DeviceFingerprintRequest, GetCurrentUserRequest, LoginRequest, OpenIDConnectCallbackRequest, RefreshTokenRequest, RefreshTokenResponse, ValidateSessionRequest, ValidateSessionResponse } from './authentication';
import { RedirectResponse } from './stew/api/v1/web';
import { ClientContext } from './stew/api/v1/context';
import { Empty } from './google/protobuf/empty';
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
    callback(request: OpenIDConnectCallbackRequest, headers?: Record<string, string>): Promise<RedirectResponse>;
    login(request: LoginRequest, headers?: Record<string, string>): Promise<RedirectResponse>;
    context(request: ClientContext, headers?: Record<string, string>): Promise<Empty>;
    logout_callback(request: OpenIDConnectCallbackRequest, headers?: Record<string, string>): Promise<RedirectResponse>;
    get_current_user(request: GetCurrentUserRequest, headers?: Record<string, string>): Promise<CurrentUserResponse>;
    validate_session(request: ValidateSessionRequest, headers?: Record<string, string>): Promise<ValidateSessionResponse>;
    refresh_token(request: RefreshTokenRequest, headers?: Record<string, string>): Promise<RefreshTokenResponse>;
    create_anonymous_session(request: DeviceFingerprintRequest, headers?: Record<string, string>): Promise<AnonymousSessionResponse>;
}
