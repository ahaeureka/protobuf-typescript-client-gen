#!/usr/bin/env node
/**
 * TypeScript Protoc Plugin for Axios Client Generation
 * Uses Handlebars for template rendering
 */
import { CodeGeneratorRequest, CodeGeneratorResponse } from 'google-protobuf/google/protobuf/compiler/plugin_pb';
declare class AxiosClientPlugin {
    private options;
    registerHandlebarsHelpers(Handlebars: any): void;
    private parseOptions;
    private getOutputFileName;
    /**
     * 计算从 fromPath 到 toPath 的相对路径
     * 例如: fromPath="../web/src/services", toPath="../web/src/proto"
     * 返回: "../proto"
     */
    private calculateRelativePath;
    /**
     * 获取导入模型的相对路径
     * 如果设置了 ts_out 和 axios_out，计算相对路径
     * 否则使用默认的 './' 前缀
     */
    private getModelImportPath;
    private parseHttpRule;
    private extractHttpRuleFromOptions;
    private tryExtractHttpDirectly;
    private parseHttpRuleArray;
    private tryExtractFromBinary;
    private tryExtractFromExtensionMap;
    private parseHttpExtension;
    private parseHttpRuleFromUnknownField;
    private parseHttpRuleFromBinary;
    private parseHttpRuleMessage;
    private readVarint;
    private getVarintLength;
    private skipField;
    private parseAuthRule;
    /**
     * 获取服务级别的 http_response 选项
     * Field number: 50038
     */
    private getServiceHttpResponse;
    /**
     * 获取服务级别的 auth_required 选项
     * Field number: 50033
     */
    private getServiceAuthRequired;
    /**
     * 判断方法是否应该使用 HttpResponse 包装
     * Field number for dont_use_http_response: 50041
     */
    private shouldUseHttpResponse;
    /**
     * 判断方法是否是重定向响应
     * Field number for is_redirect: 50035
     */
    private isRedirectMethod;
    /**
     * 获取方法级别的认证要求
     * Method-level options override service-level options
     * Field number for use_auth: 50042
     * Field number for dont_auth_reqiured: 50034
     */
    private getMethodAuthRequired;
    /**
     * 通用方法：从选项中提取扩展字段
     */
    private getExtensionField;
    private getStreamingType;
    private toSnakeCase;
    private toPascalCase;
    private extractTypeName;
    private isWellKnownType;
    private generateImports;
    private packageToFileName;
    private processFile;
    private processField;
    generate(request: CodeGeneratorRequest): CodeGeneratorResponse;
}
export { AxiosClientPlugin };
