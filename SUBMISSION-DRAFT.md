# Devpost submission draft

## Project name

Vendor Change Briefing

## One-line pitch

An Alexa+ MCP workflow that turns quiet changes to vendor terms, privacy policies, DPAs, SLAs, and pricing pages into a short, evidence-backed risk briefing.

## What it does

Vendor Change Briefing gives procurement, privacy, compliance, and vendor-risk teams a conversational summary of what changed across critical suppliers. It preserves dated source evidence, filters common webpage noise, identifies exact before-and-after clauses, assigns materiality, and recommends the next human review step.

The deterministic demo makes judging reliable. The live MCP tool calls the published Policy Change Monitor Actor on Apify and applies a caller-controlled cost ceiling. The same workflow can be used after the hackathon at $0.004 per public page check.

## How it works

1. An MCP client initializes against a self-hosted Streamable HTTP endpoint using protocol version 2025-11-25.
2. The client discovers four tools: a deterministic briefing, an evidence-backed follow-up, a cost estimator, and a live vendor-policy check.
3. Live checks call Policy Change Monitor on Apify, which maintains named baselines across runs.
4. Results include exact changed clauses, categories, materiality, timestamps, hashes, and recommended review actions.
5. The Alexa+ experience speaks the summary first, then answers why a change matters and what the reviewer should do next.

## Why it matters

Vendor agreements routinely change outside renewal cycles. Small risk teams and consultants cannot manually revisit every terms, privacy, DPA, SLA, pricing, and acceptable-use page. Generic webpage alerts create noise; this workflow focuses on contractual meaning and preserves evidence a reviewer can verify.

## Tracks

- Primary: Alexa+
- Mini challenge: Open Source
- Conditional: AWS Builder only after a real AWS integration is implemented, tested, and demonstrated

## Open-source contribution

- Repository: https://github.com/pdrucker48-lab/vendor-change-briefing-mcp
- Contribution: a new MIT-licensed, self-hosted MCP server implementing protocol version 2025-11-25 over Streamable HTTP, with a deterministic demo, Apify integration, cost controls, origin validation, and automated tests
- Why it matters: it provides a reusable reference for turning a stateful monitoring service into an evidence-backed conversational workflow

## Product feedback

### Alexa+ and MCP resources

- Worked well: the minimum MCP version and Streamable HTTP requirement are explicit, and the simulated-experience path lowers the hardware barrier.
- Friction: the resources do not yet provide an Alexa+-specific, end-to-end MCP sample that covers validation, testing, and judging expectations.
- Request: publish a minimal reference server and judging checklist with one verified MCP client interaction.

### Apify API

- Worked well: synchronous Actor execution and pay-per-event cost controls make live monitoring straightforward.
- Friction: voice workflows need clearer examples for timeout and maximum-cost behavior.
- Request: add agent-integration examples that pair a synchronous run with explicit page and spend ceilings.

## Demo video outline — under three minutes

1. Ask: “Alexa, what changed in our critical vendors this week?”
2. Show the concise spoken summary and two material changes.
3. Open one exact clause and the recommended review action.
4. Show MCP initialization, tool discovery, and one live or recorded Apify-backed call.
5. Show the architecture, safety controls, tests, and open-source repository.
6. Close with the production path: a vendor register can run daily for $0.004 per page check.

## Completion checklist

- [x] Public MIT-licensed repository
- [x] MCP 2025-11-25 Streamable HTTP server
- [x] Deterministic zero-cost demo path
- [x] Live Apify tool with a caller-controlled cost ceiling
- [x] Automated tests and local run instructions
- [ ] Second MCP client interoperability evidence
- [ ] Thirty-fixture evaluation with false-positive comparison
- [ ] Public deployment accessible to judges
- [ ] Demo video under three minutes
- [ ] Devpost screenshots and final feedback answers
- [ ] AWS integration, only if pursuing AWS Builder
