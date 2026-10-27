# Echoes Below: context for coding agents

## What this is
- A desktop-browser 3D RPG that combines three things: **a light novel, a D&D table and a dungeon descent**.
- The pillar order is: the light novel leads, D&D decides, and the dungeon is the stage.
- Read [docs/ROADMAP.md](docs/ROADMAP.md) first. It covers the pillars, decisions, issues and the v1.0 finish line.
- Then read [docs/PRD.md](docs/PRD.md) (presentation contract) and [docs/CHARACTERS.md](docs/CHARACTERS.md) (character and portrait contract).

## How it is built
- The client is React 19, React Three Fiber, three r180 and Vite 8. It uses one WebGL2 canvas.
- The local server is Fastify with SQLite. The hosted server is a Cloudflare Worker with D1.
- The engine (`server/`, with rules and state in `shared/`) decides every outcome. The client only presents saved outcomes and never rolls or rerolls dice.
- Code style is dense one-line TypeScript. Match the surrounding file.
- The gates are `npm test`, `npm run -s typecheck:server`, `typecheck:client`, `typecheck:hosted` and `npm run build` (includes the asset gate).

## Rules
- Player-facing story text follows the copy guide in ROADMAP §6. Never show system wording such as engine, presentation, saved or AI charge.
- Odds and hints shown to the player use public data only (modifier, DC). Private clues and outcomes stay on the server.
- Chapter rooms follow [client/rooms/README.md](client/rooms/README.md). Each chapter edits only its own file and its own kit folder.
- Assets:
  - Environment models must be CC0.
  - Music and SFX must be on the licence allow-list in `scripts/verify-asset-bundle.mjs`.
  - Every file needs a manifest entry with its sha256.
  - Downloads go into a fresh, empty temp directory first.
- Never print or commit `.env`.
- Never deploy without the owner's explicit "deploy". Reuse the existing Site in `.openai/hosting.json`; never create a new one.
- Stop only processes you started, by PID. Never `pkill` or `killall` by pattern, because other agents' servers may be running.
- Work happens on a branch with a PR. Merge only with the owner's approval.
