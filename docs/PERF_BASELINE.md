# Echoes Below — frame-time baseline (Phase 0)

Measured 27 October 2026 for issue #2. Game source: Release 1 client at `54909eb` (this branch changes docs and tooling only). Later performance PRs repeat the same steps and compare against these numbers.

## Environment

- Apple M1 (integrated GPU), macOS 15.1.1, built-in 2560×1600 Retina display.
- Chrome 151, **headed**, driven by agent-browser. WebGL2 via ANGLE Metal (`ANGLE (Apple, ANGLE Metal Renderer: Apple M1)`).
- Viewport 1440×900. The World canvas caps device pixel ratio at 1.5 (`client/World.tsx:97`).
- Local production build (`npm run build`, `npm start`), Echo Rules, Fighter/Human hero, default companions.

## Method

1. Inject [`scripts/perf/frame-sampler.js`](../scripts/perf/frame-sampler.js) with `agent-browser eval` after page load.
2. It patches the WebGL2 draw calls to count draws and triangles per frame, then samples `requestAnimationFrame` deltas for a fixed window: `window.__ebSample(ms)`.
3. Same route as the playtest: title → Broken Approach → descend → Counterweight Hall → side ledge → Goblin Cookfire → attack the guards → combat.
4. **Capped**: default vsync (display 60 Hz). **Uncapped**: Chrome launched with `--disable-gpu-vsync,--disable-frame-rate-limit`, to show headroom.

Not measured: GPU memory and texture memory, other GPUs and browsers, long sessions, later chapters.

## Results

| Scene | Mode | DPR | Median ms | p95 ms | Max ms | FPS | Draw calls / frame | Triangles / frame |
|---|---|---|---|---|---|---|---|---|
| Title / creation | capped | 1 | 16.7 | 17.5 | 18.7 | 60 | 503 | 119,490 |
| Broken Approach | capped | 1 | 16.7 | 18.5 | 18.7 | 60 | 545 | 120,636 |
| Counterweight Hall | capped | 1 | 16.7 | 18.6 | 18.7 | 60 | 529 | 120,600 |
| Goblin Cookfire (exploration) | capped | 1 | 16.7 | 18.6 | 18.7 | 60 | 553 | 303,092 |
| Initiative playback start | capped | 1 | 16.7 | 18.6 | **150.1** | 58 | 541 | 302,722 |
| Goblin combat, idle turn | capped | 1 | 16.7 | 18.1 | 18.7 | 60 | 541 | 302,722 |
| Goblin combat, idle turn | capped | 2 | 16.7 | 18.7 | 18.8 | 60 | 541 | 302,722 |
| Combat playback, stepping 8 beats | capped | 2 | 16.7 | 18.6 | 18.7 | 60 | 540 | 302,635 |
| Title / creation | uncapped | 2 | 8.4 | 12.1 | 242.8 (first frames) | 114.5 | 503 | 119,490 |
| Broken Approach | uncapped | 2 | 8.3 | 12.5 | 16.0 | 120.4 | 545 | 120,636 |
| Goblin combat, idle turn | uncapped | 2 | 9.0 | 12.3 | 14.0 | 114.4 | 539 | 302,522 |

## Findings

- **Frame rate is not the problem on this machine.** Every scene holds the 60 Hz cap. Uncapped it runs about 115–120 FPS (p95 ≈ 12 ms). This supports the PRD decision to stay on WebGL2. WebGPU is not justified by these numbers.
- **High draw-call count:** 500–550 per frame for a small room. This is the main lever for weaker GPUs (shadow pass plus cloned, non-instanced dressing). It is the target for issue #10.
- **Goblin Cookfire more than doubles triangles** (120k → 303k) once goblins and the cook appear, which points at the Quaternius imp model. To be confirmed per model in #10.
- **Hitch at playback start:** a 150 ms frame when combat playback opens. This is consistent with the per-roll dice `<Canvas>` being created (shader compile and context setup). Addressed by issue #3.
- **WebGL context loss reproduces in headed Chrome:** one `THREE.WebGLRenderer: Context Lost` while stepping eight playback beats. It was seen three times headless in the first playtest. This is the per-roll canvas being torn down. Issue #3 acceptance requires zero.
- The title-screen max of 242.8 ms uncapped is first-frame warm-up right after launch. It did not recur in later samples.

## Re-run

```sh
npm run build && npm start
agent-browser --session perf --headed set viewport 1440 900
agent-browser --session perf --headed open http://127.0.0.1:4317
agent-browser --session perf --headed eval "$(cat scripts/perf/frame-sampler.js)"
agent-browser --session perf --headed eval 'window.__ebSample(6000).then(JSON.stringify)'
```

Follow the route in Method, sample each scene, and add a dated table to the PR description.
