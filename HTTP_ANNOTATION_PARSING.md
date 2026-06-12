# HTTP 注解解析机制说明

## 概述

这个 protoc TypeScript 插件能够解析 Protocol Buffers 中的 `google.api.http` 注解，从中提取 HTTP 路由和请求方式信息，生成对应的 TypeScript Axios 客户端代码。

## 你的示例

```protobuf
service ApiKeyService {
    // 创建新的 API Key
    rpc CreateApiKey(CreateApiKeyRequest) returns (CreateApiKeyResponse) {
        option (google.api.http) = {
            post: "/api/v1/apikeys"
            body: "*"
        };
        option (pydantic.method_auth) = {
            required: true,
            scopes: ["apikey:create"]
        };
    }
}
```

## 解析流程

### 1. **入口函数** - `parseHttpRule()`

位置：`plugin.ts` 第 560 行左右

```typescript
private parseHttpRule(method: MethodDescriptorProto): HttpRule {
    const methodName = method.getName() || 'unknown';
    
    try {
        const options = method.getOptions();
        if (options) {
            // 尝试从方法选项中提取 HTTP 规则
            const httpRule = this.extractHttpRuleFromOptions(options);
            if (httpRule) {
                return httpRule;
            }
        }
    } catch (error) {
        Logger.error('Error parsing HTTP rule for', methodName, ':', error);
    }
    
    // 默认回退
    return {
        method: 'POST',
        path: '/api/' + this.toSnakeCase(methodName),
        body: true
    };
}
```

**对于你的示例，解析后会返回：**
```typescript
{
    method: 'POST',
    path: '/api/v1/apikeys',
    body: true
}
```

### 2. **HTTP 规则提取** - `extractHttpRuleFromOptions()`

这个方法尝试多种方式提取 `google.api.http` 扩展字段（field number: 72295728）：

```typescript
private extractHttpRuleFromOptions(options: any): HttpRule | null {
    // 方法 1: 直接从扩展字段提取
    const httpRule = this.tryExtractHttpDirectly(options);
    
    // 方法 2: 从二进制序列化数据解析
    const binaryRule = this.tryExtractFromBinary(options);
    
    // 方法 3: 从扩展映射中提取
    const extensionRule = this.tryExtractFromExtensionMap(options);
    
    return httpRule || binaryRule || extensionRule || null;
}
```

### 3. **直接提取** - `tryExtractHttpDirectly()`

最常用的提取方式，访问 protobuf 内部数据结构：

```typescript
private tryExtractHttpDirectly(options: any): HttpRule | null {
    // 检查 wrappers_ 字段（protobuf-js 内部结构）
    if (options.wrappers_ && options.wrappers_['72295728']) {
        const httpRuleWrapper = options.wrappers_['72295728'];
        const httpRuleArray = httpRuleWrapper.array;
        if (httpRuleArray) {
            return this.parseHttpRuleArray(httpRuleArray);
        }
    }
    
    // 检查 extensionObject_
    if (options.extensionObject_ && options.extensionObject_['72295728']) {
        const httpRuleArray = options.extensionObject_['72295728'];
        if (httpRuleArray && Array.isArray(httpRuleArray)) {
            return this.parseHttpRuleArray(httpRuleArray);
        }
    }
    
    return null;
}
```

### 4. **解析 HTTP 规则数组** - `parseHttpRuleArray()`

核心解析逻辑，将 protobuf 数组映射到 HTTP 规则：

```typescript
private parseHttpRuleArray(httpRuleArray: any[]): HttpRule | null {
    // HttpRule proto 定义的字段映射：
    // string selector = 1;     -> array[0]
    // string get = 2;          -> array[1]
    // string put = 3;          -> array[2]  
    // string post = 4;         -> array[3]
    // string delete = 5;       -> array[4]
    // string patch = 6;        -> array[5]
    // string body = 7;         -> array[6]
    // CustomHttpPattern custom = 8; -> array[7]
    
    let method = '';
    let path = '';
    let body = true;
    
    // 检查 GET 方法 (索引 1)
    if (httpRuleArray[1]) {
        method = 'GET';
        path = httpRuleArray[1];
        body = false;
    }
    // 检查 POST 方法 (索引 3)
    else if (httpRuleArray[3]) {
        method = 'POST';
        path = httpRuleArray[3];
    }
    // 检查 PUT 方法 (索引 2)
    else if (httpRuleArray[2]) {
        method = 'PUT';
        path = httpRuleArray[2];
    }
    // 检查 DELETE 方法 (索引 4)
    else if (httpRuleArray[4]) {
        method = 'DELETE';
        path = httpRuleArray[4];
        body = false;
    }
    // 检查 PATCH 方法 (索引 5)
    else if (httpRuleArray[5]) {
        method = 'PATCH';
        path = httpRuleArray[5];
    }
    
    // 检查 body 字段 (索引 6)
    if (httpRuleArray[6] !== undefined) {
        const bodyField = httpRuleArray[6];
        body = bodyField === '*' || bodyField !== '';
    }
    
    if (method && path) {
        return { method, path, body };
    }
    
    return null;
}
```

**对于你的示例：**
- `httpRuleArray[3]` = `"/api/v1/apikeys"` (POST 路径)
- `httpRuleArray[6]` = `"*"` (body 配置)
- 返回：`{ method: 'POST', path: '/api/v1/apikeys', body: true }`

### 5. **二进制解析回退** - `parseHttpRuleFromBinary()`

如果直接提取失败，尝试从二进制数据解析：

```typescript
private parseHttpRuleFromBinary(data: Uint8Array): HttpRule | null {
    let pos = 0;
    let method = '';
    let path = '';
    let body = true;
    
    while (pos < data.length) {
        const tag = data[pos++];
        const fieldNumber = tag >> 3;
        const wireType = tag & 7;
        
        if (wireType === 2) { // Length-delimited (string)
            const length = this.readVarint(data, pos);
            pos += this.getVarintLength(length);
            
            const fieldData = data.slice(pos, pos + length);
            const fieldValue = new TextDecoder('utf-8').decode(fieldData);
            
            switch (fieldNumber) {
                case 2: // post
                    method = 'POST';
                    path = fieldValue;
                    break;
                case 3: // get
                    method = 'GET';
                    path = fieldValue;
                    body = false;
                    break;
                case 4: // put
                    method = 'PUT';
                    path = fieldValue;
                    break;
                case 5: // delete
                    method = 'DELETE';
                    path = fieldValue;
                    body = false;
                    break;
                case 6: // patch
                    method = 'PATCH';
                    path = fieldValue;
                    break;
                case 7: // body
                    body = fieldValue === '*' || fieldValue !== '';
                    break;
            }
            pos += length;
        }
    }
    
    return method && path ? { method, path, body } : null;
}
```

## 生成的客户端代码

对于你的示例，插件会生成如下的 TypeScript 方法：

```typescript
async create_api_key(
    request: CreateApiKeyRequest,
    headers?: Record<string, string>
): Promise<CreateApiKeyResponse> {
    const url = `/api/v1/apikeys`;
    const requestHeaders = { ...headers };
    
    // 因为 auth_required: true，会添加认证头
    const authHeaders = await this.getAuthHeaders();
    Object.assign(requestHeaders, authHeaders);
    
    // 使用 POST 方法，body 为请求对象
    const response: AxiosResponse<any> = await this.client.post(
        url,
        request,
        { headers: requestHeaders }
    );
    
    // 根据响应格式解析
    if (response.data && typeof response.data === 'object') {
        if ('data' in response.data && response.data.data !== undefined) {
            return CreateApiKeyResponse.fromJSON(response.data.data);
        }
        return CreateApiKeyResponse.fromJSON(response.data);
    }
    throw new Error(`Invalid response format: ${JSON.stringify(response.data)}`);
}
```

## 支持的 HTTP 方法

插件支持所有标准的 HTTP 方法：

| Proto 字段 | HTTP 方法 | Array 索引 | 默认 body |
|-----------|----------|-----------|----------|
| `get`     | GET      | 1         | false    |
| `put`     | PUT      | 2         | true     |
| `post`    | POST     | 3         | true     |
| `delete`  | DELETE   | 4         | false    |
| `patch`   | PATCH    | 5         | true     |

## Body 配置

`body` 字段控制如何发送请求数据：

- `body: "*"` - 整个请求对象作为 body（对于你的示例）
- `body: "fieldName"` - 只发送特定字段作为 body
- `body: ""` 或未设置 - 根据 HTTP 方法自动决定
  - POST/PUT/PATCH：默认使用 body
  - GET/DELETE：默认使用 query params

## 认证注解解析

插件也会解析 `pydantic.method_auth` 注解：

```typescript
private parseAuthRule(options: any): { required: boolean; scopes: string[] } {
    const authRule = options?.['pydantic.method_auth'];
    if (!authRule) {
        return { required: false, scopes: [] };
    }
    
    return {
        required: !!authRule.required,
        scopes: authRule.scopes || []
    };
}
```

**对于你的示例：**
- `auth_required` = `true`
- `scopes` = `["apikey:create"]`

## 完整数据流

```
protobuf 定义
    ↓
option (google.api.http) = { post: "/api/v1/apikeys", body: "*" }
    ↓
protoc 编译 → descriptor.pb (二进制)
    ↓
plugin.ts 读取 CodeGeneratorRequest
    ↓
parseHttpRule(method)
    ↓
extractHttpRuleFromOptions(options)
    ↓
tryExtractHttpDirectly / parseHttpRuleArray
    ↓
返回 HttpRule { method: "POST", path: "/api/v1/apikeys", body: true }
    ↓
Handlebars 模板渲染
    ↓
生成 TypeScript 客户端代码
```

## 调试技巧

如果需要调试 HTTP 注解解析，可以：

1. **启用调试日志：**
   ```bash
   DEBUG_PROTOC=true protoc --plugin=... --ts_out=...
   ```

2. **检查生成的代码：**
   生成的客户端文件会包含具体的 HTTP 方法和路径

3. **查看插件输出：**
   插件会输出类似信息到 stderr：
   ```
   [DEBUG] Parsing HTTP rule for method CreateApiKey
   [DEBUG] Found HTTP rule for CreateApiKey: { method: 'POST', path: '/api/v1/apikeys', body: true }
   ```

## 总结

插件通过以下步骤解析 `google.api.http` 注解：

1. 从方法选项中提取扩展字段（field number: 72295728）
2. 解析 protobuf 内部数组结构，映射到 HTTP 规则
3. 支持多种提取方式（直接访问、二进制解析、扩展映射）
4. 返回标准化的 `HttpRule` 对象：`{ method, path, body }`
5. 使用 Handlebars 模板生成对应的 TypeScript 客户端代码

这种设计确保了即使在不同的 protobuf 运行时环境下，也能可靠地提取 HTTP 路由信息。
