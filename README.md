# Vendor Change Briefing

An Alexa+ hackathon prototype that turns public vendor-policy changes into a short, evidence-backed spoken briefing for procurement, privacy, and vendor-risk teams.

The project exposes a self-hosted Model Context Protocol server over Streamable HTTP using protocol version `2025-11-25`. Its live tool calls [Policy Change Monitor](https://apify.com/peterdrucker481/policy-change-monitor) on Apify; a deterministic demo path keeps the judging experience reliable and costs nothing.

## Why this can win

- It solves a specific business workflow rather than presenting a generic assistant.
- The backend is already a published, paid product with preserved before-and-after evidence.
- The same submission can enter Alexa+ as its primary track and layer on AWS Builder plus Open Source.
- The demo supports follow-up questions: what changed, why it matters, and what a reviewer should do next.

## Run locally

Requires Node.js 20 or newer and no package installation.

```powershell
node src/server.js
```

Open `http://127.0.0.1:8787` for the simulated Alexa+ experience. The MCP endpoint is `http://127.0.0.1:8787/mcp`.

For live checks, set `APIFY_TOKEN` in the process environment. The token is sent only in an `Authorization: Bearer` header to Apify. Every live tool request has a caller-controlled cost ceiling and is limited to 25 pages.

## MCP tools

- `get_demo_briefing` — deterministic zero-cost judging path
- `estimate_monitoring_cost` — page-check cost calculator at $0.004/check
- `check_vendor_policies` — live Apify-backed check for up to 25 public policy pages

## Test

```powershell
node --test
```

Tests cover protocol initialization, tool discovery/calls, cost ceilings, missing-credential behavior, origin validation, and the stateless GET response.

## Security posture

- Binds to `127.0.0.1` by default
- Validates browser `Origin` values
- Caps request bodies and live page counts
- Does not accept arbitrary backend/API destinations
- Keeps the Apify token out of URLs and responses
- Leaves fetching safeguards to Policy Change Monitor, which blocks private-network and metadata targets

## Hackathon status

Created during the Build, Ship, Shape hackathon window. AWS deployment, the Bedrock narrative layer, evaluation results, the public demo video, and the Devpost submission draft are still pending.

## License

MIT
