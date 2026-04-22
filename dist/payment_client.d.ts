export type PaymentProviderKind = 'stripe' | 'creem';
export type PaymentOrderStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'canceled' | 'expired';
export type PaymentBillingInterval = 'one_time' | 'monthly' | 'quarterly' | 'yearly';
export interface CheckoutLineItem {
    name: string;
    description?: string;
    amountMinor: number;
    quantity?: number;
    externalProductId?: string;
}
export interface CreateCheckoutInput {
    businessId: string;
    subjectId: string;
    provider: PaymentProviderKind;
    customerEmail?: string;
    currency?: string;
    lineItems: CheckoutLineItem[];
    billingInterval?: PaymentBillingInterval;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    idempotencyKey?: string;
}
export interface CheckoutSession {
    orderId: string;
    providerSessionId: string;
    checkoutUrl: string;
    provider: PaymentProviderKind;
}
export interface PaymentOrder {
    id: string;
    businessId: string;
    subjectId: string;
    provider: PaymentProviderKind;
    providerSessionId: string;
    status: PaymentOrderStatus;
    currency: string;
    totalAmountMinor: number;
    billingInterval: string;
    metadata?: Record<string, string>;
    createdAt?: string;
    updatedAt?: string;
}
export interface RefundInput {
    orderId: string;
    amountMinor?: number;
    reason?: string;
    idempotencyKey?: string;
}
export interface RefundResult {
    refundId: string;
    providerRefundId: string;
    amountMinor: number;
    status: string;
}
export interface ListOrdersInput {
    businessId: string;
    subjectId?: string;
    status?: string;
    pageSize?: number;
    pageToken?: string;
}
export interface ListOrdersResult {
    orders: PaymentOrder[];
    nextPageToken?: string;
}
export interface PaymentPageInfo {
    nextPageToken?: string;
}
export interface PaymentClientOptions {
    /** Base URL of the Stew gateway, e.g. "https://api.example.com". */
    baseUrl: string;
    /** Optional bearer token provider. Called on every request. */
    getAuthToken?: () => string | null | undefined | Promise<string | null | undefined>;
    /** Custom fetch implementation (for tests or React Native). */
    fetch?: typeof fetch;
    /** Extra headers attached to every request. */
    headers?: Record<string, string>;
    /** Base path for payment routes. Defaults to "/api/v1/payments". */
    basePath?: string;
    /** Request timeout in ms. Defaults to 30 000. */
    timeout?: number;
}
export declare class PaymentClientError extends Error {
    readonly status: number;
    readonly payload: unknown;
    readonly isRetryable: boolean;
    constructor(message: string, status: number, payload: unknown);
}
export declare class PaymentClient {
    private baseUrl;
    private basePath;
    private fetchImpl;
    private headers;
    private getAuthToken?;
    constructor(options: PaymentClientOptions);
    private request;
    createCheckout(input: CreateCheckoutInput, signal?: AbortSignal): Promise<CheckoutSession>;
    getOrder(orderId: string, signal?: AbortSignal): Promise<PaymentOrder>;
    listOrders(input: ListOrdersInput, signal?: AbortSignal): Promise<ListOrdersResult>;
    refund(input: RefundInput, signal?: AbortSignal): Promise<RefundResult>;
    listProviders(signal?: AbortSignal): Promise<PaymentProviderKind[]>;
}
