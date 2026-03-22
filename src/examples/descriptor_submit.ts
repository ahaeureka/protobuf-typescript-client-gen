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

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

import axios, { AxiosInstance } from "axios";

import {
    ListDescriptorVersionsRequest,
    ListDescriptorVersionsResponse,
    RollbackDescriptorRequest,
    RollbackDescriptorResponse,
    UploadProtobufDescriptorRequest,
    UploadProtobufDescriptorResponse,
} from "./proto/service_discovery";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface Config {
    gatewayBaseUrl: string;
    serviceName: string;
    descriptorPath: string;
    apiKey: string;
    version?: string;
    description?: string;
    force?: boolean;
    rollbackTo?: string;
}

function parseArgs(): Config {
    const args = process.argv.slice(2);
    const get = (flag: string): string | undefined => {
        const idx = args.indexOf(flag);
        return idx >= 0 ? args[idx + 1] : undefined;
    };
    const has = (flag: string): boolean => args.includes(flag);

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

function buildClient(baseURL: string, apiKey: string): AxiosInstance {
    return axios.create({
        baseURL,
        headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { "x-api-key": apiKey } : {}),
        },
        timeout: 30_000,
    });
}

async function getActiveVersion(
    client: AxiosInstance,
    serviceName: string
): Promise<string | undefined> {
    const req: ListDescriptorVersionsRequest = {
        service_name: serviceName,
        page_size: 20,
        page_token: "",
    };
    try {
        const res = await client.get<ListDescriptorVersionsResponse>(
            `/api/v1/discovery/descriptors/${encodeURIComponent(serviceName)}/versions`,
            { params: req }
        );
        const active = res.data.versions?.find((v) => v.is_active);
        return active?.version;
    } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
            return undefined;
        }
        throw err;
    }
}

async function uploadDescriptor(
    client: AxiosInstance,
    req: UploadProtobufDescriptorRequest
): Promise<UploadProtobufDescriptorResponse> {
    // descriptor_data is bytes; send as base64 encoded string for JSON transport
    const payload = {
        ...req,
        descriptor_data: Buffer.from(req.descriptor_data as Uint8Array).toString("base64"),
    };
    const res = await client.post<UploadProtobufDescriptorResponse>(
        `/api/v1/discovery/descriptors/${encodeURIComponent(req.service_name)}/upload`,
        payload
    );
    return res.data;
}

async function rollbackDescriptor(
    client: AxiosInstance,
    req: RollbackDescriptorRequest
): Promise<RollbackDescriptorResponse> {
    const res = await client.post<RollbackDescriptorResponse>(
        `/api/v1/discovery/descriptors/${encodeURIComponent(req.service_name)}/rollback`,
        req
    );
    return res.data;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
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
        } else {
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
    } else {
        console.log(`[info] no active version found, fresh upload`);
    }

    console.log(
        `[info] uploading descriptor for ${config.serviceName} ` +
        `(version=${version}, size=${descriptorBytes.length} bytes, sha256=...${hashHex})`
    );

    let resp: UploadProtobufDescriptorResponse;
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
    } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
            console.error(`[error] upload failed: ${err.response?.status} ${JSON.stringify(err.response?.data)}`);
        } else {
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
