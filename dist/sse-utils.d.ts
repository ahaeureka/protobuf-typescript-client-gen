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
export declare function parseSSEChunk<T>(chunk: Buffer | string, buffer: string, outputType: any, useHttpResponse: boolean): {
    messages: T[];
    buffer: string;
};
