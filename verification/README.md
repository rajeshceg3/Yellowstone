# Yellowstone verification

This round replaces the free-flight prototype's five disconnected realms with five directly selectable, illustrative landscapes. The NPS sources are linked in the app's About panel. These scenes are not surveyed reconstructions or live park conditions.

## Executed locally

- Chromium at 320, 390 and 1440 pixels, reduced and normal motion, five landscapes each.
- Drag and arrow-key orbit, stable Reset, Pause/Play, dialog open/close, viewport overflow and no page errors.
- AudioContext absent before explicit sound opt-in, suspended on mute, running after replay. A 12-second recording tees the app's actual destination output. Mean -37.7 dB, peak -25.3 dB, no clipping. Subjective listening is **not verified**.
- 100 glyph/backdrop samples at 390 and 1440 pixels across all five landscapes. Solid glyph cores compared to their exact text-hidden backdrops. Lowest measured contrast: 5.526:1, against a 4.5:1 floor. The test excludes antialiased glyph edges. UI surfaces are opaque.
- `npm run check`, `npm run build`, and `npm audit --audit-level=moderate` pass. Full audit reports zero findings.

`contrast-results.json` records pixel-level results. Browser reports record executed local checks; CI reruns the complete browser matrix and uploads its screenshots. PNGs are artifacts, not committed assets.

## Deliberate choices

- One active landscape at a time. Static geometry is batched by material. Static shadow maps update on scene changes rather than every animation frame.
- Reset returns to each landscape's subject angle. There is no auto-flight or autoplay audio.
- Reduced motion starts paused. Pause also suspends optional audio. Hidden tabs stop animation and suspend sound.
- Caldera country depicts an illustrative surface basin, forest and lake rather than an exposed underground lava scene.
