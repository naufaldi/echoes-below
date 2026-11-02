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
  - Character, creature and prop models must be CC0. The one exception is the Quaternius Asset License, allowed only under `assets/quaternius/` for the Bestiary creature. The allow-list and its reasons are in `scripts/verify-asset-bundle.mjs`.
  - Music and SFX must be on the licence allow-list in `scripts/verify-asset-bundle.mjs`.
  - Every file needs a manifest entry with its sha256.
  - Downloads go into a fresh, empty temp directory first.
- Never print or commit `.env`.
- Never deploy without the owner's explicit "deploy". Reuse the existing Site in `.openai/hosting.json`; never create a new one.
- Stop only processes you started, by PID. Never `pkill` or `killall` by pattern, because other agents' servers may be running.
- Work happens on a branch with a PR. Merge only with the owner's approval.

## 3D asset production and storage
- Always use Tripo to generate new 3D assets for this project. Use Tripo Studio for visual inspection and production evidence; use the Tripo plugin/CLI when appropriate. Do not substitute another 3D generator without the owner's explicit instruction.
- Reference images may be generated separately, then supplied to Tripo. Blender may clean up, adjust UVs, attach equipment, prepare animations, and export the Tripo-generated asset.
- Keep each asset's reference images, original Tripo exports (FBX/GLB and textures), game export, and any Blender source file actually created together under a versioned `output/characters/`, `output/equipment/`, or other appropriate `output/` asset folder in this repository. Do not leave the only copy in Downloads, a tool cache, or Tripo Studio.
- Keep social-media images tied to the same asset version used for game work. Label direct Tripo Studio screenshots separately from local renders and concept images; do not present a concept image or altered render as the actual 3D result.
- Record the Tripo asset ID, generation settings, observed credit costs, geometry/texture checks, and SHA-256 manifest. Preserve original exports when making optimized game variants and record which source they derive from. Do not claim a `.blend` file exists unless one was saved.
- Production archives are not runtime approval. Add files to `public/assets/` only after the existing licence, manifest, budget, and integration checks pass. These rules do not grant permission to commit, push, publish, or deploy.
