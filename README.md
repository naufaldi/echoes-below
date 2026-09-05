# Echoes Below

A playable local 3D narrative dungeon adventure. Lead one hero and two companions through Briarwatch, choose actions, roll checks, talk with AI characters, and resolve the bell chamber by combat or negotiation.

**Play:** http://127.0.0.1:4317

The server must be running on this Mac. Open `START.command` to restart it, or run `npm start` from this directory. Node 24 is required. The current production client is already built; after code changes run `npm run build`.

## Playing

1. Choose Guardian, Scout, or Adept, then a name, background, and appearance.
2. Select an object or use the Focus menu. Scroll the action list to see all choices.
3. Read the confirmation and take the action. The server rolls dice and saves the result.
4. During combat, movement and one action are separate. **End turn** lets companions and enemies act. Companions use real AI choices with a legal tactical fallback when unavailable. **Gather party at exit** coordinates a retreat.
5. Talk to Mira, Oren, or the Dungeon Master. AI dialogue can be spoken automatically, replayed, stopped, or muted in settings. **Speak** records up to 30 seconds; review the transcript before submitting it.
6. Use the journal for discoveries, dice, and saved conversations. Every game action autosaves locally. Continue returns to the last selected adventure.

The microphone requires browser permission. Text controls remain available. Voices are AI-generated. The private server environment supplies the OpenAI key; it is never bundled into browser code.

## Delivered scope

This is the complete **compact opening adventure**, with six scenes and a reachable ending. The planned 24-hour campaign, expanded chapters, and fresh-player duration studies are future work. It is an original simplified fantasy ruleset inspired by tabletop play.

The 3D scene uses Quaternius characters and adapted free Bestiary monsters, with original modular scenery. Camera orbit and zoom are supported. Movement uses authored open-room anchors; presentation interpolates authoritative snapshots. It does not simulate an unrestricted world or animate every imagined action.

## Project documents

- [PRD](docs/PRD.md): product vision, campaign outline, numbered requirements.
- [RFC](docs/RFC.md): architecture, rules, AI and voice decisions, asset research.
- [Implementation plan and reusable goal prompt](docs/IMPLEMENTATION.md).
- [Implemented API](docs/API.md): exact current integration contract.
- [Asset ledger and licenses](docs/ASSETS.md).
- [Verification report](docs/VERIFICATION.md): actual checks, evidence and remaining limitations.

## Development

`npm install` installs dependencies. `npm run dev:server` starts the API on 4317; `npm run dev` starts Vite on 5173. Production serves `dist` directly from the API.

Validation: `npm test`, `npm run typecheck:server`, `npm run typecheck:client`, `npm run build`.

Saves, conversation history, audio cache, and usage records live in `data/`. Keep that directory to retain progress. `.env` and `data/` are ignored. Lower positive `AI_HOURLY_LIMIT_USD` and `AI_CAMPAIGN_LIMIT_USD` values reduce the default limits of $2/hour and $25/campaign; the implemented limits cannot exceed those ceilings. Text costs use returned token counts; audio accounting is conservative. These limits apply to this local application.

The game binds only to loopback. Public hosting, accounts, and deployment hardening are outside this release.
