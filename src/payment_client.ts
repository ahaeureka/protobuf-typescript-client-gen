// REST client for the Stew PaymentGatewayService. Follows the same pattern
// as AssetBrowserClient: thin wrapper over the gateway REST endpoints with
// camelCase response normalization.

// ---------------------------------------------------------------------------
// Types (re-exported from the proto-generated definitions where sensible,
// but kept as simple string unions for consumer ergonomics)
// ---------------------------------------------------------------------------

export type PaymentProviderKind = 'stripe' | 'creem';

export type PaymentOrderStatus =
    | 'pending'
    | 'paid'
    | 'failed'
    | 'refunded'
    | 'canceled'
    | 'expired';

export type PaymentBillingInterval =
    | 'one_time'
    | 'monthly'
    | 'quarterly'
    | 'yearly';

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

// ---------------------------------------------------------------------------
// Client options
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Enum maps
// ---------------------------------------------------------------------------

const PROVIDER_TO_PROTO: Record<string, number> = { stripe: 1, creem: 2 };
const PROVIDER_FROM_PROTO: Record<number, PaymentProviderKind> = { 1: 'stripe', 2: 'creem' };

const STATUS_FROM_PROTO: Record<number, PaymentOrderStatus> = {
    1: 'pending',
    2: 'paid',
    3: 'failed',
    4: 'refunded',
    5: 'canceled',
    6: 'expired',
};

const INTERVAL_TO_PROTO: Record<string, number> = {
    one_time: 1,
    monthly: 2,
    quarterly: 3,
    yearly: 4,
};

function statusToProto(s: string): number {
    const map: Record<string, number> = {
        pending: 1,
        paid: 2,
        failed: 3,
        refunded: 4,
        canceled: 5,
        expired: 6,
    };
    return map[s] ?? 0;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Rec = Record<string, unknown>;

function str(source: Rec, ...keys: string[]): string {
    for (const k of keys) {
        const v = source[k];
        if (typeof v === 'string') return v;
    }
    return '';
}

function num(source: Rec, ...keys: string[]): number {
    for (const k of keys) {
        const v = source[k];
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
            const n = Number(v);
            if (!Number.isNaN(n)) return n;
        }
    }
    return 0;
}

function joinUrl(...parts: string[]): string {
    return parts
        .map((p, i) => (i === 0 ? p.replace(/\/+$/, '') : p.replace(/^\/+|\/+$/g, '')))
        .filter(Boolean)
        .join('/');
}

function safeJson(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return undefined;
    }
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class PaymentClientError extends Error {
    public readonly status: number;
    public readonly payload: unknown;
    public readonly isRetryable: boolean;
    constructor(message: string, status: number, payload: unknown) {
        super(message);
        this.name = 'PaymentClientError';
        this.status = status;
        this.payload = payload;
        this.isRetryable = status === 0 || status === 429 || (status >= 500 && status < 600);
    }
}

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

function normalizeOrder(raw: Rec): PaymentOrder {
    return {
        id: str(raw, 'id'),
        businessId: str(raw, 'business_id', 'businessId'),
        subjectId: str(raw, 'subject_id', 'subjectId'),
        provider: PROVIDER_FROM_PROTO[num(raw, 'provider')] ?? 'stripe',
        providerSessionId: str(raw, 'provider_session_id', 'providerSessionId'),
        status: STATUS_FROM_PROTO[num(raw, 'status')] ?? 'pending',
        currency: str(raw, 'currency') || 'usd',
        totalAmountMinor: num(raw, 'total_amount_minor', 'totalAmountMinor'),
        billingInterval: str(raw, 'billing_interval', 'billingInterval'),
        metadata: (raw.metadata ?? undefined) as Record<string, string> | undefined,
        createdAt: str(raw, 'created_at', 'createdAt') || undefined,
        updatedAt: str(raw, 'updated_at', 'updatedAt') || undefined,
    };
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class PaymentClient {
    private baseUrl: string;
    private basePath: string;
    private fetchImpl: typeof fetch;
    private headers: Record<string, string>;
    private getAuthToken?: () => string | null | undefined | Promise<string | null | undefined>;

    constructor(options: PaymentClientOptions) {
        this.baseUrl = options.baseUrl.replace(/\/+$/, '');
        this.basePath = options.basePath ?? '/api/v1/payments';
        this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
        this.headers = options.headers ?? {};
        this.getAuthToken = options.getAuthToken;
    }

    // -- internal transport ---------------------------------------------------

    private async request<T>(
        path: string,
        init: RequestInit,
        signal?: AbortSignal,
    ): Promise<T> {
        const url = joinUrl(this.baseUrl, this.basePath, path);
        const headers: Record<string, string> = {
            'content-type': 'application/json',
            accept: 'application/json',
            ...this.headers,
            ...((init.headers as Record<string, string> | undefined) ?? {}),
        };
        if (this.getAuthToken) {
            const token = await this.getAuthToken();
            if (token) {
                headers.authorization = headers.authorization ?? `Bearer ${token}`;
            }
        }
        const response = await this.fetchImpl(url, { ...init, headers, signal });
        const text = await response.text();
        const payload = text ? safeJson(text) : undefined;
        if (!response.ok) {
            const message =
                (payload && typeof payload === 'object' && 'message' in payload
                    ? String((payload as { message?: unknown }).message ?? '')
                    : '') || `HTTP ${response.status}`;
            throw new PaymentClientError(message, response.status, payload);
        }
        return payload as T;
    }

    // -- public API -----------------------------------------------------------

    async createCheckout(
        input: CreateCheckoutInput,
        signal?: AbortSignal,
    ): Promise<CheckoutSession> {
        const body = {
            business_id: input.businessId,
            subject_id: input.subjectId,
            provider: PROVIDER_TO_PROTO[input.provider] ?? 0,
            customer_email: input.customerEmail ?? '',
            currency: input.currency ?? 'usd',
            line_items: input.lineItems.map((li) => ({
                name: li.name,
                description: li.description ?? '',
                amount_minor: li.amountMinor,
                quantity: li.quantity ?? 1,
                external_product_id: li.externalProductId ?? '',
            })),
            billing_interval: INTERVAL_TO_PROTO[input.billingInterval ?? 'one_time'] ?? 1,
            success_url: input.successUrl,
            cancel_url: input.cancelUrl,
            metadata: input.metadata ?? {},
            idempotency_key: input.idempotencyKey ?? '',
        };

        const raw = await this.request<Rec>(
            '/checkout',
            { method: 'POST', body: JSON.stringify(body) },
            signal,
        );
        return {
            orderId: str(raw, 'order_id', 'orderId'),
            providerSessionId: str(raw, 'provider_session_id', 'providerSessionId'),
            checkoutUrl: str(raw, 'checkout_url', 'checkoutUrl'),
            provider: PROVIDER_FROM_PROTO[num(raw, 'provider')] ?? 'stripe',
        };
    }

    async getOrder(orderId: string, signal?: AbortSignal): Promise<PaymentOrder> {
        const raw = await this.request<Rec>(
            `/orders/${encodeURIComponent(orderId)}`,
            { method: 'GET' },
            signal,
        );
        return normalizeOrder(raw);
    }

    async listOrders(
        input: ListOrdersInput,
        signal?: AbortSignal,
    ): Promise<ListOrdersResult> {
        const body = {
            business_id: input.businessId,
            subject_id: input.subjectId ?? '',
            status: input.status ? statusToProto(input.status) : 0,
            page_size: input.pageSize ?? 50,
            page_token: input.pageToken ?? '',
        };
        const raw = await this.request<Rec>(
            '/orders:list',
            { method: 'POST', body: JSON.stringify(body) },
            signal,
        );
        const orders = Array.isArray(raw.orders)
            ? (raw.orders as Rec[]).map(normalizeOrder)
            : [];
        return {
            orders,
            nextPageToken: str(raw, 'next_page_token', 'nextPageToken') || undefined,
        };
    }

    async refund(input: RefundInput, signal?: AbortSignal): Promise<RefundResult> {
        const body = {
            order_id: input.orderId,
            amount_minor: input.amountMinor ?? 0,
            reason: input.reason ?? '',
            idempotency_key: input.idempotencyKey ?? '',
        };
        const raw = await this.request<Rec>(
            '/refund',
            { method: 'POST', body: JSON.stringify(body) },
            signal,
        );
        return {
            refundId: str(raw, 'refund_id', 'refundId'),
            providerRefundId: str(raw, 'provider_refund_id', 'providerRefundId'),
            amountMinor: num(raw, 'amount_minor', 'amountMinor'),
            status: str(raw, 'status'),
        };
    }

    async listProviders(signal?: AbortSignal): Promise<PaymentProviderKind[]> {
        const raw = await this.request<Rec>(
            '/providers',
            { method: 'GET' },
            signal,
        );
        return (Array.isArray(raw.providers) ? raw.providers : []) as PaymentProviderKind[];
    }
}
