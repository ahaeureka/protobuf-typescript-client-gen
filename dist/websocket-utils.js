"use strict";
/**
 * WebSocket utilities for cross-platform support
 * Only imported when WebSocket functionality is needed
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebSocket = createWebSocket;
exports.buildWebSocketUrl = buildWebSocketUrl;
/**
 * Cross-platform WebSocket factory
 * @param url WebSocket URL
 * @param protocols Optional protocols
 * @param options Options for Node.js ws library
 * @returns WebSocket instance
 */
function createWebSocket(url, protocols, options) {
    if (typeof window !== 'undefined' && window.WebSocket) {
        // Browser environment - use native WebSocket
        return new window.WebSocket(url, protocols);
    }
    else if (typeof global !== 'undefined') {
        // Node.js environment - try to require ws
        try {
            const WS = require('ws');
            return new WS(url, protocols, options);
        }
        catch (e) {
            throw new Error('WebSocket support not available. Please install the "ws" package for Node.js environments.');
        }
    }
    else {
        throw new Error('WebSocket support not available in this environment.');
    }
}
/**
 * Build WebSocket URL from HTTP URL
 * @param baseUrl Base HTTP URL
 * @param endpoint Endpoint path
 * @returns WebSocket URL
 */
function buildWebSocketUrl(baseUrl, endpoint) {
    let wsScheme = 'ws://';
    if (baseUrl.startsWith('https://')) {
        wsScheme = 'wss://';
    }
    else if (baseUrl.startsWith('http://')) {
        wsScheme = 'ws://';
    }
    else if (baseUrl.startsWith('ws://') || baseUrl.startsWith('wss://')) {
        wsScheme = '';
    }
    return wsScheme + baseUrl.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '') + endpoint;
}
