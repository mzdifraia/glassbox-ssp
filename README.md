# GlassBox SSP

[![GitHub](https://img.shields.io/badge/GitHub-mzdifraia%2Fglassbox--ssp-181717?style=flat&logo=github)](https://github.com/mzdifraia/glassbox-ssp)

GlassBox is a publisher-side trust and measurement layer for AI-native ads.

It helps AI apps:

- decide whether a prompt is monetisable
- suppress ads in vulnerable contexts
- block unsafe or unsupported ad candidates
- serve transparent sponsored responses
- explain why an ad appeared
- attribute clicks and conversions back to chat sessions
- trace every decision step for auditability

## Track

Sell-Side & Measurement

## Sponsor tools

- **Cursor**: built with Cursor; receipt/policy agent workflow
- **Thrad**: ad-provider adapter for native sponsored responses
- **Tavily**: claim grounding for candidate ads
- **Overmind**: trace/evaluation-ready decision log
- **Alpic**: optional tool endpoint deployment if time permits

## Key principle

Safety is a hard gate before scoring. A high bid can never override policy.

## Quick start

```bash
npm install
cp env.example .env.local   # add TAVILY_API_KEY=tvly-... on the same line as the variable name
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Presenter mode:** default UI hides debug toggles. Add `?debug=1` for NO_SAFE_ADS / API failure tests.

## Overmind (open source)

GlassBox exports traces compatible with [Overmind OSS](https://github.com/overmind-core/overmind) eval workflows:

- [`overmind/policies.md`](overmind/policies.md) — publisher safety policy IDs
- [`overmind/dataset.json`](overmind/dataset.json) — golden demo cases
- **Export trace JSON** button in the UI after each run

No hosted Overmind API required — clone `overmind-core/overmind` and point eval at exported traces.

## Environment variables

| Variable | Description |
|----------|-------------|
| `THRAD_API_KEY` | Enables live Thrad ad provider (falls back to stub if unset) |
| `TAVILY_API_KEY` | Enables Tavily claim grounding (falls back to stub if unset) |
| `THRAD_API_URL` | Optional Thrad endpoint override |
| `SIMULATE_THRAD_FAILURE` | Set to `1` to force API failure demo path |
| `OVERMIND_TRACE_ID` | If set, displayed in trace panel (not faked) |
| `CURSOR_API_KEY` | Optional — for future receipt agent scripts |

Copy `.env.local.example` to `.env.local` and fill in keys as needed.

> The Thrad adapter is isolated behind `AdProvider`; live credentials can be swapped in without changing the policy or receipt layer.

## Demo script

1. **Opening line:** “Everyone can insert an ad into a chat. GlassBox decides whether an ad should appear, which one earns the placement, why it won, and how the whole decision can be audited.”

2. Click **Run safe commercial prompt** — Ledgerly wins; HyperBooks blocked for unsupported claim; transparency receipt shows full audit trail.

3. **Vulnerability beat:** “Now here’s the dangerous case. This is high commercial intent, but it is also vulnerability.”

4. Click **Run vulnerable prompt** — auction suppressed before ad request; receipt shows suppression only.

5. **Close:** “We think AI-native ads need to optimise for trust before revenue. GlassBox is the sell-side trust and measurement layer that makes that possible.”

## Demo paths

| Path | How to trigger |
|------|----------------|
| SAFE_COMMERCIAL | “Run safe commercial prompt” button |
| SENSITIVE_CONTEXT | “Run vulnerable prompt” button |
| UNSAFE_CANDIDATE | Automatic on safe path (HyperBooks) |
| NO_SAFE_ADS | Check “Force NO_SAFE_ADS” |
| API_FAILURE | Check “Simulate API failure” |

## Submission

**Project name:** GlassBox SSP

**One-line description:** GlassBox helps AI apps decide when a prompt is monetisable, safely serve or suppress sponsored responses, explain every placement, and attribute ROI back to the chat.

**Track:** Sell-Side & Measurement

**Technologies used:** Next.js, TypeScript, Tailwind, Cursor, Tavily, Overmind-ready traces, Thrad adapter (stub fallback)

**Notes:** Publisher-side trust and measurement layer around conversational ads. Includes prompt eligibility gates, hard safety suppression before scoring, Tavily-style claim checks, transparent receipts, attribution events, and Overmind-ready traces. Thrad adapter supports real API credentials if available, with stub fallback.

## Architecture

```
User prompt
→ prompt safety gate
→ intent classifier
→ ad candidate provider / Thrad adapter
→ candidate safety gate
→ Tavily claim grounding
→ score surviving candidates
→ render sponsored response
→ generate transparency receipt
→ log attribution event
→ show trace / Overmind-style evaluation
```
