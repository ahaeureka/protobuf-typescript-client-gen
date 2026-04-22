"use strict";
// REST client for the Stew PaymentGatewayService. Follows the same pattern
// as AssetBrowserClient: thin wrapper over the gateway REST endpoints with
// camelCase response normalization.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentClient = exports.PaymentClientError = void 0;
// ---------------------------------------------------------------------------
// Enum maps
// ---------------------------------------------------------------------------
const PROVIDER_TO_PROTO = { stripe: 1, creem: 2 };
const PROVIDER_FROM_PROTO = { 1: 'stripe', 2: 'creem' };
const STATUS_FROM_PROTO = {
    1: 'pending',
    2: 'paid',
    3: 'failed',
    4: 'refunded',
    5: 'canceled',
    6: 'expired',
};
const INTERVAL_TO_PROTO = {
    one_time: 1,
    monthly: 2,
    quarterly: 3,
    yearly: 4,
};
function statusToProto(s) {
    const map = {
        pending: 1,
        paid: 2,
        failed: 3,
        refunded: 4,
        canceled: 5,
        expired: 6,
    };
    return map[s] ?? 0;
}
function str(source, ...keys) {
    for (const k of keys) {
        const v = source[k];
        if (typeof v === 'string')
            return v;
    }
    return '';
}
function num(source, ...keys) {
    for (const k of keys) {
        const v = source[k];
        if (typeof v === 'number')
            return v;
        if (typeof v === 'string') {
            const n = Number(v);
            if (!Number.isNaN(n))
                return n;
        }
    }
    return 0;
}
function joinUrl(...parts) {
    return parts
        .map((p, i) => (i === 0 ? p.replace(/\/+$/, '') : p.replace(/^\/+|\/+$/g, '')))
        .filter(Boolean)
        .join('/');
}
function safeJson(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        return undefined;
    }
}
// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------
class PaymentClientError extends Error {
    constructor(message, status, payload) {
        super(message);
        this.name = 'PaymentClientError';
        this.status = status;
        this.payload = payload;
        this.isRetryable = status === 0 || status === 429 || (status >= 500 && status < 600);
    }
}
exports.PaymentClientError = PaymentClientError;
// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------
function normalizeOrder(raw) {
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
        metadata: (raw.metadata ?? undefined),
        createdAt: str(raw, 'created_at', 'createdAt') || undefined,
        updatedAt: str(raw, 'updated_at', 'updatedAt') || undefined,
    };
}
// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------
class PaymentClient {
    constructor(options) {
        this.baseUrl = options.baseUrl.replace(/\/+$/, '');
        this.basePath = options.basePath ?? '/api/v1/payments';
        this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
        this.headers = options.headers ?? {};
        this.getAuthToken = options.getAuthToken;
    }
    // -- internal transport ---------------------------------------------------
    async request(path, init, signal) {
        const url = joinUrl(this.baseUrl, this.basePath, path);
        const headers = {
            'content-type': 'application/json',
            accept: 'application/json',
            ...this.headers,
            ...(init.headers ?? {}),
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
            const message = (payload && typeof payload === 'object' && 'message' in payload
                ? String(payload.message ?? '')
                : '') || `HTTP ${response.status}`;
            throw new PaymentClientError(message, response.status, payload);
        }
        return payload;
    }
    // -- public API -----------------------------------------------------------
    async createCheckout(input, signal) {
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
        const raw = await this.request('/checkout', { method: 'POST', body: JSON.stringify(body) }, signal);
        return {
            orderId: str(raw, 'order_id', 'orderId'),
            providerSessionId: str(raw, 'provider_session_id', 'providerSessionId'),
            checkoutUrl: str(raw, 'checkout_url', 'checkoutUrl'),
            provider: PROVIDER_FROM_PROTO[num(raw, 'provider')] ?? 'stripe',
        };
    }
    async getOrder(orderId, signal) {
        const raw = await this.request(`/orders/${encodeURIComponent(orderId)}`, { method: 'GET' }, signal);
        return normalizeOrder(raw);
    }
    async listOrders(input, signal) {
        const body = {
            business_id: input.businessId,
            subject_id: input.subjectId ?? '',
            status: input.status ? statusToProto(input.status) : 0,
            page_size: input.pageSize ?? 50,
            page_token: input.pageToken ?? '',
        };
        const raw = await this.request('/orders:list', { method: 'POST', body: JSON.stringify(body) }, signal);
        const orders = Array.isArray(raw.orders)
            ? raw.orders.map(normalizeOrder)
            : [];
        return {
            orders,
            nextPageToken: str(raw, 'next_page_token', 'nextPageToken') || undefined,
        };
    }
    async refund(input, signal) {
        const body = {
            order_id: input.orderId,
            amount_minor: input.amountMinor ?? 0,
            reason: input.reason ?? '',
            idempotency_key: input.idempotencyKey ?? '',
        };
        const raw = await this.request('/refund', { method: 'POST', body: JSON.stringify(body) }, signal);
        return {
            refundId: str(raw, 'refund_id', 'refundId'),
            providerRefundId: str(raw, 'provider_refund_id', 'providerRefundId'),
            amountMinor: num(raw, 'amount_minor', 'amountMinor'),
            status: str(raw, 'status'),
        };
    }
    async listProviders(signal) {
        const raw = await this.request('/providers', { method: 'GET' }, signal);
        return (Array.isArray(raw.providers) ? raw.providers : []);
    }
}
exports.PaymentClient = PaymentClient;
