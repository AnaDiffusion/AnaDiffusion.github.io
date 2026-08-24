# Anatomical Assembly Animation Design

## Goal

Create a silent cinematic animation that illustrates AnaDiffusion's part-to-whole assembly using the three staged RGB24 NIfTI assets:

1. `volumes/assembly-left-sample-01.nii.gz`
2. `volumes/assembly-hemispheres-sample-01.nii.gz`
3. `volumes/assembly-parts-sample-01.nii.gz`

The animation is a standalone deliverable. This task does not add it to the webpage.

## Selected visual direction

Use the approved **Cinematic 3D build** direction: a single three-quarter anatomical render rotates gently while the right hemisphere and cerebellum–brainstem fade into their final locations. Minimal stage labels explain the progression without competing with the anatomy.

Two alternatives were considered:

- A fixed-camera 3D crossfade would make regional comparison easier but feel less engaging on the project page.
- A synchronized multiplanar view would be more explicitly scientific but visually dense at video and mobile sizes.

## Rendering approach

Extract one surface for each anatomical region from the staged RGB volumes:

- The left-hemisphere foreground comes directly from the left-only assembly.
- The right-hemisphere foreground is the bilateral-hemisphere foreground minus the left-only foreground.
- The cerebellum–brainstem foreground is the complete-assembly foreground minus the bilateral-hemisphere foreground.

Generate smoothed meshes with `scikit-image` marching cubes, preserving the corrected common affine and relative placement. Render the three cached meshes offscreen with Matplotlib using an orthographic camera, soft directional shading, the established lavender/green/butter colors, and the page's near-black background.

Browser-canvas capture from NiiVue was rejected because it would match the live viewer but introduce fragile browser timing and WebGL screenshot dependencies. A 2D projection renderer was rejected because it would not deliver the approved 3D orbit.

## Timeline and motion

The final animation is 16 seconds at 24 frames per second:

- `0.0–0.5 s`: left hemisphere fades in from black.
- `0.5–2.4 s`: left hemisphere holds; label reads **1 · Left hemisphere**.
- `2.4–3.0 s`: right hemisphere fades into place.
- `3.0–4.6 s`: both hemispheres hold; label reads **2 · Bilateral hemispheres**.
- `4.6–5.2 s`: cerebellum–brainstem fades into place.
- `5.2–15.2 s`: the complete assembly makes one full 360-degree turn; label reads **3 · Complete assembly**.
- `15.2–16.0 s`: anatomy and labels fade to black for a clean loop restart.

The camera holds a 45-degree elevation while the anatomy assembles. During the complete assembly's smooth 360-degree azimuth turn, the camera makes one brief inferior-view dip: it eases from 45 degrees to a restrained minimum of -15 degrees at the orbit midpoint, then returns to 45 degrees before the closing fade. The fourth-power sine curve keeps most of the turn elevated while exposing the underside without making the anatomy feel inverted. The camera reaches the same physical orientation before the closing fade and at the loop restart, preventing a visible jump. Anatomy is never translated or rescaled during stage transitions; new parts fade into their corrected final-canvas positions.

### Approved visibility refinement

The complete assembly rotates through all 360 degrees during the `5.2–15.2 s` hold, providing anterior, posterior, and both lateral views at a calmer, readable pace. Once a part has finished fading in, its surface remains at 50% opacity rather than becoming fully opaque. The stronger translucency reveals deeper overlapping anatomical structure while preserving the lavender, green, and butter part identities.

For turn progress `p` from zero to one, elevation is `45 - 60 sin^4(pi p)` degrees. This yields 45 degrees at the start and end, 30 degrees at each quarter-turn, and -15 degrees at the midpoint. Extending the turn from 6 to 10 seconds reduces its average azimuth speed from 60 to 36 degrees per second without changing the easing curve. Opacity, framing, assembly timing, labels, and encoders remain unchanged.

## Frame composition

- Resolution: `1280 × 720` pixels.
- Background: `#0d091b`.
- Anatomy: lavender left hemisphere, green right hemisphere, butter cerebellum–brainstem.
- Persistent small heading: **AnaDiffusion · Part-to-whole assembly**.
- Stage label: upper-left, white with restrained opacity.
- No axes, crosshairs, orientation letters, borders, watermark, or audio.
- Camera and object framing remain constant across every stage.

## Deliverables

- `media/anadiffusion-assembly.mp4`: H.264, `yuv420p`, web-compatible primary video.
- `media/anadiffusion-assembly.webm`: VP9 web alternative.
- `media/anadiffusion-assembly-poster.png`: final complete-assembly poster frame.
- `scripts/render-assembly-animation.py`: deterministic source renderer.

Temporary PNG frames are written outside the repository and deleted after encoding.

## Verification

Automated tests will cover the stage-opacity schedule, full 360-degree turn, part-mask separation, shared final-canvas geometry, and deterministic frame dimensions. Final validation will use `ffprobe` to confirm both videos are `1280 × 720`, 16 seconds, and silent. The poster must be `1280 × 720`, and the existing webpage sources and NIfTI files must remain unchanged.

## Non-goals

- Do not embed or autoplay the animation on the webpage.
- Do not modify the three assembly NIfTIs.
- Do not add narration, music, or sound effects.
- Do not generate a GIF; MP4 and WebM provide better quality and file size for this use.
- Do not push the animation unless separately requested.
