/**
 * Server-Sent Events (SSE) utilities
 * Only imported when SSE functionality is needed
 */

/**
 * Parse SSE data stream and handle HttpResponse format
 * @param chunk Raw chunk data
 * @param buffer Current buffer
 * @param outputType The protobuf output type class
 * @param useHttpResponse Whether to handle HttpResponse format
 * @returns Object with parsed messages and updated buffer
 */
export function parseSSEChunk<T>(
    chunk: Buffer | string,
    buffer: string,
    outputType: any,
    useHttpResponse: boolean
): { messages: T[], buffer: string } {
    const messages: T[] = [];
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr && dataStr !== '[DONE]') {
                try {
                    const data = JSON.parse(dataStr);

                    if (useHttpResponse) {
                        // Handle HttpResponse wrapped format for streaming
                        if (data && typeof data === 'object' && 'data' in data && 'code' in data) {
                            if (data.code >= 200 && data.code < 300) {
                                // Success - extract from HttpResponse.data
                                if (data.data !== undefined && data.data !== null) {
                                    messages.push(outputType.fromJSON(data.data));
                                } else {
                                    // Empty successful response - yield empty object
                                    messages.push(outputType.fromJSON({}));
                                }
                            } else {
                                // Error - throw with message from HttpResponse.message
                                const errorMessage = data.message || 'Unknown streaming error';
                                throw new Error(`Streaming failed with code ${data.code}: ${errorMessage}`);
                            }
                        } else {
                            // Direct data without HttpResponse wrapper
                            messages.push(outputType.fromJSON(data));
                        }
                    } else {
                        messages.push(outputType.fromJSON(data));
                    }
                } catch (error) {
                    console.error('Failed to parse SSE data:', error, 'Line:', line);
                }
            }
        }
    }

    return { messages, buffer };
}