import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { callTool, DEMO_BRIEFING, explainDemoChange, toolDefinitions } from './tools.js';

export const PROTOCOL_VERSION = '2025-11-25';
const MAX_BODY_BYTES = 1_000_000;
const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');

function jsonRpcResult(id, result) {
    return { jsonrpc: '2.0', id, result };
}

function jsonRpcError(id, code, message, data) {
    return { jsonrpc: '2.0', id: id ?? null, error: { code, message, ...(data ? { data } : {}) } };
}

function writeJson(response, status, body, extraHeaders = {}) {
    response.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'mcp-protocol-version': PROTOCOL_VERSION,
        ...extraHeaders,
    });
    response.end(body === undefined ? undefined : JSON.stringify(body));
}

function allowedOrigin(request, configuredOrigins) {
    const origin = request.headers.origin;
    if (!origin) return true;
    return configuredOrigins.has(origin);
}

async function readJsonBody(request) {
    const chunks = [];
    let total = 0;
    for await (const chunk of request) {
        total += chunk.length;
        if (total > MAX_BODY_BYTES) throw new Error('Request body is too large');
        chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function serveFile(response, filename, contentType) {
    const contents = await readFile(join(publicDir, filename));
    response.writeHead(200, { 'content-type': contentType, 'cache-control': 'no-store' });
    response.end(contents);
}

export function createVendorBriefingServer(options = {}) {
    const configuredOrigins = new Set(options.allowedOrigins || String(process.env.ALLOWED_ORIGINS || '')
        .split(',').map((origin) => origin.trim()).filter(Boolean));
    configuredOrigins.add('http://127.0.0.1:8787');
    configuredOrigins.add('http://localhost:8787');

    return createServer(async (request, response) => {
        try {
            const url = new URL(request.url, `http://${request.headers.host || '127.0.0.1'}`);

            if (request.method === 'GET' && url.pathname === '/') {
                return await serveFile(response, 'index.html', 'text/html; charset=utf-8');
            }
            if (request.method === 'GET' && url.pathname === '/app.js') {
                return await serveFile(response, 'app.js', 'text/javascript; charset=utf-8');
            }
            if (request.method === 'GET' && url.pathname === '/styles.css') {
                return await serveFile(response, 'styles.css', 'text/css; charset=utf-8');
            }
            if (request.method === 'GET' && url.pathname === '/healthz') {
                return writeJson(response, 200, { status: 'ok', protocolVersion: PROTOCOL_VERSION });
            }
            if (request.method === 'GET' && url.pathname === '/api/demo-briefing') {
                return writeJson(response, 200, DEMO_BRIEFING);
            }
            if (request.method === 'GET' && url.pathname === '/api/demo-follow-up') {
                return writeJson(response, 200, explainDemoChange(url.searchParams.get('vendor')));
            }
            if (url.pathname !== '/mcp') return writeJson(response, 404, { error: 'Not found' });

            if (!allowedOrigin(request, configuredOrigins)) {
                return writeJson(response, 403, jsonRpcError(null, -32000, 'Origin is not allowed'));
            }
            if (request.method === 'GET' || request.method === 'DELETE') {
                response.setHeader('allow', 'POST');
                return writeJson(response, 405, jsonRpcError(null, -32000, 'This stateless server does not expose an SSE stream or sessions'));
            }
            if (request.method !== 'POST') return writeJson(response, 405, jsonRpcError(null, -32000, 'Method not allowed'));

            const accept = request.headers.accept || '';
            if (!accept.includes('application/json') || !accept.includes('text/event-stream')) {
                return writeJson(response, 406, jsonRpcError(null, -32000, 'Accept must include application/json and text/event-stream'));
            }

            const message = await readJsonBody(request);
            if (message?.jsonrpc !== '2.0' || typeof message?.method !== 'string') {
                return writeJson(response, 400, jsonRpcError(message?.id, -32600, 'Invalid Request'));
            }

            if (message.method === 'notifications/initialized') {
                response.writeHead(202, { 'cache-control': 'no-store', 'mcp-protocol-version': PROTOCOL_VERSION });
                return response.end();
            }

            if (message.method === 'initialize') {
                return writeJson(response, 200, jsonRpcResult(message.id, {
                    protocolVersion: PROTOCOL_VERSION,
                    capabilities: { tools: { listChanged: false } },
                    serverInfo: {
                        name: 'vendor-change-briefing',
                        title: 'Vendor Change Briefing',
                        version: '0.1.0',
                        description: 'Evidence-backed vendor policy change briefings for Alexa+.',
                    },
                    instructions: 'Use the demo tool for a zero-cost demonstration. Confirm scope and cost before running live vendor checks.',
                }));
            }

            const protocolHeader = request.headers['mcp-protocol-version'];
            if (protocolHeader !== PROTOCOL_VERSION) {
                return writeJson(response, 400, jsonRpcError(message.id, -32602, 'Unsupported or missing MCP-Protocol-Version', { supported: [PROTOCOL_VERSION] }));
            }

            if (message.method === 'ping') return writeJson(response, 200, jsonRpcResult(message.id, {}));
            if (message.method === 'tools/list') return writeJson(response, 200, jsonRpcResult(message.id, { tools: toolDefinitions }));
            if (message.method === 'tools/call') {
                const name = message.params?.name;
                if (typeof name !== 'string') return writeJson(response, 400, jsonRpcError(message.id, -32602, 'Tool name is required'));
                const result = await callTool(name, message.params?.arguments || {}, options);
                return writeJson(response, 200, jsonRpcResult(message.id, result));
            }

            return writeJson(response, 404, jsonRpcError(message.id, -32601, `Method not found: ${message.method}`));
        } catch (error) {
            return writeJson(response, 400, jsonRpcError(null, -32700, error instanceof Error ? error.message : 'Invalid JSON'));
        }
    });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const host = process.env.HOST || '127.0.0.1';
    const port = Number(process.env.PORT || 8787);
    createVendorBriefingServer().listen(port, host, () => {
        console.log(`Vendor Change Briefing listening at http://${host}:${port}`);
    });
}
