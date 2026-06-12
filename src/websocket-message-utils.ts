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
export function processWebSocketMessage<T>(
    event: MessageEvent,
    outputType: any,
    useHttpResponse: boolean
): T {
    const data = typeof event.data === 'string' ? event.data : event.data.toString();
    const response = JSON.parse(data);

    if (useHttpResponse) {
        // Handle HttpResponse wrapped format for WebSocket
        if (response && typeof response === 'object' && 'data' in response && 'code' in response) {
            if (response.code >= 200 && response.code < 300) {
                // Success - extract from HttpResponse.data
                const result = response.data !== undefined && response.data !== null ? response.data : {};
                return outputType.fromJSON(result);
            } else {
                // Error - throw with message from HttpResponse.message
                const errorMessage = response.message || 'Unknown WebSocket error';
                throw new Error(`WebSocket failed with code ${response.code}: ${errorMessage}`);
            }
        } else {
            // Direct response without HttpResponse wrapper
            const result = response.data || response;
            return outputType.fromJSON(result);
        }
    } else {
        const result = response.data || response;
        return outputType.fromJSON(result);
    }
}

/**
 * Process WebSocket message for streaming (adds to queue instead of returning)
 * @param event WebSocket message event
 * @param outputType The protobuf output type class
 * @param useHttpResponse Whether to handle HttpResponse format
 * @param messageQueue Queue to add messages to
 * @returns Error if any, null if successful
 */
export function processWebSocketStreamingMessage<T>(
    event: MessageEvent,
    outputType: any,
    useHttpResponse: boolean,
    messageQueue: T[]
): Error | null {
    try {
        const data = typeof event.data === 'string' ? event.data : event.data.toString();
        const response = JSON.parse(data);

        if (useHttpResponse) {
            // Handle HttpResponse wrapped format for bidirectional streaming
            if (response && typeof response === 'object' && 'data' in response && 'code' in response) {
                if (response.code >= 200 && response.code < 300) {
                    // Success - extract from HttpResponse.data
                    const result = response.data !== undefined && response.data !== null ? response.data : {};
                    messageQueue.push(outputType.fromJSON(result));
                } else {
                    // Error - return error with message from HttpResponse.message
                    const errorMessage = response.message || 'Unknown bidirectional streaming error';
                    return new Error(`Bidirectional streaming failed with code ${response.code}: ${errorMessage}`);
                }
            } else {
                // Direct response without HttpResponse wrapper
                const result = response.data || response;
                messageQueue.push(outputType.fromJSON(result));
            }
        } else {
            const result = response.data || response;
            messageQueue.push(outputType.fromJSON(result));
        }

        return null;
    } catch (error) {
        return error as Error;
    }
}