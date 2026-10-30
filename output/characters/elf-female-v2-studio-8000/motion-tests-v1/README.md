# Elf v2 motion tests

Humanoid / Mixamo rig completed for 20 Studio credits. Idle, walk, slash presets previewed with no further observed charge. Balance 25,030.

Final clean video: `elf-v2-motion-tests-clean.mp4` (idle, then walk, then unarmed slash). No text, UI, cursor, or audio in the chosen crop. Individual clips and every source frame retained. See `video-metadata.json` and `recording-qa.json`. Capture rate is about 18.5-18.8 fps, encoded at 30 fps with repeated frames according to timestamps.

Walk uses forward root motion and resets each loop. Ground contact/foot sliding is not certified; no floor reference is present. Shoulders, elbows, hips and knees show no gross tearing/inversion in inspected samples. Fine finger weights, self-intersections, weapon grip, and in-game playback remain untested.

The first walk capture had insufficient headroom; it is retained as source only. The final montage uses walk-wide. Slash has no weapon.

Studio completed FBX export with Mixamo skeleton and all three clips, with Stay in Place off. Download completed and was copied through fresh temporary staging. The local FBX audit confirms 65 bones, three animation stacks (walk.001, slash.001, idle.001), and a 2048 x 2048 PNG texture. See ../exports/rigged/ and rig-export-audit.json. Pre-rig exports remain unchanged.
