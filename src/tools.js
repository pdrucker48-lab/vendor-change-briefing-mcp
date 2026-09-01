import { runPolicyCheck } from './apify.js';

export const DEMO_BRIEFING = {
    generatedAt: '2026-09-01T15:00:00.000Z',
    monitoredVendors: 12,
    changedVendors: 2,
    highPriority: 1,
    summary: 'Two vendors changed policy language. Stripe added a material billing clause; Acme Cloud clarified data-retention wording.',
    changes: [
        {
            vendor: 'Stripe',
            document: 'Services Agreement',
            materiality: 'high',
            categories: ['pricing/billing'],
            evidence: 'A new fee-adjustment clause was added.',
            recommendedAction: 'Ask procurement to confirm the effective date and affected products.',
        },
        {
            vendor: 'Acme Cloud',
            document: 'Privacy Policy',
            materiality: 'medium',
            categories: ['data retention'],
            evidence: 'Retention language now distinguishes backups from active records.',
            recommendedAction: 'Review whether the backup-retention period matches the vendor-risk record.',
        },
    ],
};

export const toolDefinitions = [
    {
        name: 'get_demo_briefing',
        title: 'Get Vendor Change Briefing Demo',
        description: 'Return a deterministic briefing that demonstrates the Alexa+ conversation without spending money or calling external services.',
        inputSchema: { type: 'object', additionalProperties: false },
    },
    {
        name: 'estimate_monitoring_cost',
        title: 'Estimate Monitoring Cost',
        description: 'Estimate gross Apify page-check cost at $0.004 per page check for a vendor portfolio and schedule.',
        inputSchema: {
            type: 'object',
            additionalProperties: false,
            properties: {
                pages: { type: 'integer', minimum: 1, maximum: 100000 },
                checksPerMonth: { type: 'integer', minimum: 1, maximum: 1000 },
            },
            required: ['pages', 'checksPerMonth'],
        },
    },
    {
        name: 'check_vendor_policies',
        title: 'Check Vendor Policies',
        description: 'Run Policy Change Monitor on up to 25 public vendor terms, privacy, DPA, SLA, pricing, or acceptable-use pages.',
        inputSchema: {
            type: 'object',
            additionalProperties: false,
            properties: {
                pages: {
                    type: 'array',
                    minItems: 1,
                    maxItems: 25,
                    items: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            url: { type: 'string', format: 'uri' },
                            label: { type: 'string', maxLength: 100 },
                        },
                        required: ['url'],
                    },
                },
                stateStoreName: { type: 'string', minLength: 3, maxLength: 63 },
                maxTotalChargeUsd: { type: 'number', exclusiveMinimum: 0, maximum: 10, default: 1 },
            },
            required: ['pages'],
        },
    },
];

function toolResult(value, isError = false) {
    return {
        content: [{ type: 'text', text: JSON.stringify(value) }],
        structuredContent: value,
        isError,
    };
}

export async function callTool(name, args = {}, options = {}) {
    try {
        if (name === 'get_demo_briefing') return toolResult(DEMO_BRIEFING);

        if (name === 'estimate_monitoring_cost') {
            const pages = Number(args.pages);
            const checksPerMonth = Number(args.checksPerMonth);
            if (!Number.isInteger(pages) || pages < 1 || pages > 100000
                || !Number.isInteger(checksPerMonth) || checksPerMonth < 1 || checksPerMonth > 1000) {
                throw new Error('pages and checksPerMonth must be integers within their documented ranges');
            }
            const pageChecks = pages * checksPerMonth;
            return toolResult({ pageChecks, grossCostUsd: Number((pageChecks * 0.004).toFixed(2)) });
        }

        if (name === 'check_vendor_policies') {
            const results = await runPolicyCheck(args, options);
            const changes = results.filter((item) => item.status === 'changed');
            return toolResult({
                checked: results.length,
                changed: changes.length,
                highPriority: changes.filter((item) => item.materiality === 'high').length,
                results,
            });
        }

        throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
        return toolResult({ error: error instanceof Error ? error.message : String(error) }, true);
    }
}
