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

Open **presenter mode** and hit **Run full story**:

https://glassbox-ssp.vercel.app?presenter=1

1. **Safe commercial** — spotlight: *Higher bid did not win* (HyperBooks blocked)
2. **Vulnerable** — spotlight: *Auction suppressed before any ad request*
3. **Compare panel** — Served vs Suppressed side-by-side
4. **Transparency receipt** + **Export trace JSON** (Overmind-ready)

## Key principle

Safety is a hard gate before scoring. A high bid cannot override policy.
