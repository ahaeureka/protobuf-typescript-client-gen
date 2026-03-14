import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { Any } from "./google/protobuf/any";
import { Empty } from "./google/protobuf/empty";
export declare const protobufPackage = "stew.api.v1";
export declare enum Role {
    ADMIN = 0,
    UNRECOGNIZED = -1
}
export declare function roleFromJSON(object: any): Role;
export declare function roleToJSON(object: Role): string;
export declare enum USER_STATUS {
    ACTIVE = 0,
    INACTIVE = 1,
    LOCKED = 2,
    DELETED = 3,
    UNRECOGNIZED = -1
}
export declare function uSER_STATUSFromJSON(object: any): USER_STATUS;
export declare function uSER_STATUSToJSON(object: USER_STATUS): string;
export declare enum UserSvrCode {
    USER_UNKNOWN = 0,
    USER_LOGIN_ERR = 4107,
    USER_TOKEN_EXPIRE_ERR = 4108,
    USER_DISABLED_ERR = 4119,
    /** USER_TOKEN_INVALIDATE_ERR - 非法的token */
    USER_TOKEN_INVALIDATE_ERR = 4109,
    USER_TOKEN_NOT_ACTIVTE_ERR = 4114,
    USER_AUTH_DECRYPT_ERR = 4110,
    USER_ACCOUNT_ERR = 4111,
    USER_PASSWORD_ERR = 4112,
    USER_NOT_FOUND_ERR = 4113,
    USER_AUTH_MISSING_ERR = 4115,
    USER_IDENTITY_MISSING_ERR = 4116,
    USER_APIKEY_NOT_MATCH_ERR = 4117,
    USER_USERNAME_DUPLICATE_ERR = 4118,
    UNRECOGNIZED = -1
}
export declare function userSvrCodeFromJSON(object: any): UserSvrCode;
export declare function userSvrCodeToJSON(object: UserSvrCode): string;
export interface Address {
    formatted: string;
    street_address: string;
    locality: string;
    region: string;
    postal_code: string;
    country: string;
}
export interface User {
    /** @gotags: validate:"required" doc:"Subject - Identifier for the End-User at the Issuer" */
    sub: string;
    /** @gotags: validate:"required" doc:"End-User's full name in displayable form including all name parts, possibly including titles and suffixes" */
    name: string;
    /** @gotags: doc:"Given name(s) or first name(s) of the End-User" json:"given_name" */
    given_name: string;
    /** @gotags: doc:"Surname(s) or last name(s) of the End-User" json:"family_name" */
    family_name: string;
    /** @gotags: doc:"Middle name(s) of the End-User" json:"middle_name" */
    middle_name: string;
    /** @gotags: doc:"Casual name of the End-User that may or may not be the same as the given_name" json:"nickname" */
    nickname: string;
    /** @gotags: doc:"Shorthand name by which the End-User wishes to be referred to at the RP" json:"preferred_username" */
    preferred_username: string;
    /** @gotags: doc:"URL of the End-User's profile page" json:"profile" */
    profile: string;
    /** @gotags: doc:"URL of the End-User's profile picture" json:"picture" */
    picture: string;
    /** @gotags: doc:"URL of the End-User's Web page or blog" json:"website" */
    website: string;
    /** @gotags: doc:"End-User's preferred e-mail address" json:"email" */
    email: string;
    /** @gotags: doc:"True if the End-User's e-mail address has been verified; otherwise false" json:"email_verified" */
    email_verified: boolean;
    /** @gotags: doc:"End-User's gender. Values defined by this specification are female and male" */
    gender: string;
    /** @gotags: doc:"End-User's birthday, represented as an ISO 8601-1 YYYY-MM-DD format" json:"birthdate" */
    birthdate: string;
    /** @gotags: doc:"String from IANA Time Zone Database representing the End-User's time zone" json:"zoneinfo" */
    zoneinfo: string;
    /** @gotags: doc:"End-User's locale, represented as a BCP47 language tag" json:"locale" */
    locale: string;
    /** @gotags: doc:"End-User's preferred telephone number. E.164 format is recommended" json:"phone_number" */
    phone_number: string;
    /** @gotags: doc:"True if the End-User's phone number has been verified; otherwise false" json:"phone_number_verified" */
    phone_number_verified: boolean;
    /** @gotags: doc:"End-User's preferred postal address" json:"address" gorm:"type:json" */
    address: Address[];
    /** @gotags: doc:"Time the End-User's information was last updated" json:"updated_at" gorm:"type:bigint" */
    updated_at: number;
    /** @gotags: validate:"required" doc:"Unique identifier for the user" json:"id" primary:"primary_key" gorm:"column:id;type:varchar(36);primaryKey;comment:Unique identifier for the user" */
    id: string;
    /** @gotags: doc:"Owner of the user" json:"owner" gorm:"column:owner;type:varchar(36);index;comment:Owner of the user" */
    owner: string;
    /** @gotags: doc:"Type of the user" json:"type" gorm:"column:type;type:varchar(32);index;comment:Type of the user" */
    type: string;
    /** @gotags: validate:"required" doc:"Password of the user" json:"password" gorm:"column:password;type:varchar(128);comment:Password of the user" */
    password: string;
    /** @gotags: doc:"Salt for the password" json:"password_salt" gorm:"column:password_salt;type:varchar(64);comment:Salt for the password" */
    password_salt: string;
    /** @gotags: doc:"Type of the password" json:"password_type" gorm:"column:password_type;type:varchar(32);comment:Type of the password" */
    password_type: string;
    /** @gotags: doc:"Display name of the user" json:"display_name" gorm:"column:display_name;type:varchar(128);index;comment:Display name of the user" */
    display_name: string;
    /** @gotags: doc:"First name of the user" json:"first_name" gorm:"column:first_name;type:varchar(64);comment:First name of the user" */
    first_name: string;
    /** @gotags: doc:"Last name of the user" json:"last_name" gorm:"column:last_name;type:varchar(64);comment:Last name of the user" */
    last_name: string;
    /** @gotags: doc:"Avatar URL of the user" json:"avatar" gorm:"column:avatar;type:varchar(512);comment:Avatar URL of the user" */
    avatar: string;
    /** @gotags: doc:"Type of the avatar" json:"avatar_type" gorm:"column:avatar_type;type:varchar(32);comment:Type of the avatar" */
    avatar_type: string;
    /** @gotags: doc:"Permanent avatar URL of the user" json:"permanent_avatar" gorm:"column:permanent_avatar;type:varchar(512);comment:Permanent avatar URL of the user" */
    permanent_avatar: string;
    /** @gotags: doc:"Additional properties of the user" json:"properties" gorm:"column:properties;type:json;comment:Additional properties of the user" */
    properties: {
        [key: string]: Any;
    };
}
export interface User_PropertiesEntry {
    key: string;
    value: Any | undefined;
}
export interface BasicAuth {
    uid: string;
    name: string;
    role: Role;
    audience: string;
    issuer: string;
    not_before: number;
    expiration: number;
    issued_at: number;
    is_keep_login: boolean;
    token: string;
}
export interface PostUserRequest {
    name: string;
    password: string;
    email: string;
    phone: string;
    role: Role;
    status: USER_STATUS;
    dept: string;
    owner: string;
    /** @gotags: doc:"account avatar" gorm:"type:varchar(512);comment:Users account avatar" */
    avatar: string;
    /** @gotags: validate:"required" */
    tenant_id: string;
    /** @gotags: gorm:"-" json:"-" */
    update_mask: string[] | undefined;
}
export interface GetUserRequest {
    uid: string;
}
export interface DeleteUserRequest {
    uid: string;
}
export interface DeleteUserResponse {
    uid: string;
}
export interface PatchUserRequest {
    uid: string;
    name: string;
    password: string;
    email: string;
    phone: string;
    role: Role;
    status: USER_STATUS;
    dept: string;
    owner: string;
    /** @gotags: doc:"account avatar" gorm:"type:varchar(512);comment:Users account avatar" */
    avatar: string;
    /** @gotags: gorm:"-" json:"-" */
    update_mask: string[] | undefined;
}
/** 用户更新请求（用于 PUT /auth/user） */
export interface UpdateUserRequest {
    /** 显示名称 */
    display_name: string;
    /** 用户名 */
    preferred_username: string;
    /** 语言偏好 */
    locale: string;
    /** 时区 */
    zoneinfo: string;
    /** 个人网站 */
    website: string;
    /** 头像 URL */
    picture: string;
    /** 名字 */
    given_name: string;
    /** 姓氏 */
    family_name: string;
    /** 昵称 */
    nickname: string;
    /** 性别 */
    gender: string;
    /** 生日 */
    birthdate: string;
}
/** 上传头像请求 */
export interface UploadAvatarRequest {
    /** 头像文件数据 */
    avatar_data: Uint8Array;
    /** 文件名 */
    filename: string;
}
/** 上传头像响应 */
export interface UploadAvatarResponse {
    /** 头像 URL */
    avatar_url: string;
}
export declare const Address: MessageFns<Address>;
export declare const User: MessageFns<User>;
export declare const User_PropertiesEntry: MessageFns<User_PropertiesEntry>;
export declare const BasicAuth: MessageFns<BasicAuth>;
export declare const PostUserRequest: MessageFns<PostUserRequest>;
export declare const GetUserRequest: MessageFns<GetUserRequest>;
export declare const DeleteUserRequest: MessageFns<DeleteUserRequest>;
export declare const DeleteUserResponse: MessageFns<DeleteUserResponse>;
export declare const PatchUserRequest: MessageFns<PatchUserRequest>;
export declare const UpdateUserRequest: MessageFns<UpdateUserRequest>;
export declare const UploadAvatarRequest: MessageFns<UploadAvatarRequest>;
export declare const UploadAvatarResponse: MessageFns<UploadAvatarResponse>;
export interface UserService {
    /**
     * rpc Register(PostUserRequest) returns (User){
     *     option (google.api.http)={
     *         post:"/api/v1/users"
     *         body:"*"
     *     };
     * };
     * rpc Update(PatchUserRequest) returns (User){
     *     option (google.api.http)={
     *         put:"/api/v1/users/{uid}"
     *         body:"*"
     *     };
     */
    Get(request: Empty): Promise<User>;
    /** 更新当前用户信息 */
    Update(request: UpdateUserRequest): Promise<User>;
    /** 上传并更新用户头像 */
    UploadAvatar(request: UploadAvatarRequest): Promise<UploadAvatarResponse>;
}
export declare const UserServiceServiceName = "stew.api.v1.UserService";
export declare class UserServiceClientImpl implements UserService {
    private readonly rpc;
    private readonly service;
    constructor(rpc: Rpc, opts?: {
        service?: string;
    });
    Get(request: Empty): Promise<User>;
    Update(request: UpdateUserRequest): Promise<User>;
    UploadAvatar(request: UploadAvatarRequest): Promise<UploadAvatarResponse>;
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
