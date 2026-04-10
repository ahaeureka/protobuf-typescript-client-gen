import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
export declare const protobufPackage = "stew.api.v1";
/** 权限资源表 (Resources) */
export interface Resource {
    /** @gotags: gorm:"primaryKey;autoIncrement;comment:自增id" */
    ID: number;
    /** @gotags: json:"resource_key" gorm:"column:resource_key;type:varchar(36);comment:资源id" */
    ResourceKey: string;
    /** @gotags: json:"resource_name" gorm:"column:resource_name;type:varchar(128);comment:资源名称" */
    ResourceName: string;
    /** @gotags: json:"resource_table" gorm:"column:resource_table;type:varchar(128);comment:资源表名称" */
    ResourceTable: string;
    /** @gotags: doc:"任务ID" json:"uid" gorm:"column:uid;type:varchar(36);comment:uid" */
    uid: string;
    /** @gotags: doc:"完成时间" gorm:"column:completed_at;type:datetime;serializer:timepb;comment:定时任务的最近一次完成时间" */
    created_at: Date | undefined;
    /** @gotags: doc:"更新时间" gorm:"autoUpdateTime;column:updated_at;type:datetime;serializer:timepb;comment:定时任务的更新时间" */
    updated_at: Date | undefined;
}
export declare const Resource: MessageFns<Resource>;
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
