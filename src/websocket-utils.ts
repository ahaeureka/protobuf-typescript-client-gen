/**
 * WebSocket utilities for cross-platform support
 * Only imported when WebSocket functionality is needed
 */

type WebSocketOpenOrErrorListener = (event: Event) => void;
type WebSocketMessageListener = (event: MessageEvent) => void;
type WebSocketCloseListener = (event: CloseEvent) => void;

// WebSocket interface for cross-platform compatibility
interface WebSocketLike {
    readonly CONNECTING: number;
    readonly OPEN: number;
    readonly CLOSING: number;
    readonly CLOSED: number;
    readonly readyState: number;
    readonly url: string;

    send(data: string | ArrayBuffer | Blob | ArrayBufferView): void;
    close(code?: number, reason?: string): void;

    onopen: ((event: Event) => void) | null;
    onclose: ((event: CloseEvent) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onerror: ((event: Event) => void) | null;

    addEventListener(type: 'open' | 'error', listener: WebSocketOpenOrErrorListener): void;
    addEventListener(type: 'message', listener: WebSocketMessageListener): void;
    addEventListener(type: 'close', listener: WebSocketCloseListener): void;
    removeEventListener(type: 'open' | 'error', listener: WebSocketOpenOrErrorListener): void;
    removeEventListener(type: 'message', listener: WebSocketMessageListener): void;
    removeEventListener(type: 'close', listener: WebSocketCloseListener): void;
}

/**
 * Cross-platform WebSocket factory
 * @param url WebSocket URL
 * @param protocols Optional protocols
 * @param options Options for Node.js ws library
 * @returns WebSocket instance
 */
export function createWebSocket(url: string, protocols?: string | string[], options?: any): WebSocketLike {
    if (typeof window !== 'undefined' && window.WebSocket) {
        // Browser environment - use native WebSocket
        return new window.WebSocket(url, protocols);
    } else if (typeof global !== 'undefined') {
        // Node.js environment - try to require ws
        try {
            const WS = require('ws');
            return new WS(url, protocols, options);
        } catch (e) {
            throw new Error('WebSocket support not available. Please install the "ws" package for Node.js environments.');
        }
    } else {
        throw new Error('WebSocket support not available in this environment.');
    }
}

/**
 * Build WebSocket URL from HTTP URL
 * @param baseUrl Base HTTP URL
 * @param endpoint Endpoint path
 * @returns WebSocket URL
 */
export function buildWebSocketUrl(baseUrl: string, endpoint: string): string {
    let wsScheme = 'ws://';
    if (baseUrl.startsWith('https://')) {
        wsScheme = 'wss://';
    } else if (baseUrl.startsWith('http://')) {
        wsScheme = 'ws://';
    } else if (baseUrl.startsWith('ws://') || baseUrl.startsWith('wss://')) {
        wsScheme = '';
    }
    return wsScheme + baseUrl.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '') + endpoint;
}