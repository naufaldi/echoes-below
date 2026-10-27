# Echoes Below

A desktop-browser 3D narrative adventure with a human hero, Mira and Oren, contextual exploration, visible dice, turn-based combat, and optional OpenAI dialogue and voice.

**Public game:** https://echoes-below.naufaldi.chatgpt.site

The expansion has six chapters,46 locations, four race identities, four compact class profiles, shared experience through level8, and a reachable ending. It uses original stories and simplified D&D-inspired rules. Race abilities, full tabletop class features, and a measured24-hour campaign are not shipped claims. Read [current verification/status](docs/EXPANSION_STATUS.md) before describing it as fully tested.

## Play

Choose a character and begin the descent. Select a contextual action, review it, then confirm. The engine saves its result before showing dice and individual turns. Use Next action or Skip presentation to continue. ChapterI's ending offers Continue to ChapterII. An existing local ChapterI adventure remains usable.

AI is optional. Open Settings to connect a personal OpenAI key for the current page. It goes directly to OpenAI and clears on reload; the game server never receives it. Dialogue and game progress are stored on the hosted service under a private browser cookie. Clearing cookies loses access because account recovery is not implemented. Sponsored mode is available in code but disabled until a protected owner secret is configured.

## Local development

Node24+, npm. Install with `npm install`; build with `npm run build`; run `npm start` for the local game at127.0.0.1:4317. `START.command` starts the local production game from Finder. The existing private `.env` may contain OpenAI settings; never commit or print it. Local saves remain in ignored `data/echoes.sqlite` and are not uploaded to Sites.

`npm run dev` starts the Vite client and proxies API requests to the local backend. `npm run dev:server` watches the backend. Use `npm test`, `npm run typecheck:client`, `npm run typecheck:server`, and `npm run typecheck:hosted` for verification. Browser interaction must be checked separately; automated traversal does not measure human campaign duration.

The production build emits `dist/client`, `dist/server/index.js`, and Sites metadata. Hosted runtime uses D1 and owner-scoped saves; generated migrations are in `drizzle/`. Reuse `.openai/hosting.json` and the existing Site registration. Do not initialize another Site or commit personal artifacts/secrets.

## Design and credits

[PRD](docs/PRD.md), [RFC](docs/RFC.md), [goal prompt](docs/GOAL_PROMPT.md), [asset audit](docs/ASSETS.md).

Quaternius created the character, monster and environment assets. Most shipped models are CC0. The adapted Bestiary Imp uses the Quaternius Asset License, not CC0. Source/license manifests are included with the assets. Unused restricted models are excluded from the published game. Baldur’s Gate3 and the Crazy Taxi demo are experiential references; their proprietary content is not copied.

### Audio

Every shipped audio file is listed with its source, author, licence, retrieval date, changes and sha256 in [`public/assets/audio/manifest.json`](public/assets/audio/manifest.json). The build fails if a file is unlisted, its bytes change, or its licence is not CC0-1.0 or CC-BY-4.0. All files were transcoded to AAC (M4A).

- Sound effects: [Kenney](https://kenney.nl) — Casino Audio, Impact Sounds, RPG Audio and Interface Sounds (CC0).
- Dungeon ambience: “Loopable Dungeon Ambience” by JaggedStone, [OpenGameArt](https://opengameart.org/content/loopable-dungeon-ambience) (CC0).
- Combat music: “Determined Pursuit (epic orchestra loop)” by Emma_MA, [OpenGameArt](https://opengameart.org/content/determined-pursuit-epic-orchestra-loop) (CC0).
- Exploration music: “In Darkness” by Of Far Different Nature, [OpenGameArt](https://opengameart.org/content/in-darkness), licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/); transcoded from MP3 to AAC.

The owner approved both music tracks by ear on 27 October 2026.
