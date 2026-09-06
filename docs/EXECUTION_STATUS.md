# Echoes Below — Release 1 execution status

Scope frozen by the owner on 6 September 2026. The current campaign is final for this release. Historical expansion work is archived in EXECUTION_STATUS-pre-release1-archive.md. The previous 24-hour/human-playtest goal is superseded by release closure; those claims are explicitly not made.

## Source readiness

Starting source: c0fc9d0. Working tree was clean. Campaign attrition and expedition supply changes were already committed and are retained: 12/12 legal traversal runs completed; supply-policy regressions are tested; old inventories and Echo Rules policy are preserved. No unfinished feature is being added or reverted.

## Local release gates

- Automated suite: 268 passed, 0 failed/skipped (data/release1-tests.log).
- TypeScript: server, client and hosted checks passed.
- Production build passed; asset verification passed for 45 models and 51 bundled files including external glTF dependencies.
- Browser Release One: fresh Elf/Fighter curated save in free mode; inspection d20 12+3=15 visible; counterweight read/pawl/weight/pin solved; ration route gave passage and guard key; prison unlock and ledger; reload/Continue retained rescued courier, level2 and resources; Vark battle showed individual guard/Oren/Mira actions and reached After the Last Echo; secure seal and ChapterII Sluice Stair choice completed at885XP.
- Browser personal mode: invalid test key produced “OpenAI rejected this key. Check it in settings.”; switching back to free mode remained available. No real credential was entered for this release check.
- Separate browser Release Combat: fresh Echo Rules save, safe ledge bypass, goblin battle with hero attacks, companion healing/attacks and sequential saved playback; both guards defeated, prison key awarded, prison reached and reload/Continue retained 250XP and party resources.
- Desktop layouts exercised at 1440×900 and1280×800. Visible prison labels identify the captive, gate and chest; target/action menus remained usable. In-app screenshot capture exhibited duplicated compositor tiles outside the primary viewport, so screenshots are not treated as pixel-perfect certification. No browser warning/error logs were captured during the local flow.
- All requested local critical-path gates passed. No release-blocking code defect reproduced. Only documentation consolidation is changed by this closure commit. Final source identity, single publication and production smoke are recorded in the handoff after publication.

## Limitations and deferred work

No verified 24-hour duration or completed first-time human playtesting. No exhaustive all-camera/animation/device certification. Some later locations are short choices and reuse dressing. Curated rules remain a disclosed subset, with legacy exploration checks and cosmetic race proportions. Personal key success/stale/error paths have automated coverage and prior live provider evidence, but this release does not certify a complete real-key browser microphone/dialogue/audio session. Host allowance depends on deployment configuration. Hosted anonymous saves have no account recovery/cross-device sync. Browser timing counters are approximate and exclude inactive time.

Future work is backlog only: richer later encounters, full rules and race-specific assets, broader accessibility/performance testing, measured pacing and human studies, account recovery and broader voice-provider compatibility. Stop autonomous feature development after Release 1 deployment and smoke verification.
