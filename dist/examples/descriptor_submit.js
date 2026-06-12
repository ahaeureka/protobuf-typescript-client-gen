"use strict";
/**
 * Descriptor auto-submit example for Stew gateway (TypeScript / Node.js).
 *
 * Demonstrates how a Node.js service submits its compiled .pb descriptor
 * to the Stew gateway on startup via the HTTP REST API.
 *
 * Usage (ts-node):
 *   SERVICE_API_KEY=<key> ts-node examples/descriptor_submit.ts \
 *     --gateway http://127.0.0.1:3012 \
 *     --service stew.api.v1.MyService \
 *     --descriptor /app/proto/my_service.pb
 *
 * Or compile and run:
 *   npx tsc && node dist/examples/descriptor_submit.js ...
 */
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
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const axios_1 = __importDefault(require("axios"));
function parseArgs() {
    const args = process.argv.slice(2);
    const get = (flag) => {
        const idx = args.indexOf(flag);
        return idx >= 0 ? args[idx + 1] : undefined;
    };
    const has = (flag) => args.includes(flag);
    const gatewayBaseUrl = get("--gateway") ?? "http://127.0.0.1:3012";
    const serviceName = get("--service");
    const descriptorPath = get("--descriptor");
    const apiKey = get("--api-key") ?? process.env["SERVICE_API_KEY"] ?? "";
    if (!serviceName || !descriptorPath) {
        console.error("Usage: descriptor_submit.ts --service <name> --descriptor <path.pb> [--gateway <url>] [--api-key <key>]");
        process.exit(1);
    }
    return {
        gatewayBaseUrl,
        serviceName,
        descriptorPath,
        apiKey,
        version: get("--version"),
        description: get("--description"),
        force: has("--force"),
        rollbackTo: get("--rollback"),
    };
}
// ---------------------------------------------------------------------------
// Client helpers
// ---------------------------------------------------------------------------
function buildClient(baseURL, apiKey) {
    return axios_1.default.create({
        baseURL,
        headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { "x-api-key": apiKey } : {}),
        },
        timeout: 30000,
    });
}
async function getActiveVersion(client, serviceName) {
    const req = {
        service_name: serviceName,
        page_size: 20,
        page_token: "",
    };
    try {
        const res = await client.get(`/api/v1/discovery/descriptors/${encodeURIComponent(serviceName)}/versions`, { params: req });
        const active = res.data.versions?.find((v) => v.is_active);
        return active?.version;
    }
    catch (err) {
        if (axios_1.default.isAxiosError(err) && err.response?.status === 404) {
            return undefined;
        }
        throw err;
    }
}
async function uploadDescriptor(client, req) {
    // descriptor_data is bytes; send as base64 encoded string for JSON transport
    const payload = {
        ...req,
        descriptor_data: Buffer.from(req.descriptor_data).toString("base64"),
    };
    const res = await client.post(`/api/v1/discovery/descriptors/${encodeURIComponent(req.service_name)}/upload`, payload);
    return res.data;
}
async function rollbackDescriptor(client, req) {
    const res = await client.post(`/api/v1/discovery/descriptors/${encodeURIComponent(req.service_name)}/rollback`, req);
    return res.data;
}
// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
    const config = parseArgs();
    if (!fs.existsSync(config.descriptorPath)) {
        console.error(`[error] descriptor file not found: ${config.descriptorPath}`);
        process.exit(1);
    }
    const client = buildClient(config.gatewayBaseUrl, config.apiKey);
    // -- rollback path --
    if (config.rollbackTo) {
        console.log(`[info] rolling back ${config.serviceName} to version ${config.rollbackTo}`);
        const resp = await rollbackDescriptor(client, {
            service_name: config.serviceName,
            target_version: config.rollbackTo,
        });
        if (resp.success) {
            console.log(`[info] rollback succeeded, active version: ${resp.active_version}`);
        }
        else {
            console.error(`[error] rollback failed: ${resp.message}`);
            process.exit(1);
        }
        return;
    }
    // -- upload path --
    const descriptorBytes = fs.readFileSync(config.descriptorPath);
    const hashHex = crypto.createHash("sha256").update(descriptorBytes).digest("hex").slice(0, 12);
    const version = config.version ?? `${Math.floor(Date.now() / 1000)}-${hashHex}`;
    // Fetch current active version for optimistic locking
    const previousVersion = await getActiveVersion(client, config.serviceName);
    if (previousVersion) {
        console.log(`[info] current active version: ${previousVersion}`);
    }
    else {
        console.log(`[info] no active version found, fresh upload`);
    }
    console.log(`[info] uploading descriptor for ${config.serviceName} ` +
        `(version=${version}, size=${descriptorBytes.length} bytes, sha256=...${hashHex})`);
    let resp;
    try {
        resp = await uploadDescriptor(client, {
            service_name: config.serviceName,
            descriptor_data: new Uint8Array(descriptorBytes),
            descriptor_version: version,
            description: config.description ?? `auto-submitted at startup, hash=${hashHex}`,
            signature: "",
            force: config.force ?? false,
            previous_version: previousVersion ?? "",
        });
    }
    catch (err) {
        if (axios_1.default.isAxiosError(err)) {
            console.error(`[error] upload failed: ${err.response?.status} ${JSON.stringify(err.response?.data)}`);
        }
        else {
            console.error("[error] upload failed:", err);
        }
        process.exit(1);
    }
    if (!resp.success) {
        console.error(`[error] upload rejected: ${resp.message}`);
        process.exit(1);
    }
    console.log(`[info] upload succeeded, applied version: ${resp.applied_version}`);
    console.log(`[info] discovered services: ${resp.discovered_services?.join(", ") ?? "(none)"}`);
    if (resp.compatibility_warnings?.length) {
        console.warn("[warn] compatibility warnings detected:");
        resp.compatibility_warnings.forEach((w) => console.warn(`  - ${w}`));
        if (!config.force) {
            console.warn("[warn] re-run with --force to ignore warnings");
        }
    }
}
main().catch((err) => {
    console.error("[fatal]", err);
    process.exit(1);
});
