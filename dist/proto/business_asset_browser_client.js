"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.V1Client = void 0;
/**
 * Auto-generated Axios TypeScript client
 * Generated from protobuf definitions
 */
const axios_1 = __importDefault(require("axios"));
// Import all required models
const business_asset_browser_1 = require("./business_asset_browser");
const empty_1 = require("./google/protobuf/empty");
const httpbody_1 = require("./google/api/httpbody");
/**
 * Convert Uint8Array to Base64 string
 */
function uint8ArrayToBase64(bytes) {
    if (typeof window !== 'undefined' && window.btoa) {
        // Browser environment
        const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
        return window.btoa(binary);
    }
    else {
        // Node.js environment
        return Buffer.from(bytes).toString('base64');
    }
}
/**
 * Recursively convert all Uint8Array fields to Base64 strings in request object
 */
function preprocessRequest(obj) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Uint8Array) {
        return uint8ArrayToBase64(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => preprocessRequest(item));
    }
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = preprocessRequest(value);
    }
    return result;
}
/**
 * Type guard to check if a value is an APIResponse structure
 */
function isAPIResponse(data) {
    return (data !== null &&
        typeof data === 'object' &&
        typeof data.code === 'number' &&
        'data' in data &&
        'message' in data);
}
class V1Client {
    constructor(config) {
        this.accessToken = null;
        this.tokenExpiry = null;
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true, // 允许发送 Cookie
        });
        // Add request interceptor for authentication
        this.client.interceptors.request.use(async (config) => {
            // 处理 Session-based 认证
            this.ensureSessionCookie();
            // 处理 Bearer token 认证
            this.accessToken = this.getToken();
            if (this.accessToken) {
                config.headers.Authorization = `Bearer ${this.accessToken}`;
            }
            return config;
        });
        // Add response interceptor to handle authentication failures
        this.client.interceptors.response.use((response) => response, (error) => {
            // Check for authentication errors (401 Unauthorized)
            if (error.response && error.response.status === 401) {
                this.clearAuthState();
            }
            return Promise.reject(error);
        });
    }
    /**
     * 手动登出 - 清除所有认证状态
     * 公共方法，允许用户主动调用
     */
    logout() {
        this.clearAuthState();
    }
    /**
     * 清除所有认证状态
     * 当认证失败时调用，清除 localStorage、sessionStorage 和所有 Cookie
     */
    clearAuthState() {
        // 仅在浏览器环境中执行
        if (typeof window === 'undefined') {
            return;
        }
        try {
            // 清除 localStorage 中的认证相关信息
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('session_id');
                localStorage.removeItem('token');
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                console.debug('[Auth] Cleared localStorage auth data');
            }
            // 清除 sessionStorage 中的认证相关信息
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('session_id');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('access_token');
                sessionStorage.removeItem('refresh_token');
                console.debug('[Auth] Cleared sessionStorage auth data');
            }
            // 清除所有 Cookie
            if (typeof document !== 'undefined' && document.cookie) {
                const cookies = document.cookie.split(';');
                for (let cookie of cookies) {
                    const [name] = cookie.trim().split('=');
                    if (name) {
                        // 删除 Cookie（设置过期时间为过去）
                        // 尝试多种路径和域组合以确保删除
                        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
                        // 如果域名有子域，尝试删除父域的 Cookie
                        const hostnameParts = window.location.hostname.split('.');
                        if (hostnameParts.length > 2) {
                            const parentDomain = hostnameParts.slice(-2).join('.');
                            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${parentDomain};`;
                        }
                    }
                }
                console.debug('[Auth] Cleared all cookies');
            }
            // 清除当前实例的 token
            this.accessToken = null;
            this.tokenExpiry = null;
            console.warn('[Auth] Authentication failed - all auth state cleared');
        }
        catch (error) {
            console.error('[Auth] Failed to clear auth state:', error);
        }
    }
    /**
     * 确保 session_id Cookie 已设置
     * 从 localStorage 读取 session_id，如果存在则设置到 Cookie
     */
    ensureSessionCookie() {
        // 仅在浏览器环境中执行
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
        }
        try {
            // 从 localStorage 读取 session_id
            const sessionId = localStorage.getItem('session_id');
            if (sessionId) {
                // 检查 Cookie 中是否已存在 session_id
                const cookies = document.cookie.split(';');
                const hasSessionCookie = cookies.some(cookie => {
                    const [name] = cookie.trim().split('=');
                    return name === 'session_id';
                });
                // 如果 Cookie 中没有 session_id，则设置它
                if (!hasSessionCookie) {
                    // 设置 Cookie（路径为 /，SameSite=Lax 以支持跨页面导航）
                    document.cookie = `session_id=${sessionId}; path=/; SameSite=Lax`;
                    console.debug('[Auth] Set session_id cookie from localStorage');
                }
            }
        }
        catch (error) {
            console.warn('[Auth] Failed to sync session_id to cookie:', error);
        }
    }
    /**
     * 从 localStorage/Cookie 获取 session_id
     */
    getSessionId() {
        // 检查浏览器环境
        if (typeof window !== 'undefined') {
            // 优先从 localStorage 获取
            if (typeof localStorage !== 'undefined') {
                const sessionId = localStorage.getItem('session_id');
                if (sessionId) {
                    return sessionId;
                }
            }
            // 从 Cookie 获取作为后备
            if (typeof document !== 'undefined' && document.cookie) {
                const cookies = document.cookie.split(';');
                for (let cookie of cookies) {
                    const [name, value] = cookie.trim().split('=');
                    if (name === 'session_id') {
                        return decodeURIComponent(value);
                    }
                }
            }
        }
        return null;
    }
    getToken() {
        // Check if we're in a browser environment
        if (typeof window !== 'undefined') {
            // Browser environment - use localStorage, sessionStorage, and cookies
            // 从localStorage获取token
            if (typeof localStorage !== 'undefined') {
                const token = localStorage.getItem('token') || localStorage.getItem('access_token');
                if (token) {
                    return token;
                }
            }
            // 从sessionStorage获取token
            if (typeof sessionStorage !== 'undefined') {
                const sessionToken = sessionStorage.getItem('token') || sessionStorage.getItem('access_token');
                if (sessionToken) {
                    return sessionToken;
                }
            }
            // 从cookie获取token（如果使用cookie存储）
            if (typeof document !== 'undefined' && document.cookie) {
                const cookies = document.cookie.split(';');
                for (let cookie of cookies) {
                    const [name, value] = cookie.trim().split('=');
                    if (name === 'token' || name === 'access_token') {
                        return decodeURIComponent(value);
                    }
                }
            }
        }
        else if (typeof process !== 'undefined' && process.env) {
            // Node.js environment - try to get token from environment variables
            return process.env.ACCESS_TOKEN || process.env.TOKEN || null;
        }
        return null;
    }
    async getAuthHeaders() {
        this.accessToken = this.getToken();
        return this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {};
    }
    // BusinessAssetBrowserService methods
    async list_asset_collections(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // GET/DELETE/HEAD/OPTIONS: pass params in config object
        const response = await this.client.get(url, {
            params: processedRequest,
            headers: requestHeaders
        });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return business_asset_browser_1.ListAssetCollectionsResponse.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as ListAssetCollectionsResponse:', userData);
                return business_asset_browser_1.ListAssetCollectionsResponse.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as ListAssetCollectionsResponse:', response.data);
            return business_asset_browser_1.ListAssetCollectionsResponse.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as ListAssetCollectionsResponse (non-wrapped):', response.data);
        return business_asset_browser_1.ListAssetCollectionsResponse.fromJSON(response.data);
    }
    async get_asset_collection(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets/{asset_space}/{asset_id}`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // GET/DELETE/HEAD/OPTIONS: pass params in config object
        const response = await this.client.get(url, {
            params: processedRequest,
            headers: requestHeaders
        });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return business_asset_browser_1.AssetCollection.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as AssetCollection:', userData);
                return business_asset_browser_1.AssetCollection.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as AssetCollection:', response.data);
            return business_asset_browser_1.AssetCollection.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as AssetCollection (non-wrapped):', response.data);
        return business_asset_browser_1.AssetCollection.fromJSON(response.data);
    }
    async list_asset_tree(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets/{asset_space}/{asset_id}/tree`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // GET/DELETE/HEAD/OPTIONS: pass params in config object
        const response = await this.client.get(url, {
            params: processedRequest,
            headers: requestHeaders
        });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return business_asset_browser_1.ListAssetTreeResponse.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as ListAssetTreeResponse:', userData);
                return business_asset_browser_1.ListAssetTreeResponse.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as ListAssetTreeResponse:', response.data);
            return business_asset_browser_1.ListAssetTreeResponse.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as ListAssetTreeResponse (non-wrapped):', response.data);
        return business_asset_browser_1.ListAssetTreeResponse.fromJSON(response.data);
    }
    async list_asset_versions(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets/{asset_space}/{asset_id}/versions`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // GET/DELETE/HEAD/OPTIONS: pass params in config object
        const response = await this.client.get(url, {
            params: processedRequest,
            headers: requestHeaders
        });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return business_asset_browser_1.ListAssetVersionsResponse.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as ListAssetVersionsResponse:', userData);
                return business_asset_browser_1.ListAssetVersionsResponse.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as ListAssetVersionsResponse:', response.data);
            return business_asset_browser_1.ListAssetVersionsResponse.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as ListAssetVersionsResponse (non-wrapped):', response.data);
        return business_asset_browser_1.ListAssetVersionsResponse.fromJSON(response.data);
    }
    async get_asset_version(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets/{asset_space}/{asset_id}/versions/{version_id}`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // GET/DELETE/HEAD/OPTIONS: pass params in config object
        const response = await this.client.get(url, {
            params: processedRequest,
            headers: requestHeaders
        });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return business_asset_browser_1.GetAssetVersionResponse.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as GetAssetVersionResponse:', userData);
                return business_asset_browser_1.GetAssetVersionResponse.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as GetAssetVersionResponse:', response.data);
            return business_asset_browser_1.GetAssetVersionResponse.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as GetAssetVersionResponse (non-wrapped):', response.data);
        return business_asset_browser_1.GetAssetVersionResponse.fromJSON(response.data);
    }
    async create_draft_version(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets/{asset_space}/{asset_id}:createDraft`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // POST/PUT/PATCH: pass data as second parameter
        //     // v1.0.1
        const response = await this.client.post(url, processedRequest, { headers: requestHeaders });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return business_asset_browser_1.CreateDraftVersionResponse.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as CreateDraftVersionResponse:', userData);
                return business_asset_browser_1.CreateDraftVersionResponse.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as CreateDraftVersionResponse:', response.data);
            return business_asset_browser_1.CreateDraftVersionResponse.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as CreateDraftVersionResponse (non-wrapped):', response.data);
        return business_asset_browser_1.CreateDraftVersionResponse.fromJSON(response.data);
    }
    async discard_draft_version(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets/{asset_space}/{asset_id}:discardDraft`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // POST/PUT/PATCH: pass data as second parameter
        //     // v1.0.1
        const response = await this.client.post(url, processedRequest, { headers: requestHeaders });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return empty_1.Empty.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as Empty:', userData);
                return empty_1.Empty.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as Empty:', response.data);
            return empty_1.Empty.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as Empty (non-wrapped):', response.data);
        return empty_1.Empty.fromJSON(response.data);
    }
    async get_asset_entry_text(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets/{asset_space}/{asset_id}:getEntryText`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // POST/PUT/PATCH: pass data as second parameter
        //     // v1.0.1
        const response = await this.client.post(url, processedRequest, { headers: requestHeaders });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return business_asset_browser_1.GetAssetEntryTextResponse.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as GetAssetEntryTextResponse:', userData);
                return business_asset_browser_1.GetAssetEntryTextResponse.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as GetAssetEntryTextResponse:', response.data);
            return business_asset_browser_1.GetAssetEntryTextResponse.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as GetAssetEntryTextResponse (non-wrapped):', response.data);
        return business_asset_browser_1.GetAssetEntryTextResponse.fromJSON(response.data);
    }
    async update_draft_text_entry(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets/{asset_space}/{asset_id}:saveDraftText`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // POST/PUT/PATCH: pass data as second parameter
        //     // v1.0.1
        const response = await this.client.post(url, processedRequest, { headers: requestHeaders });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return business_asset_browser_1.UpdateDraftTextEntryResponse.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as UpdateDraftTextEntryResponse:', userData);
                return business_asset_browser_1.UpdateDraftTextEntryResponse.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as UpdateDraftTextEntryResponse:', response.data);
            return business_asset_browser_1.UpdateDraftTextEntryResponse.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as UpdateDraftTextEntryResponse (non-wrapped):', response.data);
        return business_asset_browser_1.UpdateDraftTextEntryResponse.fromJSON(response.data);
    }
    async rename_draft_entry(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets/{asset_space}/{asset_id}:renameDraftEntry`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // POST/PUT/PATCH: pass data as second parameter
        //     // v1.0.1
        const response = await this.client.post(url, processedRequest, { headers: requestHeaders });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return business_asset_browser_1.RenameDraftEntryResponse.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as RenameDraftEntryResponse:', userData);
                return business_asset_browser_1.RenameDraftEntryResponse.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as RenameDraftEntryResponse:', response.data);
            return business_asset_browser_1.RenameDraftEntryResponse.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as RenameDraftEntryResponse (non-wrapped):', response.data);
        return business_asset_browser_1.RenameDraftEntryResponse.fromJSON(response.data);
    }
    async delete_draft_entry(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets/{asset_space}/{asset_id}:deleteDraftEntry`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // POST/PUT/PATCH: pass data as second parameter
        //     // v1.0.1
        const response = await this.client.post(url, processedRequest, { headers: requestHeaders });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return business_asset_browser_1.DeleteDraftEntryResponse.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as DeleteDraftEntryResponse:', userData);
                return business_asset_browser_1.DeleteDraftEntryResponse.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as DeleteDraftEntryResponse:', response.data);
            return business_asset_browser_1.DeleteDraftEntryResponse.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as DeleteDraftEntryResponse (non-wrapped):', response.data);
        return business_asset_browser_1.DeleteDraftEntryResponse.fromJSON(response.data);
    }
    async diff_asset_versions(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets/{asset_space}/{asset_id}:diffVersions`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // POST/PUT/PATCH: pass data as second parameter
        //     // v1.0.1
        const response = await this.client.post(url, processedRequest, { headers: requestHeaders });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return business_asset_browser_1.DiffAssetVersionsResponse.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as DiffAssetVersionsResponse:', userData);
                return business_asset_browser_1.DiffAssetVersionsResponse.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as DiffAssetVersionsResponse:', response.data);
            return business_asset_browser_1.DiffAssetVersionsResponse.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as DiffAssetVersionsResponse (non-wrapped):', response.data);
        return business_asset_browser_1.DiffAssetVersionsResponse.fromJSON(response.data);
    }
    async diff_asset_draft(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets/{asset_space}/{asset_id}:diffDraft`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // POST/PUT/PATCH: pass data as second parameter
        //     // v1.0.1
        const response = await this.client.post(url, processedRequest, { headers: requestHeaders });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return business_asset_browser_1.DiffAssetDraftResponse.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as DiffAssetDraftResponse:', userData);
                return business_asset_browser_1.DiffAssetDraftResponse.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as DiffAssetDraftResponse:', response.data);
            return business_asset_browser_1.DiffAssetDraftResponse.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as DiffAssetDraftResponse (non-wrapped):', response.data);
        return business_asset_browser_1.DiffAssetDraftResponse.fromJSON(response.data);
    }
    async get_asset_diff_entry_detail(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets/{asset_space}/{asset_id}:getDiffEntry`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // POST/PUT/PATCH: pass data as second parameter
        //     // v1.0.1
        const response = await this.client.post(url, processedRequest, { headers: requestHeaders });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return business_asset_browser_1.GetAssetDiffEntryDetailResponse.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as GetAssetDiffEntryDetailResponse:', userData);
                return business_asset_browser_1.GetAssetDiffEntryDetailResponse.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as GetAssetDiffEntryDetailResponse:', response.data);
            return business_asset_browser_1.GetAssetDiffEntryDetailResponse.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as GetAssetDiffEntryDetailResponse (non-wrapped):', response.data);
        return business_asset_browser_1.GetAssetDiffEntryDetailResponse.fromJSON(response.data);
    }
    async publish_draft_version(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets/{asset_space}/{asset_id}:publishDraft`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // POST/PUT/PATCH: pass data as second parameter
        //     // v1.0.1
        const response = await this.client.post(url, processedRequest, { headers: requestHeaders });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return business_asset_browser_1.PublishDraftVersionResponse.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as PublishDraftVersionResponse:', userData);
                return business_asset_browser_1.PublishDraftVersionResponse.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as PublishDraftVersionResponse:', response.data);
            return business_asset_browser_1.PublishDraftVersionResponse.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as PublishDraftVersionResponse (non-wrapped):', response.data);
        return business_asset_browser_1.PublishDraftVersionResponse.fromJSON(response.data);
    }
    async activate_asset_version(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets/{asset_space}/{asset_id}:activateVersion`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // POST/PUT/PATCH: pass data as second parameter
        //     // v1.0.1
        const response = await this.client.post(url, processedRequest, { headers: requestHeaders });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return business_asset_browser_1.ActivateAssetVersionResponse.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as ActivateAssetVersionResponse:', userData);
                return business_asset_browser_1.ActivateAssetVersionResponse.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as ActivateAssetVersionResponse:', response.data);
            return business_asset_browser_1.ActivateAssetVersionResponse.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as ActivateAssetVersionResponse (non-wrapped):', response.data);
        return business_asset_browser_1.ActivateAssetVersionResponse.fromJSON(response.data);
    }
    async export_asset_entry(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets/{asset_space}/{asset_id}/export`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // GET/DELETE/HEAD/OPTIONS: pass params in config object
        const response = await this.client.get(url, {
            params: processedRequest,
            headers: requestHeaders
        });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return httpbody_1.HttpBody.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as HttpBody:', userData);
                return httpbody_1.HttpBody.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as HttpBody:', response.data);
            return httpbody_1.HttpBody.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as HttpBody (non-wrapped):', response.data);
        return httpbody_1.HttpBody.fromJSON(response.data);
    }
    async ensure_asset_collection(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/assets:ensure`;
        const pathParams = url.match(/{([^}]+)}/g);
        if (pathParams) {
            pathParams.forEach((param) => {
                const fieldPath = param.slice(1, -1); // Remove { and }
                const parts = fieldPath.split('.');
                let value = request;
                // Navigate nested fields
                for (const part of parts) {
                    value = value?.[part];
                }
                if (value !== undefined && value !== null) {
                    url = url.replace(param, encodeURIComponent(String(value)));
                }
            });
        }
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const requestHeaders = { ...headers };
        // POST/PUT/PATCH: pass data as second parameter
        //     // v1.0.1
        const response = await this.client.post(url, processedRequest, { headers: requestHeaders });
        // Handle response format (APIResponse wrapper or direct response)
        if (isAPIResponse(response.data)) {
            // Check if wrapped in APIResponse format
            if (response.data.data !== undefined) {
                // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
                const userData = response.data.data;
                // Check if data contains a nested 'user' object
                if (userData && typeof userData === 'object' && 'user' in userData) {
                    console.log('[BusinessAssetBrowserService] Extracting user from nested structure:', userData.user);
                    return business_asset_browser_1.AssetCollection.fromJSON(userData.user);
                }
                console.log('[BusinessAssetBrowserService] Using data directly as AssetCollection:', userData);
                return business_asset_browser_1.AssetCollection.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[BusinessAssetBrowserService] Using response.data directly as AssetCollection:', response.data);
            return business_asset_browser_1.AssetCollection.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[BusinessAssetBrowserService] Using response directly as AssetCollection (non-wrapped):', response.data);
        return business_asset_browser_1.AssetCollection.fromJSON(response.data);
    }
}
exports.V1Client = V1Client;
