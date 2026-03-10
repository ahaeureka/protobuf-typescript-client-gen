/**
 * WebSocket utilities for cross-platform support
 * Only imported when WebSocket functionality is needed
 */
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
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
}
/**
 * Cross-platform WebSocket factory
 * @param url WebSocket URL
 * @param protocols Optional protocols
 * @param options Options for Node.js ws library
 * @returns WebSocket instance
 */
export declare function createWebSocket(url: string, protocols?: string | string[], options?: any): WebSocketLike;
/**
 * Build WebSocket URL from HTTP URL
 * @param baseUrl Base HTTP URL
 * @param endpoint Endpoint path
 * @returns WebSocket URL
 */
export declare function buildWebSocketUrl(baseUrl: string, endpoint: string): string;
export {};
