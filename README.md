# makefun-gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/hanzzuan/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/hanzzuan/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Neon Coast — Cover Studio**: an offline web app that turns any photo into a multi-panel poster-style cover with a sunset or neon colour grade, exported as a PNG to share. Built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty, $250 in USDC.

## What it does

- **Any photo** — load up to four photos from your machine (or use the two bundled samples) and fill the panels with one photo or several.
- **Four layouts** — four-panel grid, hero-and-three, tilted snapshots, and full bleed.
- **Four colour grades** — Sunset, Neon night, Palm gold, and Noir, each with its own wash, sun glow, vignette and film grain.
- **Crop and position** — click a panel to select it, drag to pan its photo, use the zoom slider to crop in.
- **Lettering** — a bold stacked caption with an accent rule and an italic subtitle, fitted to the cover.
- **Fast export** — one click exports a PNG in 1080 x 1080, 1080 x 1350 or 1920 x 1080.

Everything is original: no game logos, artwork or fonts. Photos never leave the machine and the app makes no network request.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — or open `app/index.html` from any static file server.

## How it works

- `app/src/cover.js` — the cover engine: layouts, grades, lettering, grain.
- `app/src/main.js` — the editor: photo slots, panel selection and dragging, export.
- `app/src/shots.js` — fixed `?shot=` scenes used to take the screenshots.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
