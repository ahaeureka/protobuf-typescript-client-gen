import { User } from './proto/user';
/**
 * 用户更新请求
 */
export interface UpdateUserRequest {
    displayName?: string;
    preferredUsername?: string;
    locale?: string;
    zoneinfo?: string;
    website?: string;
    picture?: string;
    givenName?: string;
    familyName?: string;
    nickname?: string;
    gender?: string;
    birthdate?: string;
}
/**
 * 上传头像请求
 */
export interface UploadAvatarRequest {
    file: File | Blob;
    filename?: string;
}
/**
 * 上传头像响应
 */
export interface UploadAvatarResponse {
    avatarUrl: string;
}
export default class AuthServiceClient {
    private gwBaseUrl;
    private loginCallbackUrl;
    private logoutCallbackUrl;
    private axiosInstance;
    constructor(gwBaseUrl: string, loginCallbackUrl: string, logoutCallbackUrl: string);
    /**
     * 发起登录流程
     * 服务端会返回 302 重定向到 OIDC provider
     */
    login(): Promise<void>;
    /**
     * Handle the login callback page.
     *
     * Expected flow:
     *   OIDC Provider --[code+state]--> Gateway /auth/callback
     *     --> token exchange, session creation, set-cookie
     *     --> 302 to frontend callback with ?code=success
     *
     * If the OIDC provider's redirect_uri accidentally points at the frontend
     * instead of the gateway, the raw authorization code arrives here. In that
     * case this method transparently redirects to the gateway so the token
     * exchange can still complete. Callers should check `redirecting` in the
     * return value and avoid treating it as an error.
     *
     * @returns {{ success: boolean; redirecting?: boolean; error?: string }}
     */
    handleLoginCallback(): {
        success: boolean;
        redirecting?: boolean;
        error?: string;
    };
    /**
     * 获取当前登录用户信息（基于 session）
     * 推荐：使用这个方法获取当前用户，自动通过 session cookie 认证
     */
    getCurrentUser(): Promise<{
        user: User;
        session_id: string;
        expires_at: number;
    }>;
    /**
     * 获取用户信息（需要先登录）
     * @deprecated 推荐使用 getCurrentUser() 方法
     */
    getUserInfo(): Promise<User>;
    /**
     * 更新当前用户信息
     * 需要配置用户管理提供者（Casdoor）才能使用
     * @param updateRequest 用户更新请求
     * @returns 更新后的用户信息
     */
    updateUser(updateRequest: UpdateUserRequest): Promise<User>;
    /**
     * 上传并更新用户头像
     * 需要配置用户管理提供者（Casdoor）才能使用
     * @param request 上传头像请求
     * @returns 更新后的头像 URL
     */
    uploadAvatar(request: UploadAvatarRequest): Promise<UploadAvatarResponse>;
    /**
     * 验证当前 session 是否有效
     * 返回 session 的有效性、用户 ID 和过期时间
     *
     * 注意：不需要传递 session_id，服务端通过 HttpOnly Cookie 自动识别
     */
    validateSession(): Promise<{
        valid: boolean;
        user_id?: string;
        expires_at?: number;
    }>;
    /**
     * 刷新 access token
     * 使用当前 session 的 refresh_token 获取新的 access_token
     *
     * 注意：
     * - token 存储在服务端 session 中，客户端无感知
     * - 不需要传递 session_id，服务端通过 HttpOnly Cookie 自动识别
     */
    refreshToken(): Promise<{
        access_token: string;
        expires_in: number;
    }>;
    /**
     * 发起登出流程
     * 服务端会清除 session 并返回 302 重定向到 OIDC provider 的登出端点
     */
    logout(): Promise<void>;
    /**
     * 清除所有本地认证信息
     * Cookie-only mode: HttpOnly session cookie is managed by server via /auth/logout.
     * Client only performs minimal cleanup.
     */
    clearLocalAuth(): void;
    /**
     * 纯 HttpOnly Cookie 模式下，客户端不再读取 session_id
     */
    getSessionId(): string | null;
    /**
     * 获取当前的认证 token（已废弃，仅为兼容性保留）
     * @deprecated 纯 HttpOnly Cookie 模式下客户端不再直接读取 token
     */
    getToken(): string | null;
    /**
     * 检查用户是否已登录（同步检查，用于客户端路由守卫）
     *
     * 注意：
     * - 这是客户端快速检查，用于路由守卫和 UI 状态
     * - 纯 HttpOnly Cookie 模式下，同步检查不可靠
     * - 推荐：使用 isAuthenticatedAsync() 进行服务端验证
     */
    isAuthenticated(): boolean;
    /**
     * 异步检查用户是否已登录（服务端验证）
     * 通过调用 validateSession API 进行真实的 session 验证
     *
     * 推荐：
     * - 应用启动时使用此方法验证登录状态
     * - 关键操作前使用此方法确认认证有效
     * - 这是检查 HttpOnly Cookie 认证状态的唯一可靠方式
     */
    isAuthenticatedAsync(): Promise<boolean>;
    /**
     * 检查 token 是否有效（已废弃，仅为兼容性保留）
     * @deprecated 新架构使用 session-based 认证，token 不暴露给客户端
     */
    isTokenValid(): boolean;
}
