# Cash-win plan

## Entry strategy

Primary track: **Alexa+**  
Mini challenges: **AWS Builder** and **Open Source**

Maximum compatible cash outcome: one Alexa+ prize plus one mini-challenge prize.

## Judge-facing thesis

Vendor Change Briefing is the weekly five-minute risk meeting that never gets skipped. A user asks Alexa+ what changed; the system checks the monitored portfolio, distinguishes material clauses from page noise, cites exact evidence, and recommends the next human review step.

## Win-probability levers

1. Make every demo action real: MCP handshake, tool discovery, an Apify call, and a cited result.
2. Preserve a deterministic fallback so the three-minute video cannot fail because a live policy page is unchanged.
3. Add Amazon Bedrock for the conversational synthesis layer and deploy the Streamable HTTP server on AWS for the AWS Builder route.
4. Publish under MIT in a new repository during the contest window and document the reusable MCP implementation for the Open Source route.
5. Evaluate against at least 30 controlled page-change fixtures and report precision, recall, false-positive rate, latency, and cost.
6. Obtain three short structured reactions from procurement, privacy, compliance, or vendor-risk practitioners before filming.
7. Keep a friction/feature log throughout development; the rules allow this to improve the judging score.
8. Film a sub-three-minute story: risk question, live evidence, follow-up action, architecture, metrics, and product feedback.

## Kill criteria

Stop or re-scope before major AWS spend if Streamable HTTP interoperability cannot be demonstrated with a second MCP client, or if the 30-fixture evaluation cannot beat a generic text-diff baseline on false positives.
