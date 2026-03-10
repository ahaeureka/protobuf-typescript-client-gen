"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Audit = exports.ApiKey = exports.Authorization = exports.APIResponse = exports.Address = exports.User = exports.LogoutCallbackRequest = exports.LoginCallbackResponse = exports.LogoutRequest = exports.LoginRequest = exports.OpenIDConnectCallbackRequest = exports.AuthServiceClient = void 0;
// Main exports for the protobuf TypeScript client generator
__exportStar(require("./plugin"), exports);
// Re-export auth client which should be browser-safe
var auth_client_1 = require("./auth_client");
Object.defineProperty(exports, "AuthServiceClient", { enumerable: true, get: function () { return __importDefault(auth_client_1).default; } });
var authentication_1 = require("./proto/authentication");
Object.defineProperty(exports, "OpenIDConnectCallbackRequest", { enumerable: true, get: function () { return authentication_1.OpenIDConnectCallbackRequest; } });
Object.defineProperty(exports, "LoginRequest", { enumerable: true, get: function () { return authentication_1.LoginRequest; } });
Object.defineProperty(exports, "LogoutRequest", { enumerable: true, get: function () { return authentication_1.LogoutRequest; } });
Object.defineProperty(exports, "LoginCallbackResponse", { enumerable: true, get: function () { return authentication_1.LoginCallbackResponse; } });
Object.defineProperty(exports, "LogoutCallbackRequest", { enumerable: true, get: function () { return authentication_1.LogoutCallbackRequest; } });
var user_1 = require("./proto/user");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return user_1.User; } });
Object.defineProperty(exports, "Address", { enumerable: true, get: function () { return user_1.Address; } });
var web_1 = require("./proto/stew/api/v1/web");
Object.defineProperty(exports, "APIResponse", { enumerable: true, get: function () { return web_1.APIResponse; } });
exports.Authorization = __importStar(require("./proto/authorization"));
exports.ApiKey = __importStar(require("./proto/apikey"));
exports.Audit = __importStar(require("./proto/audit"));
// Optional utility exports (for advanced usage)
__exportStar(require("./websocket-utils"), exports);
__exportStar(require("./sse-utils"), exports);
__exportStar(require("./websocket-message-utils"), exports);
