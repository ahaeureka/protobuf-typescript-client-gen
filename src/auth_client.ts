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
            const token = this.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
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
     * 服务端会在回调 URL 中附加 session_id 参数: ?code=success&session_id=xxx
     * 并且会设置 HttpOnly cookie（服务端自动设置）
     * 
     * 注意：
     * - session_id 主要通过 HttpOnly Cookie 传递（更安全，服务端验证）
     * - URL 参数中的 session_id 会保存到 localStorage（仅用于客户端路由守卫判断）
     * - 实际 API 认证完全依赖 HttpOnly Cookie，不依赖 localStorage
     */
    handleLoginCallback(): { success: boolean; session_id?: string; error?: string } {
        if (!isBrowser) {
            return { success: false, error: 'Not in browser environment' };
        }

        try {
            const urlParams = new URLSearchParams((window as any).location.search);
            const code = urlParams.get('code');
            const sessionId = urlParams.get('session_id');

            if (code === 'success' && sessionId) {
                // 保存到 localStorage 用于客户端路由守卫（判断是否登录）
                // 实际 API 认证依赖服务端设置的 HttpOnly Cookie
                this.saveSessionIdForClientRouting(sessionId);
                console.log('[AuthClient] Login callback successful, session established via HttpOnly cookie');
                console.log('[AuthClient] session_id saved to localStorage for client-side routing');
                return { success: true, session_id: sessionId };
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
     * 保存 session_id 到 localStorage（仅用于客户端路由守卫）
     * 
     * 重要说明：
     * - localStorage 中的 session_id 仅用于客户端快速判断登录状态（路由守卫）
     * - 实际 API 认证完全依赖服务端设置的 HttpOnly Cookie
     * - 这样可以避免每次路由切换都调用 API 验证
     * - 安全性：即使 localStorage 被篡改，服务端仍然通过 HttpOnly Cookie 验证
     */
    private saveSessionIdForClientRouting(sessionId: string): void {
        if (!isBrowser) {
            return;
        }

        try {
            // 保存到 localStorage（用于客户端路由守卫）
            (localStorage as any).setItem('session_id', sessionId);
            // 同时保存到 sessionStorage（备份）
            (sessionStorage as any).setItem('session_id', sessionId);
            console.log('[AuthClient] Session ID saved for client-side routing guard');
        } catch (error) {
            console.error('[AuthClient] Failed to save session ID:', error);
        }
    }

    /**
     * 清除所有本地认证信息
     * 注意：HttpOnly Cookie 无法从客户端删除，必须由服务端清除
     */
    clearLocalAuth(): void {
        if (!isBrowser) {
            return;
        }

        try {
            // 清除 localStorage 中的认证信息
            (localStorage as any).removeItem('session_id');
            (localStorage as any).removeItem('token');
            (localStorage as any).removeItem('access_token');
            (localStorage as any).removeItem('refresh_token');
            (localStorage as any).removeItem('id_token');
            (localStorage as any).removeItem('user_info');

            // 清除 sessionStorage 中的认证信息
            (sessionStorage as any).removeItem('session_id');
            (sessionStorage as any).removeItem('token');
            (sessionStorage as any).removeItem('access_token');
            (sessionStorage as any).removeItem('user_info');

            // 尝试清除客户端可访问的 cookie（非 HttpOnly）
            // 注意：HttpOnly cookie 无法从客户端删除，必须由服务端通过 logout 端点清除
            const cookies = (document as any).cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                const eqPos = cookie.indexOf('=');
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

                // 只清除客户端可访问的认证相关 cookie（不包括 session_id，它是 HttpOnly 的）
                if ((name.includes('token') || name.includes('auth') || name.includes('csrf') || name.includes('nonce'))
                    && !name.includes('session')) {
                    (document as any).cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                    (document as any).cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${(window as any).location.hostname}`;
                }
            }

            console.log('[AuthClient] Local auth data cleared (session_id in HttpOnly Cookie managed by server)');
        } catch (error) {
            console.error('[AuthClient] Failed to clear local auth data:', error);
        }
    }

    /**
     * 获取当前的 session_id（用于客户端路由守卫）
     * 
     * 注意：
     * - 此方法仅用于客户端快速判断登录状态（路由守卫）
     * - 实际 API 认证依赖服务端的 HttpOnly Cookie
     * - 推荐：服务端验证使用 isAuthenticatedAsync() 或 validateSession()
     */
    getSessionId(): string | null {
        if (!isBrowser) {
            return null;
        }

        try {
            // 从 localStorage 获取（用于客户端路由守卫）
            const sessionId = (localStorage as any).getItem('session_id');
            if (sessionId) {
                return sessionId;
            }

            // 从 sessionStorage 获取（备份）
            const sessionSessionId = (sessionStorage as any).getItem('session_id');
            if (sessionSessionId) {
                return sessionSessionId;
            }
        } catch (error) {
            console.error('[AuthClient] Failed to get session ID:', error);
        }

        return null;
    }

    /**
     * 获取当前的认证 token（已废弃，仅为兼容性保留）
     * @deprecated 新架构使用 session-based 认证，不再直接暴露 token
     * 优先级：localStorage > sessionStorage > cookie
     */
    getToken(): string | null {
        if (!isBrowser) {
            return null;
        }

        try {
            // 1. 从 localStorage 获取
            const localToken = (localStorage as any).getItem('token') ||
                (localStorage as any).getItem('access_token') ||
                (localStorage as any).getItem('id_token');
            if (localToken) {
                return localToken;
            }

            // 2. 从 sessionStorage 获取
            const sessionToken = (sessionStorage as any).getItem('token') ||
                (sessionStorage as any).getItem('access_token');
            if (sessionToken) {
                return sessionToken;
            }

            // 3. 从 cookie 获取（服务端设置的）
            const cookies = (document as any).cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'token' || name === 'access_token' || name === 'id_token') {
                    return decodeURIComponent(value);
                }
            }
        } catch (error) {
            console.error('[AuthClient] Failed to get token:', error);
        }

        return null;
    }

    /**
     * 检查用户是否已登录（同步检查，用于客户端路由守卫）
     * 
     * 注意：
     * - 这是客户端快速检查，用于路由守卫和 UI 状态
     * - 检查 localStorage 中的 session_id 或 token
     * - 实际 API 认证依赖服务端的 HttpOnly Cookie
     * - 推荐：关键操作前使用 isAuthenticatedAsync() 进行服务端验证
     */
    isAuthenticated(): boolean {
        return this.getSessionId() !== null || this.getToken() !== null;
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
