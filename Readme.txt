# 🚀 NOVA — Neural Orbital Virtual Assistant

A purpose-built space exploration chatbot powered by Claude (Anthropic). NOVA is your expert AI guide to the cosmos — ask it about NASA missions, black holes, planets, astronauts, telescopes, and everything in between.

**[Live Demo →](https://your-vercel-url.vercel.app)**

---

## Why Space Exploration?

Space is the topic where I never run out of curiosity. From the Saturn V rocket's engineering to the James Webb telescope's first light images to the unsolved mystery of dark matter — every answer opens three new questions. That made it a natural fit for a purpose-built chatbot: one where the *depth of the knowledge base* and the *quality of the system prompt* genuinely matter.

---

## What I Built

A fully client-side, single-page chatbot with zero backend required. The Anthropic API is called directly from the browser (users supply their own API key, stored only in `localStorage`).

### Features

**Product thinking:**
- 🌠 **Landing screen** — first thing users see is a hero with an animated planet, starter questions as pills, and a clear CTA. Not just a blank chat box.
- 💬 **Conversation flow** — full multi-turn context window (last 20 messages kept), so the bot remembers earlier parts of the chat
- ⌛ **Loading state** — animated three-dot typing indicator (not a spinner) so it feels like the bot is "thinking"
- ❌ **Error states** — human-friendly messages for 401 (bad key), 429 (rate limit), 529 (overload), and generic API errors
- 🌌 **Empty state** — when no messages exist, a floating rocket icon and 4 suggestion cards help users get started
- 📱 **Responsive** — works on mobile and desktop, textarea auto-grows, keyboard shortcuts (Enter to send, Shift+Enter for newline)

**Design details:**
- Deep space dark theme with animated starfield canvas (220 stars + nebula blobs)
- `Orbitron` display font for headers/logo, `Space Mono` for data/timestamps, `Inter` for body text
- Animated orbit ring (planet + moon) as the logo
- Smooth screen transitions (landing → chat → back)
- Markdown-like formatting in bot responses: bold, italic, headers, bullet lists, inline code

**AI quality:**
- Detailed system prompt that defines NOVA's persona, knowledge scope, and formatting rules
- Out-of-scope redirect: asks off-topic questions are gently refused and redirected
- Precise, enthusiastic tone — not generic chatbot language

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Vanilla HTML + CSS + JavaScript (no frameworks) |
| AI | Claude claude-sonnet-4-20250514 (Anthropic API) |
| Fonts | Google Fonts (Orbitron, Space Mono, Inter) |
| Deployment | Vercel (static) |

No build step. No npm. No frameworks. Just three files.

---

## Getting Started (Local)

```bash
git clone https://github.com/yourusername/nova-space-chatbot
cd nova-space-chatbot

# Open in browser — no build step needed
open index.html
# or
npx serve .
```

On first launch, you'll be prompted for your Anthropic API key (`sk-ant-…`). Get one free at [console.anthropic.com/keys](https://console.anthropic.com/keys).

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Or connect your GitHub repo in the Vercel dashboard — it'll auto-detect the static site config from `vercel.json`.

---

## Project Structure

```
nova-space-chatbot/
├── index.html      # App structure + modals
├── style.css       # All styling — space theme, animations, responsive
├── app.js          # State, API calls, UI logic, starfield canvas
├── vercel.json     # Static deployment config
└── README.md
```

---

## Design Decisions

**Why no framework?** The assignment spec said "Plain HTML/CSS/JS". More importantly, it keeps the bundle at 0 KB extra and lets the code speak for itself.

**Why client-side API calls?** Keeps the app serverless and free to deploy. Users supply their own key — no secrets stored server-side, no proxy needed.

**Why Orbitron font?** It's been used in NASA visualizations and sci-fi interfaces for years. It immediately communicates "space" without being clichéd — unlike generic sans-serifs.

**What I'd add with more time:**
- Streaming responses (SSE) for a live typewriter effect
- A knowledge base sidebar with links to NASA mission pages
- Voice input via Web Speech API
- Shareable conversation permalinks

---

*Built for Thinkly Labs Software Engineering assignment — March 2025*
