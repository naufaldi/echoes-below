# Packaging verification, 10 November 2026

- PASS: V6c portable rebuild with Blender 4.3.2, merge, finalize. Final GLB byte-identical: `eed37e08843e810e046bb739fcff55417beeae56fdff1797fb010497350bab4b`.
- PASS: 20 targeted tests (animation cues, facing, combat cues, socket and palette).
- PASS: client, server and hosted TypeScript checks. Added explicit `.js` imports and Vite ImportMeta typing so the new test is valid under the server's NodeNext configuration.
- PASS: `npm run build`, including the original asset gate: 122 models, 14 licensed audio files, 81 CC0 environment files, 51 manifest-listed model files, 158 bundled files. No prototype assets shipped.
- PASS: preview prepare creates isolated fixture; checksum verifies; build guard refuses while preview files exist; explicit clean removes them; clean build succeeds.
- PASS: whitespace check for new implementation/docs. The imported original Tripo browser transcript retains three historical trailing-whitespace lines to preserve source bytes.
- PASS: direct `node --import tsx --test` run of all backend test files except `backend-asset-bundle.test.ts`: **730 tests passed**, zero failures. The omitted file is covered only by the separate build asset gate, not a claimed test-suite pass.
- FULL SUITE NOT PASSED: `npm test` fails before running tests because this executor denies the tsx IPC Unix socket (`listen EPERM`). Direct Node test alternative is recorded separately; do not treat previous worker full-suite runs as proof for this revision.
- Browser evidence was recorded by the runtime worker against the same final GLB and rendering code before packaging: 15 poses, 13 screenshots, no page errors; fresh packaging run does not claim a new browser capture. Packaging changes are documentation, local asset lifecycle, TypeScript imports and typing.

Earlier V5 full-suite asset-bundle stall is preserved as historical evidence, not a passing gate. No deployment, production asset replacement or licence approval.
