# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

周易学习 (Zhouyi Learning) — a mobile-first Chinese web app for studying the I Ching (Book of Changes). Built with React 18 + Vite + Tailwind CSS, with a Cloudflare Workers API backend using KV storage.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

No test framework or linter is configured.

## Architecture

**Two deploy targets in one repo:**

- **Root (`/`)** — React frontend. Deployed to Cloudflare Pages (auto-build on push to main via `npm run build`).
- **`workers/`** — Cloudflare Workers API. Deployed separately via GitHub Actions (`.github/workflows/deploy.yml`) triggered by changes to `workers/` files.

**Frontend** (`src/`):
- `App.jsx` — Root component. Manages all user state (learned/memorized/favorites) via `useState`, passed as props to pages. Loads data from API on mount, falls back silently.
- `pages/` — Five route pages: `HomePage`, `HexagramsPage`, `HexagramDetailPage`, `DivinationPage`, `LibraryPage`, `ProfilePage`.
- `components/Navigation.jsx` — Bottom tab bar (fixed). Four tabs: 卦象, 占卜, 书库, 我的.
- `api/client.js` — API layer targeting `zhouyi-api.pillarbialexi.workers.dev`. Auto-generates a user ID stored in localStorage.
- `data/hexagrams.json` — All 64 hexagrams with trigrams, names, judgments, lines (爻辞).
- `data/bagua.js` — Eight trigrams with symbols, elements, qualities.

**Backend** (`workers/src/index.js`):
- Single Worker handling all `/api/*` routes: progress, favorites, history, notes, health.
- Also serves static files from KV with SPA fallback.
- User identity via `?user=` query param (no auth).
- KV namespace binding: `ZHOUYI_KV`.

**Routing** (react-router-dom v6):
- `/` — Home (today's hexagram, progress stats, bagua, 64-hexagram grid)
- `/hexagrams` — Hexagram list with filters
- `/hexagrams/:id` — Detail view (judgment, lines, notes, learning toggles)
- `/divination` — Coin-toss divination simulation
- `/library` — Bagua explanations and theory
- `/profile` — User stats, divination history, notes

## Styling

Tailwind CSS with a dark/gold theme. Key custom colors: `primary` (#0D0D0D), `surface` (#1A1A1A), `card` (#252525), `gold` (#D4AF37), `gold-light` (#F5D77A). Content paths configured in `tailwind.config.js`. PostCSS processes Tailwind + Autoprefixer.

## Key Conventions

- All UI text is in Chinese (zh-CN).
- No state management library — state lives in `App.jsx` and is drilled via props.
- No auth system — users are identified by a random localStorage-generated ID.
- The frontend build uses `base: './'` (relative paths) for Cloudflare Pages compatibility.
