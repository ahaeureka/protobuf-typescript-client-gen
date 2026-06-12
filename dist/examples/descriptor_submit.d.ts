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
export {};
