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

## Sponsor tools (hackathon)

- **Cursor** — built with Cursor; receipt/policy agent workflow
- **Tavily** — claim grounding for candidate ads
- **Overmind** — trace/evaluation-ready decision log

**Thrad is for after the hack.** Build and demo the publisher trust layer on **stub supply** now; plug in the `ThradProvider` adapter at go-to-market (`ENABLE_THRAD_GTM=1` + `THRAD_API_KEY`). The `AdProvider` boundary is already there so you do not rework policy, receipts, or attribution.

## Key principle

Safety is a hard gate before scoring. A high bid can never override policy.

## Quick start

```bash
npm install
cp env.example .env.local   # add TAVILY_API_KEY=tvly-... on the same line as the variable name
npm test                    # policy + seeded auction tests
npm run dev
```

Health check: `GET /api/health` after deploy.

**Live:** [https://glassbox-ssp.vercel.app](https://glassbox-ssp.vercel.app) · **Presenter:** [?presenter=1](https://glassbox-ssp.vercel.app?presenter=1)

Local: [http://localhost:3000](http://localhost:3000) (`npm run dev`).

**Presenter mode:** default UI hides debug toggles. Add `?debug=1` for NO_SAFE_ADS / API failure / test seed.

## Testing & auction variance

Policy gates (vulnerability, unsupported claims, category blocks) are **rule-based and stable**. Supply auction noise is **non-deterministic by default** so the demo feels live.

| Mode | How | Use when |
|------|-----|----------|
| **Live** | No `seed` in request | Demos, judges — winner/bids can change each run |
| **Seeded** | `seed: "golden-safe"` in API body or `?seed=golden-safe` | Reproducible tests & bug reports |
| **Frozen** | `frozen: true` or `?frozen=1` | Rehearsal with pinned bids (Ledgerly baseline) |

```bash
npm test          # Vitest — same seed ⇒ same winner; policy cases pinned
npm run test:watch
```

Example API call for a stable integration test:

```bash
curl -s -X POST http://localhost:3000/api/run \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"I'\''m choosing accounting software for my 12-person startup.","seed":"golden-safe"}' \
  | jq '.sponsored.advertiser'
```

## Overmind (open source)

GlassBox exports traces compatible with [Overmind OSS](https://github.com/overmind-core/overmind) eval workflows:

- [`overmind/policies.md`](overmind/policies.md) — publisher safety policy IDs
- [`overmind/dataset.json`](overmind/dataset.json) — golden demo cases
- **Export trace JSON** button in the UI after each run

No hosted Overmind API required — clone `overmind-core/overmind` and point eval at exported traces.

## Environment variables

| Variable | Description |
|----------|-------------|
| `TAVILY_API_KEY` | Enables Tavily claim grounding (falls back to stub if unset) |
| `THRAD_API_KEY` | **Post-hack GTM only** — live Thrad supply (ignored unless `ENABLE_THRAD_GTM=1`) |
| `ENABLE_THRAD_GTM` | Set to `1` to use Thrad instead of stub (not needed for hackathon demo) |
| `THRAD_API_URL` | Optional Thrad endpoint override (GTM) |
| `SIMULATE_THRAD_FAILURE` | Set to `1` to force ad-provider failure path (stub or Thrad) |
| `OVERMIND_TRACE_ID` | If set, displayed in trace panel (not faked) |
| `CURSOR_API_KEY` | Optional — for future receipt agent scripts |

Copy `.env.local.example` to `.env.local` and fill in keys as needed.

> Demo runs on **stub candidates** by design. Thrad ships when you go to market — the adapter is isolated behind `AdProvider` so policy, receipts, and attribution stay unchanged.

## Demo script

1. **Opening line:** “Everyone can insert an ad into a chat. GlassBox decides whether an ad should appear, which one earns the placement, why it won, and how the whole decision can be audited.”

2. Click **Run safe commercial prompt** — a safe accounting advertiser wins (varies live); HyperBooks always blocked for unsupported claim; transparency receipt shows full audit trail.

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

**Technologies used:** Next.js, TypeScript, Tailwind, Cursor, Tavily, Overmind-ready traces; stub supply for hack (Thrad adapter ready for GTM)

**Notes:** Publisher-side trust and measurement layer around conversational ads. Hackathon demo uses stub ad supply; Thrad integration is post-hack go-to-market behind `AdProvider`.

## Architecture

```
User prompt
→ prompt safety gate
→ intent classifier
→ ad candidate provider (stub at hack; Thrad adapter at GTM)
→ candidate safety gate
→ Tavily claim grounding
→ score surviving candidates
→ render sponsored response
→ generate transparency receipt
→ log attribution event
→ show trace / Overmind-style evaluation
```
