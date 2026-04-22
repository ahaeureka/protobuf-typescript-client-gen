import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "stew.api.v1";
export declare enum PaymentProviderKind {
    PAYMENT_PROVIDER_KIND_UNSPECIFIED = 0,
    PAYMENT_PROVIDER_KIND_STRIPE = 1,
    PAYMENT_PROVIDER_KIND_CREEM = 2,
    UNRECOGNIZED = -1
}
export declare function paymentProviderKindFromJSON(object: any): PaymentProviderKind;
export declare function paymentProviderKindToJSON(object: PaymentProviderKind): string;
export declare enum PaymentOrderStatus {
    PAYMENT_ORDER_STATUS_UNSPECIFIED = 0,
    PAYMENT_ORDER_STATUS_PENDING = 1,
    PAYMENT_ORDER_STATUS_PAID = 2,
    PAYMENT_ORDER_STATUS_FAILED = 3,
    PAYMENT_ORDER_STATUS_REFUNDED = 4,
    PAYMENT_ORDER_STATUS_CANCELED = 5,
    PAYMENT_ORDER_STATUS_EXPIRED = 6,
    UNRECOGNIZED = -1
}
export declare function paymentOrderStatusFromJSON(object: any): PaymentOrderStatus;
export declare function paymentOrderStatusToJSON(object: PaymentOrderStatus): string;
export declare enum PaymentBillingInterval {
    PAYMENT_BILLING_INTERVAL_UNSPECIFIED = 0,
    PAYMENT_BILLING_INTERVAL_ONE_TIME = 1,
    PAYMENT_BILLING_INTERVAL_MONTHLY = 2,
    PAYMENT_BILLING_INTERVAL_QUARTERLY = 3,
    PAYMENT_BILLING_INTERVAL_YEARLY = 4,
    UNRECOGNIZED = -1
}
export declare function paymentBillingIntervalFromJSON(object: any): PaymentBillingInterval;
export declare function paymentBillingIntervalToJSON(object: PaymentBillingInterval): string;
export declare enum PaymentEventType {
    PAYMENT_EVENT_TYPE_UNSPECIFIED = 0,
    PAYMENT_EVENT_TYPE_CHECKOUT_COMPLETED = 1,
    PAYMENT_EVENT_TYPE_PAYMENT_SUCCEEDED = 2,
    PAYMENT_EVENT_TYPE_PAYMENT_FAILED = 3,
    PAYMENT_EVENT_TYPE_SUBSCRIPTION_CREATED = 4,
    PAYMENT_EVENT_TYPE_SUBSCRIPTION_RENEWED = 5,
    PAYMENT_EVENT_TYPE_SUBSCRIPTION_CANCELED = 6,
    PAYMENT_EVENT_TYPE_REFUND_CREATED = 7,
    PAYMENT_EVENT_TYPE_CHARGE_DISPUTED = 8,
    UNRECOGNIZED = -1
}
export declare function paymentEventTypeFromJSON(object: any): PaymentEventType;
export declare function paymentEventTypeToJSON(object: PaymentEventType): string;
export interface CheckoutLineItem {
    name: string;
    description: string;
    amount_minor: number;
    quantity: number;
    external_product_id: string;
}
export interface CreateCheckoutRequest {
    business_id: string;
    subject_id: string;
    provider: PaymentProviderKind;
    customer_email: string;
    currency: string;
    line_items: CheckoutLineItem[];
    billing_interval: PaymentBillingInterval;
    success_url: string;
    cancel_url: string;
    metadata: {
        [key: string]: string;
    };
    idempotency_key: string;
}
export interface CreateCheckoutRequest_MetadataEntry {
    key: string;
    value: string;
}
export interface CreateCheckoutResponse {
    order_id: string;
    provider_session_id: string;
    checkout_url: string;
    provider: PaymentProviderKind;
}
export interface GetPaymentOrderRequest {
    order_id: string;
}
export interface PaymentOrderResponse {
    id: string;
    business_id: string;
    subject_id: string;
    provider: PaymentProviderKind;
    provider_session_id: string;
    status: PaymentOrderStatus;
    currency: string;
    total_amount_minor: number;
    billing_interval: string;
    metadata: {
        [key: string]: any;
    } | undefined;
    created_at: string;
    updated_at: string;
}
export interface ListPaymentOrdersRequest {
    business_id: string;
    subject_id: string;
    status: PaymentOrderStatus;
    page_size: number;
    page_token: string;
}
export interface ListPaymentOrdersResponse {
    orders: PaymentOrderResponse[];
    next_page_token: string;
}
export interface RefundPaymentRequest {
    order_id: string;
    amount_minor: number;
    reason: string;
    idempotency_key: string;
}
export interface RefundPaymentResponse {
    refund_id: string;
    provider_refund_id: string;
    amount_minor: number;
    status: string;
}
export interface PaymentWebhookRequest {
    provider: PaymentProviderKind;
    raw_body: Uint8Array;
    signature: string;
}
export interface PaymentWebhookResponse {
    accepted: boolean;
    event_type: string;
    provider_event_id: string;
    order_id: string;
}
export interface ListPaymentProvidersRequest {
}
export interface ListPaymentProvidersResponse {
    providers: string[];
}
export declare const CheckoutLineItem: MessageFns<CheckoutLineItem>;
export declare const CreateCheckoutRequest: MessageFns<CreateCheckoutRequest>;
export declare const CreateCheckoutRequest_MetadataEntry: MessageFns<CreateCheckoutRequest_MetadataEntry>;
export declare const CreateCheckoutResponse: MessageFns<CreateCheckoutResponse>;
export declare const GetPaymentOrderRequest: MessageFns<GetPaymentOrderRequest>;
export declare const PaymentOrderResponse: MessageFns<PaymentOrderResponse>;
export declare const ListPaymentOrdersRequest: MessageFns<ListPaymentOrdersRequest>;
export declare const ListPaymentOrdersResponse: MessageFns<ListPaymentOrdersResponse>;
export declare const RefundPaymentRequest: MessageFns<RefundPaymentRequest>;
export declare const RefundPaymentResponse: MessageFns<RefundPaymentResponse>;
export declare const PaymentWebhookRequest: MessageFns<PaymentWebhookRequest>;
export declare const PaymentWebhookResponse: MessageFns<PaymentWebhookResponse>;
export declare const ListPaymentProvidersRequest: MessageFns<ListPaymentProvidersRequest>;
export declare const ListPaymentProvidersResponse: MessageFns<ListPaymentProvidersResponse>;
export interface PaymentGatewayService {
    /** Create a checkout session on an external payment platform. */
    CreateCheckout(request: CreateCheckoutRequest): Promise<CreateCheckoutResponse>;
    /** Get a payment order by ID. */
    GetPaymentOrder(request: GetPaymentOrderRequest): Promise<PaymentOrderResponse>;
    /** List payment orders with optional filters. */
    ListPaymentOrders(request: ListPaymentOrdersRequest): Promise<ListPaymentOrdersResponse>;
    /** Refund a payment order (full or partial). */
    RefundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse>;
    /** Receive and process webhook from a payment provider. */
    HandleWebhook(request: PaymentWebhookRequest): Promise<PaymentWebhookResponse>;
    /** List available payment providers. */
    ListPaymentProviders(request: ListPaymentProvidersRequest): Promise<ListPaymentProvidersResponse>;
}
export declare const PaymentGatewayServiceServiceName = "stew.api.v1.PaymentGatewayService";
export declare class PaymentGatewayServiceClientImpl implements PaymentGatewayService {
    private readonly rpc;
    private readonly service;
    constructor(rpc: Rpc, opts?: {
        service?: string;
    });
    CreateCheckout(request: CreateCheckoutRequest): Promise<CreateCheckoutResponse>;
    GetPaymentOrder(request: GetPaymentOrderRequest): Promise<PaymentOrderResponse>;
    ListPaymentOrders(request: ListPaymentOrdersRequest): Promise<ListPaymentOrdersResponse>;
    RefundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse>;
    HandleWebhook(request: PaymentWebhookRequest): Promise<PaymentWebhookResponse>;
    ListPaymentProviders(request: ListPaymentProvidersRequest): Promise<ListPaymentProvidersResponse>;
}
interface Rpc {
    request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
}
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {
    $case: string;
} ? {
    [K in keyof Omit<T, "$case">]?: DeepPartial<T[K]>;
} & {
    $case: T["$case"];
} : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P : P & {
    [K in keyof P]: Exact<P[K], I[K]>;
} & {
    [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
};
export interface MessageFns<T> {
    encode(message: T, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): T;
    fromJSON(object: any): T;
    toJSON(message: T): unknown;
    create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
    fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}
export {};
