import axios, { AxiosInstance } from 'axios';
import { HttpResponse } from './proto/stew/api/v1/web';
import { User } from './proto/user';

// 浏览器环境检查
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

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
    private gwBaseUrl: string;
    private loginCallbackUrl: string;
    private logoutCallbackUrl: string;
    private axiosInstance: AxiosInstance;

    constructor(
        gwBaseUrl: string,
        loginCallbackUrl: string,
        logoutCallbackUrl: string
    ) {
        this.gwBaseUrl = gwBaseUrl;
        this.loginCallbackUrl = loginCallbackUrl;
        this.logoutCallbackUrl = logoutCallbackUrl;
        this.axiosInstance = axios.create({
            baseURL: this.gwBaseUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true // 重要：支持跨域 cookie
        });

        // 添加请求拦截器自动添加认证头
        this.axiosInstance.interceptors.request.use((config: any) => {
            return config;
        });
    }

    /**
     * 发起登录流程
     * 服务端会返回 302 重定向到 OIDC provider
     */
    async login(): Promise<void> {
        if (!isBrowser) {
            throw new Error('Login method requires browser environment');
        }

        // 构造登录 URL，callback 参数告诉服务端登录成功后跳转到哪里
        const loginUrl = `${this.gwBaseUrl}/auth/login?callback=${encodeURIComponent(this.loginCallbackUrl)}`;

        console.log('[AuthClient] Redirecting to login URL:', loginUrl);
        (window as any).location.href = loginUrl;
    }

    /**
     * 处理登录回调
     * 服务端会设置 HttpOnly cookie，并在回调 URL 中附加 code=success
     */
    handleLoginCallback(): { success: boolean; error?: string } {
        if (!isBrowser) {
            return { success: false, error: 'Not in browser environment' };
        }

        try {
            const urlParams = new URLSearchParams((window as any).location.search);
            const code = urlParams.get('code');

            if (code === 'success') {
                console.log('[AuthClient] Login callback successful, session established via HttpOnly cookie');
                return { success: true };
            } else {
                const error = urlParams.get('error') || 'Unknown error';
                console.error('[AuthClient] Login callback failed:', error);
                return { success: false, error };
            }
        } catch (error) {
            console.error('[AuthClient] Failed to handle login callback:', error);
            return { success: false, error: String(error) };
        }
    }

    /**
     * 获取当前登录用户信息（基于 session）
     * 推荐：使用这个方法获取当前用户，自动通过 session cookie 认证
     */
    async getCurrentUser(): Promise<{ user: User; session_id: string; expires_at: number }> {
        try {
            const response = await this.axiosInstance.get('/auth/me');
            const data = response.data;

            return {
                user: User.fromJSON(data.user),
                session_id: data.session_id,
                expires_at: data.expires_at
            };
        } catch (error: any) {
            console.error('[AuthClient] Failed to get current user:', error);
            throw new Error(error.response?.data?.message || 'Failed to get current user');
        }
    }

    /**
     * 获取用户信息（需要先登录）
     * @deprecated 推荐使用 getCurrentUser() 方法
     */
    async getUserInfo(): Promise<User> {
        const response = await this.axiosInstance.get<HttpResponse>('/auth/user');
        const data = response.data.data;
        return User.fromJSON(data);
    }

    /**
     * 更新当前用户信息
     * 需要配置用户管理提供者（Casdoor）才能使用
     * @param updateRequest 用户更新请求
     * @returns 更新后的用户信息
     */
    async updateUser(updateRequest: UpdateUserRequest): Promise<User> {
        try {
            const response = await this.axiosInstance.put<HttpResponse>('/auth/user', updateRequest);
            const data = response.data.data;
            return User.fromJSON(data);
        } catch (error: any) {
            console.error('[AuthClient] Failed to update user:', error);
            if (error.response?.status === 501) {
                throw new Error('用户管理提供者未配置，无法更新用户信息');
            }
            throw new Error(error.response?.data?.message || 'Failed to update user');
        }
    }

    /**
     * 上传并更新用户头像
     * 需要配置用户管理提供者（Casdoor）才能使用
     * @param request 上传头像请求
     * @returns 更新后的头像 URL
     */
    async uploadAvatar(request: UploadAvatarRequest): Promise<UploadAvatarResponse> {
        try {
            const formData = new FormData();
            formData.append('avatar_data', request.file);
            if (request.filename) {
                formData.append('filename', request.filename);
            }

            const response = await this.axiosInstance.post<{ data: UploadAvatarResponse }>(
                '/auth/user/avatar',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            return response.data.data;
        } catch (error: any) {
            console.error('[AuthClient] Failed to upload avatar:', error);
            if (error.response?.status === 501) {
                throw new Error('用户管理提供者未配置，无法上传头像');
            }
            throw new Error(error.response?.data?.message || 'Failed to upload avatar');
        }
    }

    /**
     * 验证当前 session 是否有效
     * 返回 session 的有效性、用户 ID 和过期时间
     * 
     * 注意：不需要传递 session_id，服务端通过 HttpOnly Cookie 自动识别
     */
    async validateSession(): Promise<{ valid: boolean; user_id?: string; expires_at?: number }> {
        try {
            // 不传递 session_id，让服务端从 Cookie 中读取
            const response = await this.axiosInstance.post('/auth/session/validate', {});
            const data = response.data;

            return {
                valid: data.valid,
                user_id: data.user_id,
                expires_at: data.expires_at
            };
        } catch (error: any) {
            console.error('[AuthClient] Failed to validate session:', error);
            // 验证失败默认返回 invalid
            return { valid: false };
        }
    }

    /**
     * 刷新 access token
     * 使用当前 session 的 refresh_token 获取新的 access_token
     * 
     * 注意：
     * - token 存储在服务端 session 中，客户端无感知
     * - 不需要传递 session_id，服务端通过 HttpOnly Cookie 自动识别
     */
    async refreshToken(): Promise<{ access_token: string; expires_in: number }> {
        try {
            // 不传递 session_id，让服务端从 Cookie 中读取
            const response = await this.axiosInstance.post('/auth/token/refresh', {});
            const data = response.data;

            return {
                access_token: data.access_token,
                expires_in: data.expires_in
            };
        } catch (error: any) {
            console.error('[AuthClient] Failed to refresh token:', error);
            throw new Error(error.response?.data?.message || 'Failed to refresh token');
        }
    }

    /**
     * 发起登出流程
     * 服务端会清除 session 并返回 302 重定向到 OIDC provider 的登出端点
     */
    async logout(): Promise<void> {
        if (!isBrowser) {
            throw new Error('Logout method requires browser environment');
        }

        // 构造登出 URL（不需要传递 token，服务端通过 HttpOnly cookie 识别 session）
        const logoutUrl = `${this.gwBaseUrl}/auth/logout?callback=${encodeURIComponent(this.logoutCallbackUrl)}`;

        console.log('[AuthClient] Redirecting to logout URL');

        // 清理本地认证数据
        this.clearLocalAuth();

        // 重定向到服务端的登出端点
        (window as any).location.href = logoutUrl;
    }

    /**
     * 清除所有本地认证信息
     * Cookie-only mode: HttpOnly session cookie is managed by server via /auth/logout.
     * Client only performs minimal cleanup.
     */
    clearLocalAuth(): void {
        if (!isBrowser) {
            return;
        }
        console.log('[AuthClient] Local auth data cleared (session managed by server HttpOnly cookie)');
    }

    /**
     * 纯 HttpOnly Cookie 模式下，客户端不再读取 session_id
     */
    getSessionId(): string | null {
        return null;
    }

    /**
     * 获取当前的认证 token（已废弃，仅为兼容性保留）
     * @deprecated 纯 HttpOnly Cookie 模式下客户端不再直接读取 token
     */
    getToken(): string | null {
        return null;
    }

    /**
     * 检查用户是否已登录（同步检查，用于客户端路由守卫）
     * 
     * 注意：
     * - 这是客户端快速检查，用于路由守卫和 UI 状态
     * - 纯 HttpOnly Cookie 模式下，同步检查不可靠
     * - 推荐：使用 isAuthenticatedAsync() 进行服务端验证
     */
    isAuthenticated(): boolean {
        return false;
    }

    /**
     * 异步检查用户是否已登录（服务端验证）
     * 通过调用 validateSession API 进行真实的 session 验证
     * 
     * 推荐：
     * - 应用启动时使用此方法验证登录状态
     * - 关键操作前使用此方法确认认证有效
     * - 这是检查 HttpOnly Cookie 认证状态的唯一可靠方式
     */
    async isAuthenticatedAsync(): Promise<boolean> {
        try {
            const result = await this.validateSession();
            return result.valid;
        } catch (error) {
            console.error('[AuthClient] Failed to check authentication status:', error);
            return false;
        }
    }

    /**
     * 检查 token 是否有效（已废弃，仅为兼容性保留）
     * @deprecated 新架构使用 session-based 认证，token 不暴露给客户端
     */
    isTokenValid(): boolean {
        const token = this.getToken();
        if (!token) {
            return false;
        }

        try {
            // 解析 JWT token（格式：header.payload.signature）
            const parts = token.split('.');
            if (parts.length !== 3) {
                return false;
            }

            // 解码 payload
            const payload = JSON.parse(atob(parts[1]));

            // 检查过期时间
            if (payload.exp) {
                const now = Math.floor(Date.now() / 1000);
                return payload.exp > now;
            }

            // 如果没有过期时间，默认认为有效
            return true;
        } catch (error) {
            console.error('[AuthClient] Failed to validate token:', error);
            return false;
        }
    }
}
