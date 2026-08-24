# Continuous Assembly Orbit Design

## Goal

Create a separate transparent, text-free comparison animation in which the anatomical assembly occurs during one uninterrupted brain turn. The existing opaque and transparent animation files remain unchanged until the comparison is reviewed.

## Approved direction

Use **continuous orbit**: the left hemisphere begins turning as it appears, then the right hemisphere and cerebellum–brainstem fade into their registered final-canvas locations while the same orbit continues. This replaces the current pattern of assembling first and rotating only after all parts are visible.

Two alternatives were rejected:

- Holding the camera until the right hemisphere enters gives clearer staging but weakens the requested sense of simultaneous assembly and motion.
- Pausing at a new angle for each part makes the stages explicit but feels mechanical and interrupts the cinematic turn.

## Motion timeline

Keep the existing 16-second authored timeline, 384 source frames at 24 fps, and exact 1.25× delivery at 30 fps for a 12.8-second output.

- `0.0–0.5 s`: the left hemisphere fades in while the orbit eases away from its starting angle.
- `2.4–3.0 s`: the right hemisphere fades into its final world-coordinate position while the orbit continues.
- `4.6–5.2 s`: the cerebellum–brainstem fades into its final position while the orbit continues.
- `0.0–15.2 s`: the complete camera path advances through exactly 360 degrees with no pauses or angular jumps.
- At the orbit midpoint, the elevation reaches the approved restrained `−15°` inferior view, then returns to `45°` by `15.2 s`.
- `15.2–16.0 s`: all visible anatomy fades out for the loop restart.

Calculate orbit progress with the existing smoothstep easing over `0.0–15.2 s`, rather than `5.2–15.2 s`. This preserves a gentle start, smooth acceleration and deceleration, a complete turn, and identical start/end orientations.

## Anatomical behavior

Keep the current part-opacity schedule and final-canvas geometry. Parts do not slide, snap, rescale, or rotate independently. Each part becomes visible at its anatomically correct placement while the entire registered assembly shares one camera orbit.

Continue rendering all faces in one depth-sorted collection so lavender, green, and butter surfaces overlap correctly at every stage. Preserve the approved 50% maximum surface opacity.

## Renderer and output isolation

Expose the camera timing as an explicit renderer motion mode instead of globally changing the approved path. The default mode continues to produce the current assemble-then-turn behavior. A new CLI option selects continuous assembly orbit and writes only:

- `media/anadiffusion-assembly-transparent-continuous.webm`

The comparison output uses VP9 alpha, contains no text or audio, and is `1280 × 720`, 30 fps, and 12.8 seconds. A duplicate poster is unnecessary because the final assembled still is already represented by the existing transparent poster.

Do not overwrite or regenerate:

- `media/anadiffusion-assembly.mp4`
- `media/anadiffusion-assembly.webm`
- `media/anadiffusion-assembly-poster.png`
- `media/anadiffusion-assembly-transparent.webm`
- `media/anadiffusion-assembly-transparent-poster.png`

Do not modify the webpage or any NIfTI volume.

## Verification

Automated tests must prove that:

- continuous mode changes azimuth during the assembly interval;
- the continuous path still advances exactly 360 degrees and returns to its start orientation;
- the default camera path remains unchanged;
- stage opacity timings and 50% maximum opacity remain unchanged;
- the new WebM is silent, tagged for alpha, `1280 × 720`, 30 fps, and 12.8 seconds;
- the existing five animation assets, webpage sources, and NIfTI volumes retain their hashes.

Final visual QA will inspect representative decoded frames spanning the left-only, bilateral, complete, inferior, and closing states. The turn must feel uninterrupted, parts must remain anatomically registered, overlap order must remain correct, and no text or opaque background may appear.

## Non-goals

- Do not add translation, independent part rotation, bounce, overshoot, or collision effects.
- Do not change anatomical colors, translucency, lighting, framing, or mesh detail.
- Do not embed the comparison animation on the webpage.
- Do not replace the approved transparent animation until the comparison is accepted.
- Do not push unless separately requested.
