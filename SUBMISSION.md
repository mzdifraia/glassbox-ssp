# Hackathon submission — GlassBox SSP

## Links

Full docs: [README.md](README.md)

| | URL |
|---|-----|
| Repo | https://github.com/mzdifraia/glassbox-ssp |
| Live demo | https://glassbox-ssp.vercel.app |
| Walkthrough (present here) | https://glassbox-ssp.vercel.app?walkthrough=1&fast=1 |
| Health | https://glassbox-ssp.vercel.app/api/health |

## Form copy-paste

| Field | Value |
|-------|--------|
| **Team name** | **Glass Half Blocked** |
| **Project name** | GlassBox SSP |
| **GitHub URL** | https://github.com/mzdifraia/glassbox-ssp |
| **Track** | **Sell-Side & Measurement** |
| **Demo URL** | https://glassbox-ssp.vercel.app?walkthrough=1 — or a 2‑min screen recording if the form requires video |
| **Technologies** | **Overmind**, **Tavily**, **Cursor** *(see notes if only “Cursor SDK” is listed)* |
| **One-line** | GlassBox helps AI apps decide when a prompt is monetisable, safely serve or suppress sponsored responses, explain every placement, and attribute ROI back to the chat. |

### Notes (optional field)

Publisher-side SSP for in-chat ads: 10-gate streaming pipeline (`POST /api/run/stream`), hard policy before scoring, transparency receipt + Overmind trace export. Tavily hybrid claim grounding on Vercel. Stub supply synthesizes candidates per run (templates + random picks—not LLM ad copy); policy blocks are real code. Thrad `AdProvider` wired for post-hack GTM, not used in live demo. Footer on site states demo honesty. `?fast=1` for judging pace.

## Track

Sell-Side & Measurement

## Technologies

- Next.js 16, TypeScript, Tailwind
- **Cursor** — built with Cursor
- **Tavily** — hybrid claim grounding (policy hard-block + live search)
- **Overmind OSS** — trace export, `overmind/policies.md`, `overmind/dataset.json`
- **Stub supply** for demo (Thrad `AdProvider` in repo for post-hack GTM)

## 2-minute demo script

**Setup (before you go on camera):** open  
https://glassbox-ssp.vercel.app?walkthrough=1&fast=1  
Full screen · zoom 100% · mute notifications.

| Time | Say | Do |
|------|-----|-----|
| **0:00–0:12** | “Hi, we’re **Glass Half Blocked**. **GlassBox** is a publisher SSP for AI chat: policy runs *before* an ad can win. We stream every gate, issue a transparency receipt, and export an Overmind trace.” | Point at hero + header badges (Live auction, random inventory, Tavily). |
| **0:12–0:18** | “Two scenarios—commercial, then distress.” | Click **Run both scenarios (commercial → distress)**. |
| **0:18–0:45** | “User asks for accounting software. Supply returns candidates; one trap ad bids highest with a guaranteed savings claim.” | Watch **run status** + **Decision pipeline**. When **Candidate auction** appears: point at **BLOCKED** card—“Higher bid, still blocked by policy, not score.” Point at **WINNER**. |
| **0:45–0:55** | “Receipt says why we served, what we blocked, and what we didn’t store.” | Glance at **Transparency receipt**. |
| **0:55–1:15** | “Second prompt: user is in distress about debt.” | *(Auto-starts after beat pause, or click **B · Distress** if you ran A only.)* |
| **1:15–1:28** | “We suppress at prompt safety—`PROMPT_VULNERABILITY_SUPPRESS`—no ad request, no auction.” | Pipeline stops early; **Compare** row shows commercial vs distress. |
| **1:28–1:48** | “Every run is auditable—export trace JSON for Overmind evals; Tavily grounds claims when the key is set.” | Scroll to trace panel → **Export trace JSON** (optional: open exported JSON 2 sec). |
| **1:48–2:00** | “Safety is a hard gate. Live app and repo are linked in the submission. Questions?” | Point at footer **Demo note** (templates + real policy code). Hold on compare or receipt. |

**If you run over:** skip trace export; say “trace export in repo.”  
**If you run under:** one sentence on random inventory per run on Vercel.

## One-liner

GlassBox helps AI apps decide when a prompt is monetisable, safely serve or suppress sponsored responses, explain every placement, and attribute ROI back to the chat.

## Key principle

Safety is a hard gate before scoring. A high bid cannot override policy.
