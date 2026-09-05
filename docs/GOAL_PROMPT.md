# Echoes Below: expansion and public release goal

Work in `/Users/naufaldisatriya/WebApps/3d-dnd`. Preserve existing adventures and the registered Sites project in `.openai/hosting.json`. Read PRD, RFC, EXPANSION_STATUS and VERIFICATION before changing code.

Create or continue the goal: finish Echoes Below as a playable, voiced, saveable 3D narrative adventure, with visible animated dice, individually presented companion/enemy turns, clear active-actor highlights, rich interactive Quaternius environments, race/class creation, experience and levels, and a consequential multi-chapter campaign. Use Baldur’s Gate 3 as an experiential reference, original characters/story, and clearly identified D&D-inspired rules. Never imply the simplified rules implement the full tabletop system.

Continue through implementation, rules and integration tests, real browser playthroughs, asset playback checks, fixes, and public deployment using Sites. Update PRD/RFC to match actual behavior. The user authorizes implementation decisions, public publication of this game, and reuse of the existing OpenAI configuration. Do not publish unrelated files, personal saves or credentials. The Site-owning agent alone edits/publishes the checkout; asset/research agents may return files outside it.

Keep player OpenAI keys only in page memory, send them directly to OpenAI, and clear them on reload. Never send them to the game backend or save them in browser storage. Hosted saves and dialogue use an anonymous private device session and D1 ownership checks. Owner-sponsored AI requires a separate server secret and atomic spending ceilings; it must remain disabled unless safely configured. Authored gameplay must work without paid AI. Explain data handling accurately.

Test all chapters and both peaceful/combat routes, XP duplication, failed checks, save/reload, checkpoints, request retries, isolation between visitors, AI failure, companion action legality, dialogue memory, generated speech, transcription and interruption. Inspect actual screenshots at desktop sizes. Do not mark browser QA complete while the Mac is locked. Never claim 24 measured hours from a scene count or automated traversal. The 24-hour experience remains a playtesting target until supported by evidence.

Publish the exact tested source and build to the existing Site, inspect deployment success, then check the deployed game. Report the playable URL and important remaining limitations. Keep the goal active while required work remains. Record concrete progress and blockers in EXPANSION_STATUS so another turn can continue without reconstructing the conversation.

Recent foundation: expedition victories now leave the main decision to the player, and ten source/target choices unlock once-only assistance (PRD-25/26). Preserve these dependencies when adding quests. Do not replace substantive quest pacing with more one-click rooms; the 24-hour target still requires deeper objectives and measured human play.
