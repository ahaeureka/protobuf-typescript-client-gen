"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelloworldClient = void 0;
/**
 * Auto-generated Axios TypeScript client
 * Generated from protobuf definitions
 */
const axios_1 = __importDefault(require("axios"));
// Import all required models
const helloworld_1 = require("./helloworld");
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
class HelloworldClient {
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
    // Greeter methods
    async say_hello(request, headers) {
        // Extract and replace path parameters (supports nested fields like {service.service_name})
        let url = `/api/v1/example/hello`;
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
                    console.log('[Greeter] Extracting user from nested structure:', userData.user);
                    return helloworld_1.HelloReply.fromJSON(userData.user);
                }
                console.log('[Greeter] Using data directly as HelloReply:', userData);
                return helloworld_1.HelloReply.fromJSON(userData);
            }
            // Direct response (APIResponse but without data field - shouldn't normally happen)
            console.log('[Greeter] Using response.data directly as HelloReply:', response.data);
            return helloworld_1.HelloReply.fromJSON(response.data);
        }
        // Not an APIResponse - treat as direct protobuf response
        console.log('[Greeter] Using response directly as HelloReply (non-wrapped):', response.data);
        return helloworld_1.HelloReply.fromJSON(response.data);
    }
    async bidi_stream(inputStream, headers) {
        // Import WebSocket utilities only when needed
        const { createWebSocket, buildWebSocketUrl } = await Promise.resolve().then(() => __importStar(require('./websocket-utils')));
        const { processWebSocketStreamingMessage } = await Promise.resolve().then(() => __importStar(require('./websocket-message-utils')));
        const wsUrl = buildWebSocketUrl(this.baseUrl, '/api/v1/example/stream');
        const authHeaders = await this.getAuthHeaders();
        const ws = createWebSocket(wsUrl, undefined, {
            headers: { ...headers, ...authHeaders }
        });
        return {
            async *[Symbol.asyncIterator]() {
                const messageQueue = [];
                let streamEnded = false;
                let wsError = null;
                // Set up WebSocket event handlers
                const onMessage = (event) => {
                    const error = processWebSocketStreamingMessage(event, helloworld_1.HelloReply, false, messageQueue);
                    if (error) {
                        wsError = error;
                    }
                };
                const onError = (error) => {
                    wsError = error;
                };
                const onClose = () => {
                    streamEnded = true;
                };
                const onOpen = async () => {
                    // Start sending input stream in background
                    try {
                        for await (const request of inputStream) {
                            if (ws.readyState === ws.OPEN) {
                                // Preprocess each request to convert Uint8Array to Base64
                                const processedRequest = preprocessRequest(request);
                                ws.send(JSON.stringify(processedRequest));
                            }
                        }
                    }
                    catch (error) {
                        wsError = error;
                    }
                };
                // Set up event handlers
                if (ws.addEventListener) {
                    ws.addEventListener('open', onOpen);
                    ws.addEventListener('message', onMessage);
                    ws.addEventListener('error', onError);
                    ws.addEventListener('close', onClose);
                }
                else {
                    // Fallback for ws library
                    ws.onopen = onOpen;
                    ws.onmessage = onMessage;
                    ws.onerror = onError;
                    ws.onclose = onClose;
                }
                // Wait for connection to open
                await new Promise((resolve, reject) => {
                    const checkOpen = () => {
                        if (ws.readyState === ws.OPEN) {
                            resolve();
                        }
                        else if (ws.readyState === ws.CLOSED) {
                            reject(new Error('WebSocket connection failed'));
                        }
                        else {
                            setTimeout(checkOpen, 10);
                        }
                    };
                    checkOpen();
                });
                // Yield messages as they arrive
                while (!streamEnded || messageQueue.length > 0) {
                    if (wsError) {
                        throw wsError;
                    }
                    if (messageQueue.length > 0) {
                        yield messageQueue.shift();
                    }
                    else {
                        // Wait a bit before checking again
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                }
                ws.close();
            }
        };
    }
    async client_stream(inputStream, headers) {
        // Import WebSocket utilities only when needed
        const { createWebSocket, buildWebSocketUrl } = await Promise.resolve().then(() => __importStar(require('./websocket-utils')));
        const { processWebSocketMessage } = await Promise.resolve().then(() => __importStar(require('./websocket-message-utils')));
        return new Promise(async (resolve, reject) => {
            const wsUrl = buildWebSocketUrl(this.baseUrl, '/api/v1/example/client_stream');
            const authHeaders = await this.getAuthHeaders();
            const ws = createWebSocket(wsUrl, undefined, {
                headers: { ...headers, ...authHeaders }
            });
            const onOpen = async () => {
                try {
                    // Send all input requests
                    for await (const request of inputStream) {
                        // Preprocess each request to convert Uint8Array to Base64
                        const processedRequest = preprocessRequest(request);
                        ws.send(JSON.stringify(processedRequest));
                    }
                    // Signal end of input stream
                    ws.send(JSON.stringify({ __end_stream__: true }));
                }
                catch (error) {
                    reject(error);
                }
            };
            const onMessage = (event) => {
                try {
                    const result = processWebSocketMessage(event, helloworld_1.HelloReply, false);
                    resolve(result);
                }
                catch (error) {
                    reject(error);
                }
            };
            const onError = (error) => {
                reject(error);
            };
            const onClose = () => {
                reject(new Error('WebSocket connection closed unexpectedly'));
            };
            // Set up event handlers
            if (ws.addEventListener) {
                ws.addEventListener('open', onOpen);
                ws.addEventListener('message', onMessage);
                ws.addEventListener('error', onError);
                ws.addEventListener('close', onClose);
            }
            else {
                // Fallback for ws library
                ws.onopen = onOpen;
                ws.onmessage = onMessage;
                ws.onerror = onError;
                ws.onclose = onClose;
            }
        });
    }
    async server_stream(request, headers) {
        // Import SSE utilities only when needed
        const { parseSSEChunk } = await Promise.resolve().then(() => __importStar(require('protobuf-typescript-client-gen/dist/sse-utils')));
        // Preprocess request to convert Uint8Array to Base64
        const processedRequest = preprocessRequest(request);
        const url = `${this.baseUrl}/api/v1/example/server_stream`;
        const requestHeaders = {
            ...headers,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
        };
        // GET/DELETE/HEAD/OPTIONS: pass params in query string
        const response = await (0, axios_1.default)({
            method: 'GET',
            url,
            params: processedRequest,
            headers: requestHeaders,
            responseType: 'stream'
        });
        return {
            async *[Symbol.asyncIterator]() {
                const stream = response.data;
                let buffer = '';
                for await (const chunk of stream) {
                    const result = parseSSEChunk(chunk, buffer, helloworld_1.HelloReply, false);
                    buffer = result.buffer;
                    for (const message of result.messages) {
                        yield message;
                    }
                }
            }
        };
    }
}
exports.HelloworldClient = HelloworldClient;
