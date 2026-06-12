/**
 * WebSocket message processing utilities
 * Only imported when WebSocket functionality is needed
 */
/**
 * Process WebSocket message and handle HttpResponse format
 * @param event WebSocket message event
 * @param outputType The protobuf output type class
 * @param useHttpResponse Whether to handle HttpResponse format
 * @returns Parsed message or throws error
 */
export declare function processWebSocketMessage<T>(event: MessageEvent, outputType: any, useHttpResponse: boolean): T;
/**
 * Process WebSocket message for streaming (adds to queue instead of returning)
 * @param event WebSocket message event
 * @param outputType The protobuf output type class
 * @param useHttpResponse Whether to handle HttpResponse format
 * @param messageQueue Queue to add messages to
 * @returns Error if any, null if successful
 */
export declare function processWebSocketStreamingMessage<T>(event: MessageEvent, outputType: any, useHttpResponse: boolean, messageQueue: T[]): Error | null;
