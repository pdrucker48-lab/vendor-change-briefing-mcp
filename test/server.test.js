import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createVendorBriefingServer, PROTOCOL_VERSION } from '../src/server.js';

async function withServer(run) {
    const server = createVendorBriefingServer({ allowedOrigins: ['https://allowed.example'] });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    try {
        await run(`http://127.0.0.1:${address.port}`);
    } finally {
        server.close();
        await once(server, 'close');
    }
}

const mcpHeaders = {
    accept: 'application/json, text/event-stream',
    'content-type': 'application/json',
    'mcp-protocol-version': PROTOCOL_VERSION,
};

test('initializes as a 2025-11-25 Streamable HTTP MCP server', async () => withServer(async (base) => {
    const response = await fetch(`${base}/mcp`, {
        method: 'POST',
        headers: { accept: mcpHeaders.accept, 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: 'test', version: '1' } } }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.result.protocolVersion, PROTOCOL_VERSION);
    assert.ok(body.result.capabilities.tools);
}));

test('lists and calls the deterministic tools', async () => withServer(async (base) => {
    const list = await fetch(`${base}/mcp`, {
        method: 'POST', headers: mcpHeaders,
        body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
    });
    const listed = await list.json();
    assert.deepEqual(listed.result.tools.map((tool) => tool.name), ['get_demo_briefing', 'estimate_monitoring_cost', 'explain_demo_change', 'check_vendor_policies']);

    const call = await fetch(`${base}/mcp`, {
        method: 'POST', headers: mcpHeaders,
        body: JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'estimate_monitoring_cost', arguments: { pages: 500, checksPerMonth: 30 } } }),
    });
    const called = await call.json();
    assert.equal(called.result.structuredContent.pageChecks, 15000);
    assert.equal(called.result.structuredContent.grossCostUsd, 60);

    const followUp = await fetch(`${base}/mcp`, {
        method: 'POST', headers: mcpHeaders,
        body: JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'explain_demo_change', arguments: { vendor: 'Stripe' } } }),
    });
    const explained = await followUp.json();
    assert.match(explained.result.structuredContent.whyItMatters, /operating costs/);
}));

test('returns a safe tool error when live Apify credentials are absent', async () => withServer(async (base) => {
    const response = await fetch(`${base}/mcp`, {
        method: 'POST', headers: mcpHeaders,
        body: JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'check_vendor_policies', arguments: { pages: [{ url: 'https://example.com/terms' }] } } }),
    });
    const body = await response.json();
    assert.equal(body.result.isError, true);
    assert.match(body.result.structuredContent.error, /APIFY_TOKEN/);
}));

test('rejects untrusted browser origins and unsupported GET streams', async () => withServer(async (base) => {
    const blocked = await fetch(`${base}/mcp`, {
        method: 'POST',
        headers: { ...mcpHeaders, origin: 'https://evil.example' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'ping' }),
    });
    assert.equal(blocked.status, 403);
    const get = await fetch(`${base}/mcp`, { headers: { accept: 'text/event-stream' } });
    assert.equal(get.status, 405);
}));

test('homepage links the demo to the paid monitoring workflow', async () => withServer(async (base) => {
    const response = await fetch(`${base}/`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /\$0\.004/);
    assert.match(html, /apify\.com\/peterdrucker481\/policy-change-monitor/);
    assert.match(html, /enterprise-vendor-policy-pack/);
}));

test('demo supports evidence-backed follow-up questions', async () => withServer(async (base) => {
    const response = await fetch(`${base}/api/demo-follow-up?vendor=Stripe`);
    assert.equal(response.status, 200);
    const detail = await response.json();
    assert.equal(detail.vendor, 'Stripe');
    assert.match(detail.whyItMatters, /operating costs/);
    assert.match(detail.recommendedAction, /procurement/);
}));
