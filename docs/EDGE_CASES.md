# Release edge-case register

6 September 2026. PASS means covered by a test or bounded observation, not a guarantee for arbitrary AI output.

| Case | Expected behavior | Evidence/status |
|---|---|---|
| Opening has no discovery facts | DM describes scene with empty factIds | Regression and real OpenAI DM passed |
| Model invents a fact reference | Reject reply, keep save unchanged | Regression passed |
| Model truncates JSON | Explain incomplete response, allow retry | Regression passed |
| Model refuses prompt | Explain refusal, allow another question | Implemented, regression pending |
| Empty reply | Reject unusable text | Implemented |
| Existing fact leaves short context | Cite only supplied facts | Dynamic enum implemented |
| Player requests secret or victory | Do not reveal hidden facts or resolve actions | Existing rules/AI tests; broader live narrative eval pending |
| Wrong companion perspective | Preserve speaker/listener roles | Existing semantic samples and role tests |
| Conversation memory across reload | Persist dialogue under save/speaker | Existing integration tests |
| Invalid personal key | Do not mark connected; display rejection | UI connection validation implemented |
| Key lacks model permission | Explain OpenAI request failed; do not connect | Provider error handling; live restricted key not available |
| Account quota exhausted | Show usage-limit message; authored play remains | Provider error handling |
| Timeout/offline | Stop waiting with error; retain game state | 30-second bound; browser interruption test pending |
| Disconnect during key check | Late result cannot reconnect | Attempt generation guard |
| Switch to Free during check | Clear candidate ownership, ignore late result | Attempt generation guard |
| Reload after connecting | Clear key and return to Free | Previous browser QA passed; recheck new flow |
| Personal request fails | Never fall back to host spending | Existing integration coverage |
| Host unconfigured/exhausted | Disable mode or refuse before spend | Budget and routing tests passed |
| Microphone unavailable/denied | Typed input remains usable | Existing implementation; browser permission test pending |
| Stop audio or switch adventure | Suppress late playback | Session boundary tests |
| Voice generation fails | Text remains available | Existing UI handling; live browser playback pending |
| Missing model or texture | Report explicit failure, preserve save | Structural scan: no missing dependencies; 45-model runtime audit passed |
| Multiple optional weapons in pack | Hide incompatible extras | Explicit accessory filtering |
| Equipment does not follow animation | Use skeletal attachments, remove floating generated gear | Source correction; Chrome front-facing preview inspected |
| Race changes repeatedly | Stable source normalization, no scale accumulation | Prior browser regression; new models need visual check |
| No matching animation | Inspect clip mapping and fallback | Full asset animation inventory plus runtime sampling |
| Crowded labels | Compact labels; target menu remains reachable | HUD revision; 1440×778 panel separation measured |
| Short desktop viewport | Scroll panels, retain actions | Responsive rules; browser check underway |
| Refresh during resolution | Same committed result on resume | Duplicate/revision integration tests |
| Double-click or stale action | No double roll/spend/reward | Integration tests passed |
| Defeat or failed trap | Checkpoint/alternative route, no deadlock | Rules and combat tests passed |
| Companion class changes | Actual stats/skills persist | All class/race setup combinations tested |
| Old saves and QA saves coexist | Select desired save, never delete old one | Save picker and prior browser verification |
| Boss victory before ethical choice | Choice remains available after combat/reload | Consequence integration tests |
| Campaign duration | Report measured duration only | 24 hours not validated or claimed |

Each supplied asset is listed in artifacts/verification/assets-feedback.json. All 45 models passed browser texture loading, shader compilation and animation sampling. See FEEDBACK_QA.md for scope. This release does not claim exhaustive evaluation of all possible generated wording.
