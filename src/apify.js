const DEFAULT_ACTOR_ID = 'peterdrucker481~policy-change-monitor';
const MAX_TOOL_PAGES = 25;

function requirePublicHttpUrl(value, field) {
    let parsed;
    try {
        parsed = new URL(value);
    } catch {
        throw new Error(`${field} must be a valid URL`);
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`${field} must use HTTP or HTTPS`);
    }
}

export function validatePolicyCheckInput(input) {
    if (!input || !Array.isArray(input.pages) || input.pages.length === 0) {
        throw new Error('pages must contain at least one public policy page');
    }
    if (input.pages.length > MAX_TOOL_PAGES) {
        throw new Error(`A single voice request is limited to ${MAX_TOOL_PAGES} pages`);
    }
    for (const [index, page] of input.pages.entries()) {
        if (!page || typeof page.url !== 'string') {
            throw new Error(`pages[${index}].url is required`);
        }
        requirePublicHttpUrl(page.url, `pages[${index}].url`);
    }

    const maxTotalChargeUsd = input.maxTotalChargeUsd ?? 1;
    if (!Number.isFinite(maxTotalChargeUsd) || maxTotalChargeUsd <= 0 || maxTotalChargeUsd > 10) {
        throw new Error('maxTotalChargeUsd must be greater than 0 and no more than 10');
    }

    return {
        pages: input.pages.map(({ url, label }) => ({ url, ...(label ? { label: String(label).slice(0, 100) } : {}) })),
        stateStoreName: String(input.stateStoreName || 'vendor-change-briefing').slice(0, 63),
        maxTotalChargeUsd,
    };
}

export async function runPolicyCheck(input, options = {}) {
    const token = options.token || process.env.APIFY_TOKEN;
    if (!token) throw new Error('APIFY_TOKEN is required for live policy checks');

    const validated = validatePolicyCheckInput(input);
    const actorId = encodeURIComponent(options.actorId || process.env.APIFY_ACTOR_ID || DEFAULT_ACTOR_ID);
    const endpoint = new URL(`https://api.apify.com/v2/actors/${actorId}/run-sync-get-dataset-items`);
    endpoint.searchParams.set('clean', 'true');
    endpoint.searchParams.set('timeout', '240');
    endpoint.searchParams.set('maxTotalChargeUsd', String(validated.maxTotalChargeUsd));

    const response = await (options.fetchImpl || fetch)(endpoint, {
        method: 'POST',
        headers: {
            accept: 'application/json',
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            pages: validated.pages,
            stateStoreName: validated.stateStoreName,
            emitBaselines: true,
            emitUnchanged: true,
        }),
        signal: AbortSignal.timeout(250_000),
    });

    if (!response.ok) {
        const detail = (await response.text()).slice(0, 500);
        throw new Error(`Apify policy check failed (${response.status}): ${detail || response.statusText}`);
    }

    const items = await response.json();
    if (!Array.isArray(items)) throw new Error('Apify returned an unexpected result shape');
    return items;
}
