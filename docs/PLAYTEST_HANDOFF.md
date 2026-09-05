# Release verification handoff

The goal is incomplete. The Mac’s locked state has prevented computer-use/browser QA across more than three consecutive goal turns. Independent engine, content, hosted integration and measurement work has continued; further release acceptance now needs an unlocked interactive browser. Do not call HTTP traversal a browser playthrough.

## First actions after unlock

1. Open the existing public Site, https://echoes-below.naufaldi.chatgpt.site. Keep the current project and deployment; do not recreate it.
2. Inspect character setup, dice reveal, sequential turn playback, exploration targets, returning allies and Settings at1280×720 and1920×1080, plus enlarged text. Capture screenshots and fix actual overlap, clipping, missing models and animation issues.
3. Run an authored opening and an expedition combat encounter. Verify post-victory choice, save/reload, playback skip, individual actor health and highlighted turns. The corresponding deployed API tests already pass, but cannot prove their presentation.
4. Verify personal-key mode with the user-authorized private configuration through safe UI handling. Check direct OpenAI requests without logging request headers or key values, playback/stop, microphone permission, editable transcription and interrupted requests. Server-side text/speech/transcription were exercised; the actual browser path has not been.
5. Open Settings and download a playtest report. Verify visibility, focus, save switching and idle exclusions in the real browser. Reports include no dialogue or credentials and are local estimates. Export is manual; no automatic telemetry upload exists.
6. Play the expanded route without optimizing for known answers. Record time, skipped optional content, confusion, repetitive interactions and difficulty. Use that baseline to prioritize substantive quests and combat variety. Three first-time playthroughs with median/range are still required before a24-hour claim. Current compact content does not justify that claim.

## Evidence and limits

-53 automated tests pass. All three type checks and production build pass.
- Deployed version7’s73-revision traversal verifies ten ownership/retry/combat-choice/consequence checks. Artifact: `artifacts/verification/deployed-v7-consequences.json`.
- Earlier full traversal reached all46 locations, level8 and the ending. Its elapsed API time is not human playtime.
- Real Luna dialogue perspective was corrected and two follow-up phrasings passed. Local generated speech and Whisper round trip worked. Semantic model evaluations remain bounded samples, not guarantees.
- Personal keys remain page-memory only. Owner sponsorship is intentionally disabled until its secret can be provisioned safely; no owner key is public.
- Race identities and simplified classes exist; full D&D racial features, spells and progression are not implemented or advertised.
- No expansion screenshots, actual audio listening, browser personal-key acceptance, measured browser frame-time evidence or human campaign-duration evidence currently establish the remaining release gates.

Resume the existing goal after the Mac is unlocked. Preserve its full scope, including deeper long-form gameplay and honest duration validation.
