# Hackathon submission — GlassBox SSP

## Links

- **Repo:** https://github.com/mzdifraia/glassbox-ssp
- **Live demo:** https://glassbox-ssp.vercel.app
- **Walkthrough layout:** https://glassbox-ssp.vercel.app?walkthrough=1
- **Health:** https://glassbox-ssp.vercel.app/api/health

## One-liner

GlassBox helps AI apps decide when a prompt is monetisable, safely serve or suppress sponsored responses, explain every placement, and attribute ROI back to the chat.

## Track

Sell-Side & Measurement

## Technologies

- Next.js 16, TypeScript, Tailwind
- **Cursor** — built with Cursor
- **Tavily** — hybrid claim grounding (policy hard-block + live search)
- **Overmind OSS** — trace export, `overmind/policies.md`, `overmind/dataset.json`
- **Stub supply** for demo (Thrad `AdProvider` in repo for post-hack GTM)

## What to watch

https://glassbox-ssp.vercel.app?walkthrough=1 — **Run both scenarios**

1. **Commercial (A)** — auction runs; HyperBooks blocked on claims
2. **Distress (B)** — `PROMPT_VULNERABILITY_SUPPRESS`, no ad request
3. **System panel** — pipeline IDs, API routes, integration modes
4. **Receipt + trace JSON** export

`?fast=1` skips UI pacing. `?debug=1` shows edge-case toggles.

## Key principle

Safety is a hard gate before scoring. A high bid cannot override policy.
