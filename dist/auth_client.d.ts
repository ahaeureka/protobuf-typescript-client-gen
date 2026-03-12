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
     * 处理登录回调
     * 服务端会在回调 URL 中附加 session_id 参数: ?code=success&session_id=xxx
     * 并且会设置 HttpOnly cookie（服务端自动设置）
     *
     * 注意：
     * - session_id 主要通过 HttpOnly Cookie 传递（更安全，服务端验证）
     * - URL 参数中的 session_id 会保存到 localStorage（仅用于客户端路由守卫判断）
     * - 实际 API 认证完全依赖 HttpOnly Cookie，不依赖 localStorage
     */
    handleLoginCallback(): {
        success: boolean;
        session_id?: string;
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
     * 保存 session_id 到 localStorage（仅用于客户端路由守卫）
     *
     * 重要说明：
     * - localStorage 中的 session_id 仅用于客户端快速判断登录状态（路由守卫）
     * - 实际 API 认证完全依赖服务端设置的 HttpOnly Cookie
     * - 这样可以避免每次路由切换都调用 API 验证
     * - 安全性：即使 localStorage 被篡改，服务端仍然通过 HttpOnly Cookie 验证
     */
    private saveSessionIdForClientRouting;
    /**
     * 清除所有本地认证信息
     * 注意：HttpOnly Cookie 无法从客户端删除，必须由服务端清除
     */
    clearLocalAuth(): void;
    /**
     * 获取当前的 session_id（用于客户端路由守卫）
     *
     * 注意：
     * - 此方法仅用于客户端快速判断登录状态（路由守卫）
     * - 实际 API 认证依赖服务端的 HttpOnly Cookie
     * - 推荐：服务端验证使用 isAuthenticatedAsync() 或 validateSession()
     */
    getSessionId(): string | null;
    /**
     * 获取当前的认证 token（已废弃，仅为兼容性保留）
     * @deprecated 新架构使用 session-based 认证，不再直接暴露 token
     * 优先级：localStorage > sessionStorage > cookie
     */
    getToken(): string | null;
    /**
     * 检查用户是否已登录（同步检查，用于客户端路由守卫）
     *
     * 注意：
     * - 这是客户端快速检查，用于路由守卫和 UI 状态
     * - 检查 localStorage 中的 session_id 或 token
     * - 实际 API 认证依赖服务端的 HttpOnly Cookie
     * - 推荐：关键操作前使用 isAuthenticatedAsync() 进行服务端验证
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
