#!/usr/bin/env node
/**
 * TypeScript Protoc Plugin for Axios Client Generation
 * Uses Handlebars for template rendering
 */

// 条件导入，避免浏览器环境报错
let fs: any;
let Handlebars: any;

// if (typeof window === 'undefined' && typeof process !== 'undefined') {
fs = require('fs');
Handlebars = require('handlebars');
// }
import { CodeGeneratorRequest, CodeGeneratorResponse } from 'google-protobuf/google/protobuf/compiler/plugin_pb';
import { MethodDescriptorProto, FileDescriptorProto, FieldDescriptorProto } from 'google-protobuf/google/protobuf/descriptor_pb';
import * as annotations_pb from './google/api/annotations_pb';



// Logger utility for protoc plugins
class Logger {
    private static isDebugEnabled = process.env.DEBUG_PROTOC === 'true';

    static info(message: string, ...args: any[]) {
        // if (Logger.isDebugEnabled) {
        process.stderr.write(`[INFO] ${message}\n`);
        if (args.length > 0) {
            process.stderr.write(`[INFO] ${JSON.stringify(args, null, 2)}\n`);
        }
        // }
    }

    static error(message: string, ...args: any[]) {
        process.stderr.write(`[ERROR] ${message}\n`);
        if (args.length > 0) {
            process.stderr.write(`[ERROR] ${JSON.stringify(args, null, 2)}\n`);
        }
    }

    static warn(message: string, ...args: any[]) {
        if (Logger.isDebugEnabled) {
            process.stderr.write(`[WARN] ${message}\n`);
            if (args.length > 0) {
                process.stderr.write(`[WARN] ${JSON.stringify(args, null, 2)}\n`);
            }
        }
    }

    static debug(message: string, ...args: any[]) {
        if (Logger.isDebugEnabled) {
            process.stderr.write(`[DEBUG] ${message}\n`);
            if (args.length > 0) {
                process.stderr.write(`[DEBUG] ${JSON.stringify(args, null, 2)}\n`);
            }
        }
    }
}

// Register Handlebars helpers


// Interface definitions
interface HttpRule {
    method: string;
    path: string;
    body: boolean;
}

interface MethodInfo {
    name: string;
    snake_name: string;
    input_type: string;
    output_type: string;
    streaming_type: 'unary' | 'server_streaming' | 'client_streaming' | 'bidirectional_streaming';
    http: HttpRule;
    auth_required: boolean;
    scopes: string[];
    use_http_response: boolean; // 是否使用 HttpResponse 包装
    is_redirect: boolean; // 是否是重定向响应
}

interface ServiceInfo {
    name: string;
    methods: Record<string, MethodInfo>;
}

interface TemplateContext {
    class_name: string;
    model_imports: string[];
    services: Record<string, Record<string, MethodInfo>>;
    ts_out: string;
    useWebsoket: boolean;
}

// Main client template
const CLIENT_TEMPLATE = `/**
 * Auto-generated Axios TypeScript client
 * Generated from protobuf definitions
 */
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { APIResponse } from 'protobuf-typescript-client-gen';

// Import all required models
{{#each model_imports}}
{{{this}}}
{{/each}}


export interface ClientConfig {
  baseUrl: string;
  timeout?: number;
}

export interface EmptyRequest {}

type ResponseWrapper<T> = { data?: T } | T;

/**
 * Convert Uint8Array to Base64 string
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof window !== 'undefined' && window.btoa) {
    // Browser environment
    const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
    return window.btoa(binary);
  } else {
    // Node.js environment
    return Buffer.from(bytes).toString('base64');
  }
}

/**
 * Recursively convert all Uint8Array fields to Base64 strings in request object
 */
function preprocessRequest(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Uint8Array) {
    return uint8ArrayToBase64(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => preprocessRequest(item));
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = preprocessRequest(value);
  }
  return result;
}

/**
 * Type guard to check if a value is an APIResponse structure
 */
function isAPIResponse(data: any): data is APIResponse<unknown> {
  return (
    data !== null &&
    typeof data === 'object' &&
    typeof data.code === 'number' &&
    'data' in data &&
    'message' in data
  );
}

export class {{class_name}} {
  private client: AxiosInstance;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\\/$/, '');
    
    this.client = axios.create({
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
        config.headers.Authorization = \`Bearer \${this.accessToken}\`;
      }
      return config;
    });

    // Add response interceptor to handle authentication failures
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Check for authentication errors (401 Unauthorized)
        if (error.response && error.response.status === 401) {
          this.clearAuthState();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * 手动登出 - 清除所有认证状态
   * 公共方法，允许用户主动调用
   */
  public logout(): void {
    this.clearAuthState();
  }

  /**
   * 清除所有认证状态
   * 当认证失败时调用，清除 localStorage、sessionStorage 和所有 Cookie
   */
  private clearAuthState(): void {
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
            document.cookie = \`\${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;\`;
            document.cookie = \`\${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=\${window.location.hostname};\`;
            
            // 如果域名有子域，尝试删除父域的 Cookie
            const hostnameParts = window.location.hostname.split('.');
            if (hostnameParts.length > 2) {
              const parentDomain = hostnameParts.slice(-2).join('.');
              document.cookie = \`\${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.\${parentDomain};\`;
            }
          }
        }
        console.debug('[Auth] Cleared all cookies');
      }

      // 清除当前实例的 token
      this.accessToken = null;
      this.tokenExpiry = null;

      console.warn('[Auth] Authentication failed - all auth state cleared');
    } catch (error) {
      console.error('[Auth] Failed to clear auth state:', error);
    }
  }

  /**
   * 确保 session_id Cookie 已设置
   * 从 localStorage 读取 session_id，如果存在则设置到 Cookie
   */
  private ensureSessionCookie(): void {
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
          document.cookie = \`session_id=\${sessionId}; path=/; SameSite=Lax\`;
          console.debug('[Auth] Set session_id cookie from localStorage');
        }
      }
    } catch (error) {
      console.warn('[Auth] Failed to sync session_id to cookie:', error);
    }
  }

  /**
   * 从 localStorage/Cookie 获取 session_id
   */
  private getSessionId(): string | null {
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

private getToken(): string | null {
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
  } else if (typeof process !== 'undefined' && process.env) {
    // Node.js environment - try to get token from environment variables
    return process.env.ACCESS_TOKEN || process.env.TOKEN || null;
  }
  
  return null;
}

  private async getAuthHeaders(): Promise<Record<string, string>> {
    this.accessToken = this.getToken();
    return this.accessToken ? { Authorization: \`Bearer \${this.accessToken}\` } : {};
  }

{{#each services}}
  // {{@key}} methods
{{#each this}}
{{#if (eq streaming_type "unary")}}
  async {{snake_name}}(
    request: {{input_type}},
    headers?: Record<string, string>
  ): Promise<{{output_type}}> {
    // Extract and replace path parameters (supports nested fields like {service.service_name})
    let url = \`{{http.path}}\`;
    const pathParams = url.match(/\{([^}]+)\}/g);
    if (pathParams) {
      pathParams.forEach((param: string) => {
        const fieldPath = param.slice(1, -1); // Remove { and }
        const parts = fieldPath.split('.');
        let value: any = request;
        
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
    
    {{#if auth_required}}
    const authHeaders = await this.getAuthHeaders();
    Object.assign(requestHeaders, authHeaders);
    {{/if}}
    
    {{#if is_redirect}}
    // Handle redirect response - don't follow redirects
    // v1.0.1
    {{#if (isBodyMethod http.method)}}
    const response: AxiosResponse<any> = await this.client.{{lower http.method}}(
      url,
      processedRequest,
      { 
        headers: requestHeaders,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      }
    );
    {{else}}
    const response: AxiosResponse<any> = await this.client.{{lower http.method}}(
      url,
      { 
        params: processedRequest,
        headers: requestHeaders,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      }
    );
    {{/if}}
    
    // For redirect responses, handle HttpResponse format if configured
    {{#if use_http_response}}
    // Check if response uses HttpResponse format for redirect
    const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
    const isJsonResponse = contentType.includes('application/json');
    
    if (isJsonResponse && isAPIResponse(response.data)) {
      // Response is wrapped in HttpResponse
      if (response.data.code >= 200 && response.data.code < 400) {
        // Success redirect - extract actual data from HttpResponse.data
        if (response.data.data !== undefined && response.data.data !== null) {
          return {{output_type}}.fromJSON(response.data.data);
        }
        // Empty successful redirect response
        return {{output_type}}.fromJSON({});
      } else {
        // Error response - extract message from HttpResponse.message
        const errorMessage = response.data.message || 'Unknown redirect error';
        throw new Error(\`Redirect failed with code \${response.data.code}: \${errorMessage}\`);
      }
    }
    // Fallback: treat as direct response for non-JSON or non-HttpResponse format
    return {{output_type}}.fromJSON(response.data);
    {{else}}
    // For redirect responses, return the response data directly
    return {{output_type}}.fromJSON(response.data);
    {{/if}}
    
    {{else}}
    {{#if (isBodyMethod http.method)}}
    // POST/PUT/PATCH: pass data as second parameter
    //     // v1.0.1

    const response: AxiosResponse<any> = await this.client.{{lower http.method}}(
      url,
      processedRequest,
      { headers: requestHeaders }
    );
    {{else}}
    // GET/DELETE/HEAD/OPTIONS: pass params in config object
    const response: AxiosResponse<any> = await this.client.{{lower http.method}}(
      url,
      { 
        params: processedRequest,
        headers: requestHeaders 
      }
    );
    {{/if}}
    
    {{#if use_http_response}}
    // Handle HttpResponse wrapped format (stew.api.v1.HttpResponse)
    // Check if response content-type is JSON and protocol uses HttpResponse
    const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
    const isJsonResponse = contentType.includes('application/json');
    
    if (isJsonResponse && isAPIResponse(response.data)) {
      // Response is wrapped in HttpResponse
      if (response.data.code >= 200 && response.data.code < 300) {
        // Success response - extract actual data from HttpResponse.data
        if (response.data.data !== undefined && response.data.data !== null) {
          return {{output_type}}.fromJSON(response.data.data);
        }
        // Empty successful response
        return {{output_type}}.fromJSON({});
      } else {
        // Error response - extract message from HttpResponse.message
        const errorMessage = response.data.message || 'Unknown error';
        throw new Error(\`Request failed with code \${response.data.code}: \${errorMessage}\`);
      }
    }
    // Fallback: treat as direct response for non-JSON or non-HttpResponse format
    return {{output_type}}.fromJSON(response.data);
    {{else}}
    // Handle response format (APIResponse wrapper or direct response)
    if (isAPIResponse(response.data)) {
      // Check if wrapped in APIResponse format
      if (response.data.data !== undefined) {
        // API response format: { code: 2000, data: { user: {...}, session_id: "...", expires_at: ... }, message: "..." }
        const userData = response.data.data;

        // Check if data contains a nested 'user' object
        if (userData && typeof userData === 'object' && 'user' in userData) {
          console.log('[{{@../key}}] Extracting user from nested structure:', userData.user);
          return {{output_type}}.fromJSON(userData.user);
        }

        console.log('[{{@../key}}] Using data directly as {{output_type}}:', userData);
        return {{output_type}}.fromJSON(userData);
      }
      // Direct response (APIResponse but without data field - shouldn't normally happen)
      console.log('[{{@../key}}] Using response.data directly as {{output_type}}:', response.data);
      return {{output_type}}.fromJSON(response.data);
    }
    // Not an APIResponse - treat as direct protobuf response
    console.log('[{{@../key}}] Using response directly as {{output_type}} (non-wrapped):', response.data);
    return {{output_type}}.fromJSON(response.data);
    {{/if}}
    {{/if}}
  }{{else if (eq streaming_type "server_streaming")}}
  async {{snake_name}}(
    request: {{input_type}},
    headers?: Record<string, string>
  ): Promise<AsyncIterable<{{output_type}}>> {
    // Import SSE utilities only when needed
    const { parseSSEChunk } = await import('./sse-utils');
    
    // Preprocess request to convert Uint8Array to Base64
    const processedRequest = preprocessRequest(request);
    
    const url = \`\${this.baseUrl}{{http.path}}\`;
    const requestHeaders = { 
      ...headers,
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache'
    };
    
    {{#if auth_required}}
    const authHeaders = await this.getAuthHeaders();
    Object.assign(requestHeaders, authHeaders);
    {{/if}}
    
    {{#if (isBodyMethod http.method)}}
    // POST/PUT/PATCH: pass data in request body
    const response = await axios({
      method: '{{http.method}}',
      url,
      data: processedRequest,
      headers: requestHeaders,
      responseType: 'stream'
    });
    {{else}}
    // GET/DELETE/HEAD/OPTIONS: pass params in query string
    const response = await axios({
      method: '{{http.method}}',
      url,
      params: processedRequest,
      headers: requestHeaders,
      responseType: 'stream'
    });
    {{/if}}

    return {
      async *[Symbol.asyncIterator]() {
        const stream = response.data;
        let buffer = '';
        
        for await (const chunk of stream) {
          const result = parseSSEChunk<{{output_type}}>(
            chunk,
            buffer,
            {{output_type}},
            {{#if use_http_response}}true{{else}}false{{/if}}
          );
          
          buffer = result.buffer;
          for (const message of result.messages) {
            yield message;
          }
        }
      }
    };
  }

{{else if (eq streaming_type "client_streaming")}}
  async {{snake_name}}(
    inputStream: AsyncIterable<{{input_type}}>,
    headers?: Record<string, string>
  ): Promise<{{output_type}}> {
    // Import WebSocket utilities only when needed
    const { createWebSocket, buildWebSocketUrl } = await import('./websocket-utils');
    const { processWebSocketMessage } = await import('./websocket-message-utils');
    
    return new Promise(async (resolve, reject) => {
      const wsUrl = buildWebSocketUrl(this.baseUrl, '{{http.path}}');
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
        } catch (error) {
          reject(error);
        }
      };

      const onMessage = (event: MessageEvent) => {
        try {
          const result = processWebSocketMessage<{{output_type}}>(
            event,
            {{output_type}},
            {{#if use_http_response}}true{{else}}false{{/if}}
          );
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      const onError = (error: Event) => {
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
      } else {
        // Fallback for ws library
        ws.onopen = onOpen;
        ws.onmessage = onMessage;
        ws.onerror = onError;
        ws.onclose = onClose;
      }
    });
  }

{{else if (eq streaming_type "bidirectional_streaming")}}
  async {{snake_name}}(
    inputStream: AsyncIterable<{{input_type}}>,
    headers?: Record<string, string>
  ): Promise<AsyncIterable<{{output_type}}>> {
    // Import WebSocket utilities only when needed
    const { createWebSocket, buildWebSocketUrl } = await import('./websocket-utils');
    const { processWebSocketStreamingMessage } = await import('./websocket-message-utils');
    
    const wsUrl = buildWebSocketUrl(this.baseUrl, '{{http.path}}');
    const authHeaders = await this.getAuthHeaders();
    
    const ws = createWebSocket(wsUrl, undefined, {
      headers: { ...headers, ...authHeaders }
    });

    return {
      async *[Symbol.asyncIterator]() {
        const messageQueue: {{output_type}}[] = [];
        let streamEnded = false;
        let wsError: Error | null = null;

        // Set up WebSocket event handlers
        const onMessage = (event: MessageEvent) => {
          const error = processWebSocketStreamingMessage<{{output_type}}>(
            event,
            {{output_type}},
            {{#if use_http_response}}true{{else}}false{{/if}},
            messageQueue
          );
          
          if (error) {
            wsError = error;
          }
        };

        const onError = (error: Event) => {
          wsError = error as Error;
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
          } catch (error) {
            wsError = error as Error;
          }
        };

        // Set up event handlers
        if (ws.addEventListener) {
          ws.addEventListener('open', onOpen);
          ws.addEventListener('message', onMessage);
          ws.addEventListener('error', onError);
          ws.addEventListener('close', onClose);
        } else {
          // Fallback for ws library
          ws.onopen = onOpen;
          ws.onmessage = onMessage;
          ws.onerror = onError;
          ws.onclose = onClose;
        }

        // Wait for connection to open
        await new Promise<void>((resolve, reject) => {
          const checkOpen = () => {
            if (ws.readyState === ws.OPEN) {
              resolve();
            } else if (ws.readyState === ws.CLOSED) {
              reject(new Error('WebSocket connection failed'));
            } else {
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
            yield messageQueue.shift()!;
          } else {
            // Wait a bit before checking again
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }

        ws.close();
      }
    };
  }
{{/if}}

{{/each}}
{{/each}}
}`;


// Plugin implementation
class AxiosClientPlugin {
    private options: PluginOptions = {};
    registerHandlebarsHelpers(Handlebars: any): void {
        Handlebars.registerHelper('snake_case', function (str: string) {
            return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
        });

        Handlebars.registerHelper('camel_case', function (str: string) {
            return str.replace(/_([a-z])/g, (_: any, letter: string) => letter.toUpperCase());
        });

        Handlebars.registerHelper('eq', function (a: any, b: any) {
            return a === b;
        });

        Handlebars.registerHelper('includes', function (array: any[], item: any) {
            return Array.isArray(array) && array.includes(item);
        });

        Handlebars.registerHelper('lower', function (str: string) {
            return str.toLowerCase();
        });

        Handlebars.registerHelper('and', function (a: any, b: any) {
            return a && b;
        });

        Handlebars.registerHelper('isBodyMethod', function (method: string) {
            return ['POST', 'PUT', 'PATCH'].includes(method);
        });
    }
    private parseOptions(parameter: string): PluginOptions {
        const options: PluginOptions = {};

        if (!parameter) {
            return options;
        }

        // Parse key=value pairs separated by commas
        const pairs = parameter.split(',');
        for (const pair of pairs) {
            const [key, value] = pair.split('=', 2);
            if (key && value) {
                switch (key.trim()) {
                    case 'ts_out':
                    case 'tsOut':
                        options.ts_out = value.trim();
                        break;
                    case 'axios_out':
                    case 'axiosOut':
                        options.axios_out = value.trim();
                        break;
                    default:
                    // Ignore unknown options
                }
            }
        }

        return options;
    }

    private getOutputFileName(baseFileName: string): string {
        const fileName = baseFileName.replace('.proto', '_client.ts');

        // If output directory is specified, prepend it
        // if (this.options.out) {
        //     // Ensure output directory ends with / if not empty
        //     const outputDir = this.options.out.endsWith('/') ? this.options.out : this.options.out + '/';
        //     return outputDir + fileName;
        // }

        return fileName;
    }

    /**
     * 计算从 fromPath 到 toPath 的相对路径
     * 例如: fromPath="../web/src/services", toPath="../web/src/proto" 
     * 返回: "../proto"
     */
    private calculateRelativePath(fromPath: string, toPath: string): string {
        const path = require('path');

        // 标准化路径，移除末尾的斜杠
        const normalizeDir = (dir: string) => {
            return path.normalize(dir).replace(/[/\\]+$/, '');
        };

        const normalizedFrom = normalizeDir(fromPath);
        const normalizedTo = normalizeDir(toPath);

        // 计算相对路径
        const relativePath = path.relative(normalizedFrom, normalizedTo);

        // 确保相对路径以 ./ 开头（如果不是以 .. 开头的话）
        if (relativePath && !relativePath.startsWith('..') && !relativePath.startsWith('.')) {
            return './' + relativePath;
        }

        return relativePath || '.';
    }

    /**
     * 获取导入模型的相对路径
     * 如果设置了 ts_out 和 axios_out，计算相对路径
     * 否则使用默认的 './' 前缀
     */
    private getModelImportPath(): string {
        if (this.options.ts_out && this.options.axios_out) {
            const relativePath = this.calculateRelativePath(this.options.axios_out, this.options.ts_out);
            // 确保路径以斜杠结尾以便拼接文件名
            return relativePath.endsWith('/') ? relativePath : relativePath + '/';
        }

        // 默认情况下，假设模型文件在同一目录
        return './';
    }

    private parseHttpRule(method: MethodDescriptorProto): HttpRule {
        const methodName = method.getName() || 'unknown';

        // Try to parse from options using proper extension field access
        try {
            const options = method.getOptions();
            if (options) {
                // Try to get the HTTP rule from the method options
                // The google.api.http extension has field number 72295728
                Logger.debug(`Parsing HTTP rule for method ${methodName}`);
                const httpRule = this.extractHttpRuleFromOptions(options);
                if (httpRule) {
                    Logger.debug(`Found HTTP rule for ${methodName}:`, httpRule);
                    return httpRule;
                }
            }
        } catch (error) {
            Logger.error('Error parsing HTTP rule for', methodName, ':', error);
        }

        // Default fallback
        return {
            method: 'POST',
            path: '/api/' + this.toSnakeCase(methodName),
            body: true
        };
    }

    private extractHttpRuleFromOptions(options: any): HttpRule | null {
        try {
            // Method 1: Try to access the extension using getExtension with the field number
            const httpRule = this.tryExtractHttpDirectly(options);
            if (httpRule) {
                return httpRule;
            }

            // Method 2: Try to parse from serialized binary
            const binaryRule = this.tryExtractFromBinary(options);
            if (binaryRule) {
                return binaryRule;
            }

            // Method 3: Try to access from the extensions map
            const extensionRule = this.tryExtractFromExtensionMap(options);
            if (extensionRule) {
                return extensionRule;
            }

        } catch (error) {
            Logger.error('Error extracting HTTP rule from options:', error);
        }
        return null;
    }

    private tryExtractHttpDirectly(options: any): HttpRule | null {
        try {
            // Method 1: Check wrappers_ for HttpRule extension
            if (options.wrappers_ && options.wrappers_['72295728']) {
                const httpRuleWrapper = options.wrappers_['72295728'];
                const httpRuleArray = httpRuleWrapper.array;
                if (httpRuleArray) {
                    return this.parseHttpRuleArray(httpRuleArray);
                }
            }

            // Method 2: Check extensionObject_ directly
            if (options.extensionObject_ && options.extensionObject_['72295728']) {
                const httpRuleArray = options.extensionObject_['72295728'];
                if (httpRuleArray && Array.isArray(httpRuleArray)) {
                    return this.parseHttpRuleArray(httpRuleArray);
                }
            }

            // Method 3: Use the extension field info (fallback)
            const httpExt = options.getExtension?.(annotations_pb.HttpRule) ||
                options.getExtension?.('google.api.http') ||
                options['72295728'] ||
                options['google.api.http'];

            if (httpExt) {
                return this.parseHttpExtension(httpExt);
            }

        } catch (error) {
            Logger.debug('Failed to extract HTTP rule directly:', error);
        }
        return null;
    }

    private parseHttpRuleArray(httpRuleArray: any[]): HttpRule | null {
        try {
            // Based on HttpRule proto definition, array index = proto field number - 1:
            // string selector = 1;     -> array index 0
            // string get = 2;          -> array index 1
            // string put = 3;          -> array index 2  
            // string post = 4;         -> array index 3
            // string delete = 5;       -> array index 4
            // string patch = 6;        -> array index 5
            // string body = 7;         -> array index 6
            // CustomHttpPattern custom = 8; -> array index 7

            let method = '';
            let path = '';
            let body = true;

            // Check each HTTP method field
            if (httpRuleArray[1]) { // get
                method = 'GET';
                path = httpRuleArray[1];
                body = false;
            } else if (httpRuleArray[3]) { // post
                method = 'POST';
                path = httpRuleArray[3];
            } else if (httpRuleArray[2]) { // put
                method = 'PUT';
                path = httpRuleArray[2];
            } else if (httpRuleArray[4]) { // delete
                method = 'DELETE';
                path = httpRuleArray[4];
                body = false;
            } else if (httpRuleArray[5]) { // patch
                method = 'PATCH';
                path = httpRuleArray[5];
            }

            // Check body field
            if (httpRuleArray[6] !== undefined) {
                const bodyField = httpRuleArray[6];
                body = bodyField === '*' || bodyField !== '';
            }

            if (method && path) {
                return { method, path, body };
            }
        } catch (error) {
            Logger.error('Error parsing HttpRule array:', error);
        }
        return null;
    }

    private tryExtractFromBinary(options: any): HttpRule | null {
        try {
            const serialized = options.serializeBinary();
            return this.parseHttpRuleFromBinary(new Uint8Array(serialized));
        } catch (error) {
            Logger.debug('Failed to extract HTTP rule from binary:', error);
            return null;
        }
    }

    private tryExtractFromExtensionMap(options: any): HttpRule | null {
        try {
            // Try to access extension fields map
            const extensionMap = options.getExtensionFieldsMap?.() || options.extensionObject_;
            if (extensionMap) {
                for (const [key, value] of extensionMap) {
                    if (key === 72295728 || key === 'google.api.http') {
                        return this.parseHttpExtension(value);
                    }
                }
            }

            // Try unknown fields
            const unknownFields = options.getUnknownFields?.() || options.unknownFields_;
            if (unknownFields && Array.isArray(unknownFields)) {
                for (const field of unknownFields) {
                    if (field.getFieldNumber?.() === 72295728) {
                        const data = field.getData?.();
                        if (data) {
                            return this.parseHttpRuleFromBinary(new Uint8Array(data));
                        }
                    }
                }
            }
        } catch (error) {
            // Ignore and continue
        }
        return null;
    }
    private parseHttpExtension(httpExt: any): HttpRule | null {
        try {
            let method = '';
            let path = '';
            let body = true;

            Logger.debug('Parsing HTTP extension:', httpExt);

            // Check if this is a protobuf HttpRule object
            if (httpExt && typeof httpExt === 'object') {
                // Try different ways to access the fields
                const getField = (fieldName: string) => {
                    return httpExt[`get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`]?.() ||
                        httpExt[fieldName] ||
                        httpExt[`has${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`]?.() &&
                        httpExt[`get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`]?.();
                };

                // Check for each HTTP method
                const getPath = getField('get');
                const postPath = getField('post');
                const putPath = getField('put');
                const patchPath = getField('patch');
                const deletePath = getField('delete');

                if (getPath) {
                    method = 'GET';
                    path = getPath;
                    body = false;
                } else if (postPath) {
                    method = 'POST';
                    path = postPath;
                } else if (putPath) {
                    method = 'PUT';
                    path = putPath;
                } else if (patchPath) {
                    method = 'PATCH';
                    path = patchPath;
                } else if (deletePath) {
                    method = 'DELETE';
                    path = deletePath;
                    body = false;
                }

                // Check body configuration
                const bodyField = getField('body');
                if (bodyField !== undefined) {
                    body = bodyField === '*' || bodyField !== '';
                }

                Logger.debug(`Extracted HTTP rule: method=${method}, path=${path}, body=${body}`);

                if (method && path) {
                    return { method, path, body };
                }
            }

            // Fallback: try to parse as plain object
            if (httpExt.get) {
                method = 'GET';
                path = httpExt.get;
                body = false;
            } else if (httpExt.post) {
                method = 'POST';
                path = httpExt.post;
            } else if (httpExt.put) {
                method = 'PUT';
                path = httpExt.put;
            } else if (httpExt.patch) {
                method = 'PATCH';
                path = httpExt.patch;
            } else if (httpExt.delete) {
                method = 'DELETE';
                path = httpExt.delete;
                body = false;
            }

            if (httpExt.body !== undefined) {
                body = httpExt.body === '*' || httpExt.body !== '';
            }

            if (method && path) {
                return { method, path, body };
            }

        } catch (error) {
            Logger.error('Error parsing HTTP extension:', error);
        }
        return null;
    }

    private parseHttpRuleFromUnknownField(field: any): HttpRule | null {
        try {
            // Parse the unknown field as HTTP rule
            const data = field.getData();
            if (data && data.length > 0) {
                return this.parseHttpRuleFromBinary(data);
            }
        } catch (error) {
            Logger.error('Error parsing HTTP rule from unknown field:', error);
        }
        return null;
    }

    private parseHttpRuleFromBinary(data: Uint8Array): HttpRule | null {
        try {
            let pos = 0;
            let method = '';
            let path = '';
            let body = true;

            while (pos < data.length) {
                if (pos >= data.length) break;

                const tag = data[pos++];
                const fieldNumber = tag >> 3;
                const wireType = tag & 7;

                // Handle the google.api.http extension field (72295728)
                if (fieldNumber === 72295728 % 128 || fieldNumber === 72295728) {
                    if (wireType === 2) { // Length-delimited
                        const length = this.readVarint(data, pos);
                        pos += this.getVarintLength(length);
                        const httpRuleData = data.slice(pos, pos + length);
                        pos += length;

                        // Parse the HttpRule message
                        const httpRule = this.parseHttpRuleMessage(httpRuleData);
                        if (httpRule) {
                            return httpRule;
                        }
                    } else {
                        // Skip field
                        pos = this.skipField(data, pos, wireType);
                    }
                } else {
                    // Skip other fields
                    pos = this.skipField(data, pos, wireType);
                }
            }

            // If we didn't find the extension, try parsing the entire data as HttpRule
            return this.parseHttpRuleMessage(data);
        } catch (error) {
            Logger.error('Error parsing HTTP rule from binary:', error);
            return null;
        }
    }

    private parseHttpRuleMessage(data: Uint8Array): HttpRule | null {
        try {
            let pos = 0;
            let method = '';
            let path = '';
            let body = true;

            while (pos < data.length) {
                if (pos >= data.length) break;

                const tag = data[pos++];
                const fieldNumber = tag >> 3;
                const wireType = tag & 7;

                if (wireType === 2) { // Length-delimited (string)
                    const length = this.readVarint(data, pos);
                    pos += this.getVarintLength(length);

                    if (pos + length > data.length) break;

                    const fieldData = data.slice(pos, pos + length);
                    const fieldValue = new TextDecoder('utf-8').decode(fieldData);

                    switch (fieldNumber) {
                        case 2: // post
                            method = 'POST';
                            path = fieldValue;
                            break;
                        case 3: // get
                            method = 'GET';
                            path = fieldValue;
                            body = false;
                            break;
                        case 4: // put
                            method = 'PUT';
                            path = fieldValue;
                            break;
                        case 5: // delete
                            method = 'DELETE';
                            path = fieldValue;
                            body = false;
                            break;
                        case 6: // patch
                            method = 'PATCH';
                            path = fieldValue;
                            break;
                        case 7: // body
                            body = fieldValue === '*' || fieldValue !== '';
                            break;
                    }
                    pos += length;
                } else {
                    // Skip other wire types
                    pos = this.skipField(data, pos, wireType);
                }
            }

            if (method && path) {
                return { method, path, body };
            }
        } catch (error) {
            Logger.error('Error parsing HttpRule message:', error);
        }
        return null;
    }

    private readVarint(data: Uint8Array, pos: number): number {
        let result = 0;
        let shift = 0;
        while (pos < data.length) {
            const byte = data[pos];
            result |= (byte & 0x7F) << shift;
            if ((byte & 0x80) === 0) {
                break;
            }
            shift += 7;
            pos++;
        }
        return result;
    }

    private getVarintLength(value: number): number {
        let length = 1;
        while (value >= 128) {
            value >>>= 7;
            length++;
        }
        return length;
    }

    private skipField(data: Uint8Array, pos: number, wireType: number): number {
        switch (wireType) {
            case 0: // Varint
                while (pos < data.length && (data[pos] & 0x80) !== 0) {
                    pos++;
                }
                return pos + 1;
            case 1: // 64-bit
                return pos + 8;
            case 2: // Length-delimited
                const length = this.readVarint(data, pos);
                pos += this.getVarintLength(length);
                return pos + length;
            case 5: // 32-bit
                return pos + 4;
            default:
                return pos;
        }
    }

    private parseAuthRule(options: any): { required: boolean; scopes: string[] } {
        const authRule = options?.['pydantic.method_auth'];
        if (!authRule) {
            return { required: false, scopes: [] };
        }

        return {
            required: !!authRule.required,
            scopes: authRule.scopes || []
        };
    }

    /**
     * 获取服务级别的 http_response 选项
     * Field number: 50038
     */
    private getServiceHttpResponse(serviceOptions: any): string | null {
        if (!serviceOptions) return null;

        try {
            // Try to access the http_response extension (field 50038)
            const httpResponse = this.getExtensionField(serviceOptions, 50038) ||
                serviceOptions['50038'] ||
                serviceOptions['http_response'];

            if (httpResponse && typeof httpResponse === 'string') {
                return httpResponse;
            }
        } catch (error) {
            Logger.debug('Error getting service http_response:', error);
        }

        return null;
    }

    /**
     * 获取服务级别的 auth_required 选项
     * Field number: 50033
     */
    private getServiceAuthRequired(serviceOptions: any): boolean {
        if (!serviceOptions) return false;

        try {
            const authRequired = this.getExtensionField(serviceOptions, 50033) ||
                serviceOptions['50033'] ||
                serviceOptions['auth_reqiured'];

            return !!authRequired;
        } catch (error) {
            Logger.debug('Error getting service auth_required:', error);
        }

        return false;
    }

    /**
     * 判断方法是否应该使用 HttpResponse 包装
     * Field number for dont_use_http_response: 50041
     */
    private shouldUseHttpResponse(methodOptions: any, serviceHttpResponse: string | null): boolean {
        if (!serviceHttpResponse) {
            return false;
        }

        // Check if method explicitly disables http_response (field 50041)
        if (methodOptions) {
            try {
                const dontUse = this.getExtensionField(methodOptions, 50041) ||
                    methodOptions['50041'] ||
                    methodOptions['dont_use_http_response'];

                if (dontUse === true) {
                    return false;
                }
            } catch (error) {
                Logger.debug('Error checking dont_use_http_response:', error);
            }
        }

        // Check if the service http_response is HttpResponse type
        return serviceHttpResponse === 'stew.api.v1.HttpResponse' ||
            serviceHttpResponse.endsWith('.HttpResponse');
    }

    /**
     * 判断方法是否是重定向响应
     * Field number for is_redirect: 50035
     */
    private isRedirectMethod(methodOptions: any): boolean {
        if (!methodOptions) return false;

        try {
            const isRedirect = this.getExtensionField(methodOptions, 50035) ||
                methodOptions['50035'] ||
                methodOptions['is_redirect'];

            return !!isRedirect;
        } catch (error) {
            Logger.debug('Error checking is_redirect:', error);
        }

        return false;
    }

    /**
     * 获取方法级别的认证要求
     * Method-level options override service-level options
     * Field number for use_auth: 50042
     * Field number for dont_auth_reqiured: 50034
     */
    private getMethodAuthRequired(methodOptions: any, serviceAuthRequired: boolean, methodAuthRule: boolean): boolean {
        if (!methodOptions) {
            return serviceAuthRequired || methodAuthRule;
        }

        try {
            // Check if method explicitly requires auth (field 50042)
            const useAuth = this.getExtensionField(methodOptions, 50042) ||
                methodOptions['50042'] ||
                methodOptions['use_auth'];

            if (useAuth === true) {
                return true;
            }

            // Check if method explicitly disables auth (field 50034)
            const dontAuth = this.getExtensionField(methodOptions, 50034) ||
                methodOptions['50034'] ||
                methodOptions['dont_auth_reqiured'];

            if (dontAuth === true) {
                return false;
            }
        } catch (error) {
            Logger.debug('Error getting method auth required:', error);
        }

        // Default: use service level or method auth rule
        return serviceAuthRequired || methodAuthRule;
    }

    /**
     * 通用方法：从选项中提取扩展字段
     */
    private getExtensionField(options: any, fieldNumber: number): any {
        if (!options) return null;

        try {
            // Method 1: Check wrappers_
            if (options.wrappers_ && options.wrappers_[fieldNumber.toString()]) {
                const wrapper = options.wrappers_[fieldNumber.toString()];
                if (wrapper.array && wrapper.array.length > 0) {
                    // Return first non-undefined value
                    return wrapper.array.find((v: any) => v !== undefined);
                }
            }

            // Method 2: Check extensionObject_
            if (options.extensionObject_ && options.extensionObject_[fieldNumber.toString()]) {
                return options.extensionObject_[fieldNumber.toString()];
            }

            // Method 3: Direct property access
            if (options[fieldNumber.toString()] !== undefined) {
                return options[fieldNumber.toString()];
            }
        } catch (error) {
            Logger.debug(`Error extracting extension field ${fieldNumber}:`, error);
        }

        return null;
    }

    private getStreamingType(method: MethodDescriptorProto): string {
        const clientStreaming = method.getClientStreaming();
        const serverStreaming = method.getServerStreaming();

        if (clientStreaming && serverStreaming) {
            return 'bidirectional_streaming';
        } else if (clientStreaming) {
            return 'client_streaming';
        } else if (serverStreaming) {
            return 'server_streaming';
        } else {
            return 'unary';
        }
    }

    private toSnakeCase(str: string): string {
        return str
            // 处理连续的大写字母，在最后一个大写字母前插入下划线
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            // 处理小写字母后跟大写字母的情况
            .replace(/([a-z\d])([A-Z])/g, '$1_$2')
            .toLowerCase()
            // 移除开头的下划线
            .replace(/^_/, '');
    }

    private toPascalCase(str: string): string {
        return str
            .split(/[_\-\s]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }

    private extractTypeName(typeName: string): string {
        const parts = typeName.split('.');
        return parts[parts.length - 1];
    }

    private isWellKnownType(typeName: string): boolean {
        // Google well-known types that don't need imports
        const wellKnownTypes = new Set([
            'google.protobuf.Empty',
            'google.protobuf.Any',
            'google.protobuf.Timestamp',
            'google.protobuf.Duration',
            'google.protobuf.StringValue',
            'google.protobuf.Int32Value',
            'google.protobuf.Int64Value',
            'google.protobuf.UInt32Value',
            'google.protobuf.UInt64Value',
            'google.protobuf.BoolValue',
            'google.protobuf.FloatValue',
            'google.protobuf.DoubleValue',
            'google.protobuf.BytesValue',
            'google.protobuf.Struct',
            'google.protobuf.Value',
            'google.protobuf.ListValue',
            'google.protobuf.NullValue'
        ]);

        return wellKnownTypes.has(typeName) || typeName.startsWith('google.protobuf.');
    }

    private generateImports(
        requiredTypes: Set<string>,
        localMessageTypes: Set<string>,
        currentPackage: string,
        modelImports: string[],
        allFiles: FileDescriptorProto[],
        options: PluginOptions = {}
    ): void {
        const importMap = new Map<string, Set<string>>();

        // Create a mapping from message type to file name
        const typeToFileMap = new Map<string, string>();
        for (const file of allFiles) {
            const fileName = file.getName()?.replace('.proto', '') || '';
            file.getMessageTypeList().forEach(messageType => {
                const typeName = messageType.getName();
                if (typeName) {
                    const packageName = file.getPackage() || '';
                    const fullTypeName = packageName ? `${packageName}.${typeName}` : typeName;
                    typeToFileMap.set(fullTypeName, fileName);
                    typeToFileMap.set(typeName, fileName); // Also map simple name
                }
            });
        }

        for (const fullTypeName of requiredTypes) {
            // Skip if it's a local type
            if (localMessageTypes.has(fullTypeName)) {
                continue;
            }

            // Extract type name
            const parts = fullTypeName.split('.');
            const typeName = parts[parts.length - 1];

            // Find the file name for this type
            const fileName = typeToFileMap.get(fullTypeName) || typeToFileMap.get(typeName);

            if (fileName) {
                if (!importMap.has(fileName)) {
                    importMap.set(fileName, new Set());
                }
                importMap.get(fileName)!.add(typeName);
            }
        }

        // Generate import statements
        const modelImportPath = this.getModelImportPath();
        for (const [fileName, types] of importMap) {
            const typeList = Array.from(types).sort().join(', ');
            modelImports.push(`import { ${typeList} } from '${modelImportPath}${fileName}';`);
        }
    }

    private packageToFileName(packageName: string): string {
        // Convert package name like "example.v1" to file name like "example"
        // This is a simplified mapping - you might need to adjust based on your proto structure
        const parts = packageName.split('.');

        // For common patterns like "package.v1", "package.api.v1", take the main package name
        if (parts.length > 1 && parts[parts.length - 1].match(/^v\d+$/)) {
            // Remove version suffix
            return parts[parts.length - 2];
        }

        // For simple package names, use the last part
        return parts[parts.length - 1];
    }

    private processFile(file: FileDescriptorProto, allFiles: FileDescriptorProto[]): TemplateContext {
        const services: Record<string, Record<string, MethodInfo>> = {};
        const modelImports: string[] = [];
        const packageName = file.getPackage() || '';
        var useWebsoket = false;
        // Collect all message types defined in current file
        const localMessageTypes = new Set<string>();
        file.getMessageTypeList().forEach(messageType => {
            const typeName = messageType.getName();
            if (typeName) {
                // Add full qualified name and simple name
                const fullName = packageName ? `${packageName}.${typeName}` : typeName;
                localMessageTypes.add(fullName);
                localMessageTypes.add(typeName);
            }

            // Process fields to handle proto3 optional
            messageType.getFieldList().forEach(field => {
                this.processField(field);
            });
        });

        // Collect required types from services
        const requiredTypes = new Set<string>();

        // Process services
        file.getServiceList().forEach(service => {
            const serviceName = service.getName();
            if (!serviceName) return;

            const methods: Record<string, MethodInfo> = {};

            // Get service-level options
            const serviceOptions = service.getOptions();
            const serviceHttpResponse = this.getServiceHttpResponse(serviceOptions);
            const serviceAuthRequired = this.getServiceAuthRequired(serviceOptions);

            service.getMethodList().forEach(method => {
                const methodName = method.getName();
                if (!methodName) return;

                const inputType = this.extractTypeName(method.getInputType() || '');
                const outputType = this.extractTypeName(method.getOutputType() || '');
                const streamingType = this.getStreamingType(method);

                // Collect required types for imports
                const fullInputType = method.getInputType() || '';
                const fullOutputType = method.getOutputType() || '';

                // Add to required types if not empty and not well-known types
                if (fullInputType && !this.isWellKnownType(fullInputType)) {
                    requiredTypes.add(fullInputType);
                }
                if (fullOutputType && !this.isWellKnownType(fullOutputType)) {
                    requiredTypes.add(fullOutputType);
                }

                // Parse method options
                const httpRule = this.parseHttpRule(method);
                const methodOptions = method.getOptions();
                const authRule = this.parseAuthRule(methodOptions?.toObject());

                // Check method-level response wrapper options
                const useHttpResponse = this.shouldUseHttpResponse(methodOptions, serviceHttpResponse);
                const isRedirect = this.isRedirectMethod(methodOptions);

                // Determine auth requirement (method overrides service)
                const authRequired = this.getMethodAuthRequired(methodOptions, serviceAuthRequired, authRule.required);

                methods[methodName] = {
                    name: methodName,
                    snake_name: this.toSnakeCase(methodName),
                    input_type: inputType,
                    output_type: outputType,
                    streaming_type: streamingType as any,
                    http: httpRule,
                    auth_required: authRequired,
                    scopes: authRule.scopes,
                    use_http_response: useHttpResponse,
                    is_redirect: isRedirect
                };
                if (streamingType == 'client_streaming' || streamingType === 'bidirectional_streaming') { useWebsoket = true; }

            });
            services[serviceName] = methods;
        });

        // Generate imports for external types
        this.generateImports(requiredTypes, localMessageTypes, packageName, modelImports, allFiles);

        const packageBaseName = packageName.split('.').pop() || 'Generated';
        const className = `${this.toPascalCase(packageBaseName)}Client`;

        return {
            class_name: className,
            model_imports: modelImports,
            services: services,
            ts_out: this.getModelImportPath(),
            useWebsoket: useWebsoket
        };
    }

    private processField(field: FieldDescriptorProto): void {
        // Handle proto3 optional fields
        const fieldName = field.getName();
        const fieldType = field.getType();
        const fieldLabel = field.getLabel();

        // Proto3 optional fields have LABEL_OPTIONAL (1) and are in proto3 syntax
        // This method processes the field but doesn't break on optional fields
        if (fieldLabel === FieldDescriptorProto.Label.LABEL_OPTIONAL) {
            // Handle optional field - we just need to acknowledge it exists
            // The actual TypeScript type generation would be handled elsewhere
        }

        // Handle other field types as needed
        switch (fieldType) {
            case FieldDescriptorProto.Type.TYPE_MESSAGE:
                // Handle nested message types
                break;
            case FieldDescriptorProto.Type.TYPE_ENUM:
                // Handle enum types
                break;
            default:
                // Handle primitive types
                break;
        }
    }

    generate(request: CodeGeneratorRequest): CodeGeneratorResponse {
        const response = new CodeGeneratorResponse();

        // Parse plugin options from the parameter string
        const parameter = request.getParameter() || '';

        this.options = this.parseOptions(parameter);

        // Set supported features to indicate proto3 optional support
        response.setSupportedFeatures(
            CodeGeneratorResponse.Feature.FEATURE_PROTO3_OPTIONAL
        );

        // Register additional Handlebars helpers
        Handlebars.registerHelper('and', function (a: any, b: any) {
            return a && b;
        });

        // Get all proto files for type resolution
        const allFiles = request.getProtoFileList();
        const filesToGenerate = request.getFileToGenerateList();

        request.getProtoFileList().forEach(file => {
            // Only process files that are being generated (not dependencies)
            const fileName = file.getName() || '';
            const fileToGenerate = request.getFileToGenerateList().includes(fileName);
            if (!fileToGenerate) return;

            const context = this.processFile(file, allFiles);

            // Compile and render template
            const template = Handlebars.compile(CLIENT_TEMPLATE);
            const generatedCode = template(context);

            // Create output file
            if (!context.services || Object.keys(context.services).length === 0 || fileName === 'auth.proto') {
                Logger.info(`Skipping ${fileName}: no services to generate`);
                return;
            }

            // Use the new getOutputFileName method to handle output directory
            const outputFileName = this.getOutputFileName(fileName || 'generated_client.ts');
            Logger.info(`Generating client file: ${outputFileName}`);
            const outputFile = new CodeGeneratorResponse.File();
            outputFile.setName(outputFileName);
            outputFile.setContent(generatedCode);
            response.addFile(outputFile);
        });

        return response;
    }
}

// Plugin options interface
interface PluginOptions {
    ts_out?: string;
    axios_out?: string;
}

// Main plugin entry point
function main() {
    const plugin = new AxiosClientPlugin();

    // Read CodeGeneratorRequest from stdin
    if (!fs || !fs.readFileSync || !fs.writeFileSync) {
        console.error('File system operations not available in this environment');
        return;
    }
    plugin.registerHandlebarsHelpers(Handlebars);
    const input = fs.readFileSync(0); // stdin
    const request = CodeGeneratorRequest.deserializeBinary(new Uint8Array(input));

    try {
        const response = plugin.generate(request);
        const output = response.serializeBinary();
        fs.writeFileSync(1, output); // stdout
    } catch (error) {
        const response = new CodeGeneratorResponse();
        response.setError(`Plugin error: ${error}`);
        const output = response.serializeBinary();
        fs.writeFileSync(1, output);
    }
}



main();

export { AxiosClientPlugin };