# Hackathon submission — GlassBox SSP

## Links

- **Repo:** https://github.com/mzdifraia/glassbox-ssp
- **Live demo:** https://glassbox-ssp.vercel.app
- **Presenter:** https://glassbox-ssp.vercel.app?presenter=1
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
- **Stub supply** for the hackathon demo (Thrad `AdProvider` adapter in repo for **post-hack GTM**, not required to judge)

## What to watch (90s)

1. **Step 1 · Safe commercial** — safe advertiser wins (varies live); HyperBooks higher bid **blocked by policy**
2. **Step 2 · Vulnerable** — auction suppressed **before** ad request
3. **Transparency receipt** — full audit trail
4. **Export trace JSON** — Overmind-ready

## Key principle

Safety is a hard gate before scoring. A high bid cannot override policy.
