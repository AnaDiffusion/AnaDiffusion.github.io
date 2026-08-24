# Anatomical Assembly Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the three staged assembly NIfTIs as a deterministic 12-second cinematic 3D loop in MP4 and WebM formats with a matching poster frame.

**Architecture:** A standalone Python renderer extracts disjoint anatomical masks from the staged RGB24 volumes, converts them to cached meshes, and reuses one offscreen Matplotlib 3D scene for every frame. FFmpeg encodes the temporary PNG frame sequence; unit tests protect the mask extraction, opacity schedule, looped camera, frame dimensions, and final media metadata.

**Tech Stack:** Python 3, unittest, nibabel, NumPy, SciPy, scikit-image, Matplotlib Agg, Pillow, FFmpeg/ffprobe

---

### Task 1: Specify animation state and anatomical masks

**Files:**
- Create: `tests/test_assembly_animation.py`
- Create: `scripts/render-assembly-animation.py`

- [ ] **Step 1: Write failing unit tests**

Load the hyphenated renderer module with `importlib.util`. Add tests for:

```python
state = renderer.stage_state
self.assertEqual(state(0.0), {"left": 0.0, "right": 0.0, "cb": 0.0})
self.assertEqual(state(1.0)["left"], 1.0)
self.assertEqual(state(4.0)["right"], 1.0)
self.assertEqual(state(4.0)["cb"], 0.0)
self.assertEqual(state(6.0), {"left": 1.0, "right": 1.0, "cb": 1.0})
self.assertEqual(state(8.0), {"left": 1.0, "right": 1.0, "cb": 1.0})
self.assertEqual(state(12.0), {"left": 0.0, "right": 0.0, "cb": 0.0})
self.assertEqual(renderer.camera_angles(0.0), renderer.camera_angles(12.0))
```

Call `load_part_masks()` and assert every mask is `(128, 128, 128)`, all masks are nonempty and pairwise disjoint, and the returned affine equals the shared assembly affine.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
/opt/anaconda3/bin/python3 -m unittest tests.test_assembly_animation -v
```

Expected: FAIL because `scripts/render-assembly-animation.py` does not exist.

- [ ] **Step 3: Implement schedule and mask extraction**

Create constants for `WIDTH = 1280`, `HEIGHT = 720`, `FPS = 24`, `DURATION = 12.0`, the three input paths, and the established RGB colors.

Implement a clamped smoothstep fade:

```python
def smoothstep(start: float, end: float, value: float) -> float:
    x = np.clip((value - start) / (end - start), 0.0, 1.0)
    return float(x * x * (3.0 - 2.0 * x))
```

`stage_state(time_s)` multiplies each part's entrance opacity by `1 - smoothstep(11.2, 12.0, time_s)`. Entrances are left `0.0–0.5`, right `2.4–3.0`, and cb `4.6–5.2`. `camera_angles(time_s)` completes a 360-degree turn during `5.2–11.2` and returns to the same physical orientation at the loop boundary.

`load_part_masks()` reads the three RGB24 volumes and returns:

```python
left = foreground(left_stage)
right = foreground(hemisphere_stage) & ~left
cb = foreground(full_stage) & ~foreground(hemisphere_stage)
```

Validate identical shapes and affines before returning the masks and affine.

- [ ] **Step 4: Run tests and verify GREEN**

Run the focused unittest command and expect all schedule, camera, and mask tests to pass.

### Task 2: Specify and implement deterministic 3D frame rendering

**Files:**
- Modify: `tests/test_assembly_animation.py`
- Modify: `scripts/render-assembly-animation.py`

- [ ] **Step 1: Add a failing frame test**

Add a test that constructs `AssemblyRenderer(width=320, height=180, mesh_step=3)`, renders time `6.0`, and asserts:

```python
frame = scene.render_frame(6.0)
self.assertEqual(frame.mode, "RGB")
self.assertEqual(frame.size, (320, 180))
self.assertGreater(np.asarray(frame).std(), 1.0)
scene.close()
```

- [ ] **Step 2: Run tests and verify RED**

Expected: FAIL because `AssemblyRenderer` is missing.

- [ ] **Step 3: Implement cached mesh rendering**

For each disjoint mask, smooth with `scipy.ndimage.gaussian_filter`, then call `skimage.measure.marching_cubes` at level `0.35` using configurable `step_size`. Transform vertices through the shared NIfTI affine.

`AssemblyRenderer` must:

- select Matplotlib's `Agg` backend;
- create one borderless figure at the exact pixel dimensions;
- use a transparent-axis orthographic 3D projection on background `#0d091b`;
- cache one `Poly3DCollection` per anatomical part with no edges;
- set common axis limits and box aspect once;
- update only collection alpha, camera angles, and label text per frame;
- draw **AnaDiffusion · Part-to-whole assembly** and the active stage label;
- return a Pillow RGB image from the canvas buffer;
- expose `close()` to release the figure.

Use the active labels `1 · Left hemisphere`, `2 · Bilateral hemispheres`, and `3 · Complete assembly`, with blank text during the opening and closing black frames.

- [ ] **Step 4: Run tests and verify GREEN**

Run the focused unittest command and expect the new frame test plus Task 1 tests to pass.

### Task 3: Render and encode deliverables

**Files:**
- Modify: `scripts/render-assembly-animation.py`
- Create: `media/anadiffusion-assembly.mp4`
- Create: `media/anadiffusion-assembly.webm`
- Create: `media/anadiffusion-assembly-poster.png`

- [ ] **Step 1: Implement frame-sequence and encoding commands**

Add `render_animation(output_dir: Path)` that renders exactly `FPS * DURATION = 288` frames into a `TemporaryDirectory`, saving files as `frame-0000.png` through `frame-0287.png`. Save a separate full-resolution poster from time `6.0`.

Run FFmpeg through `subprocess.run(..., check=True)`:

```text
MP4:  -framerate 24 -i frame-%04d.png -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart -an
WebM: -framerate 24 -i frame-%04d.png -c:v libvpx-vp9 -crf 30 -b:v 0 -pix_fmt yuv420p -an
```

Expose `--output-dir`, `--width`, `--height`, `--fps`, and `--duration` CLI options with the approved values as defaults.

- [ ] **Step 2: Render the approved media**

Run:

```bash
/opt/anaconda3/bin/python3 scripts/render-assembly-animation.py
```

Expected: the 12-second MP4, WebM, and poster appear under `media/` and temporary frames are removed automatically.

- [ ] **Step 3: Inspect one poster and representative video frames**

Use the local image viewer on the poster and FFmpeg-extracted frames near seconds 1, 4, and 6. Confirm correct anatomy, palette, framing, stage labels, and absence of axes/crosshairs.

### Task 4: Verify media and regressions

**Files:**
- Modify: `tests/test_assembly_animation.py`
- Verify unchanged: `index.html`
- Verify unchanged: `assets/js/volume-viewer.mjs`
- Verify unchanged: the three input NIfTIs

- [ ] **Step 1: Add media metadata tests**

Use `ffprobe -v error -show_entries stream=codec_type,width,height -show_entries format=duration -of json` from `subprocess.run`. Assert both videos exist, have one video stream, have no audio stream, are `1280 × 720`, and report duration within `0.05` seconds of `12.0`. Assert the poster is `1280 × 720` RGB.

- [ ] **Step 2: Run animation and page tests**

Run:

```bash
/opt/anaconda3/bin/python3 -m unittest tests.test_assembly_animation -v
/opt/anaconda3/bin/python3 -m unittest tests.test_colored_assembly -v
node --test tests/*.test.mjs
git diff --check
```

Expected: all tests pass and the diff check is clean.

- [ ] **Step 3: Confirm source assets and webpage remain untouched**

Compare the three input NIfTI hashes to their pre-render hashes. Run:

```bash
git diff --exit-code HEAD -- index.html assets/js/volume-viewer.mjs volumes/assembly-left-sample-01.nii.gz volumes/assembly-hemispheres-sample-01.nii.gz volumes/assembly-parts-sample-01.nii.gz
```

Expected: exit code 0 with no output.

- [ ] **Step 4: Commit locally**

```bash
git add scripts/render-assembly-animation.py tests/test_assembly_animation.py media/anadiffusion-assembly.mp4 media/anadiffusion-assembly.webm media/anadiffusion-assembly-poster.png docs/superpowers/plans/2026-08-23-assembly-animation.md
git commit -m "Add anatomical assembly animation"
```

Do not push or embed the media on the webpage.

### Task 5: Increase camera coverage and anatomical translucency

> Historical intermediate refinement. Task 6 supersedes its 8-second, 40-degree, and 82% values.

**Files:**
- Modify: `tests/test_assembly_animation.py`
- Modify: `scripts/render-assembly-animation.py`
- Regenerate: `media/anadiffusion-assembly.mp4`
- Regenerate: `media/anadiffusion-assembly.webm`
- Regenerate: `media/anadiffusion-assembly-poster.png`

- [ ] **Step 1: Write failing motion and opacity tests**

Assert that the azimuth values at seconds 5.2 and 7.2 span at least 38 degrees, the elevation values span at least 7.5 degrees, and the configured maximum part opacity is greater than zero but less than one.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
MPLCONFIGDIR=/tmp/anadiffusion-mpl-cache XDG_CACHE_HOME=/tmp/anadiffusion-xdg-cache /opt/anaconda3/bin/python3 -m unittest tests.test_assembly_animation.AnimationStateTests -v
```

Expected: FAIL because the existing orbit moves only about 4.4 degrees of azimuth and 0.9 degrees of elevation while the complete assembly is visible, and no translucent maximum opacity is configured.

- [ ] **Step 3: Implement the approved visibility settings**

Add `PART_OPACITY = 0.82`. Update `camera_angles()` to use azimuth amplitude `20.0`, elevation amplitude `4.0`, and two sinusoidal cycles over the 8-second loop. This puts nearly the full sweep inside the complete-assembly hold while preserving identical values at seconds 0 and 8. Multiply every per-part stage alpha by `PART_OPACITY` when setting merged face colors in `render_frame()`.

- [ ] **Step 4: Run focused tests and inspect a preview strip**

Run the animation-state and frame-render tests. Render the four-state preview strip and confirm the wider rotation, translucent overlapping surfaces, stable colors, and depth-correct occlusion.

- [ ] **Step 5: Regenerate and verify all media**

Render all 192 frames and replace the MP4, WebM, and poster. Inspect a one-frame-per-second contact sheet from the encoded MP4. Run the complete Python and Node test suites, then commit locally without pushing.

### Task 6: Show a full translucent 360-degree view

> Historical intermediate refinement. Task 7 supersedes its 70% opacity and variable-elevation values.

**Files:**
- Modify: `tests/test_assembly_animation.py`
- Modify: `scripts/render-assembly-animation.py`
- Regenerate: `media/anadiffusion-assembly.mp4`
- Regenerate: `media/anadiffusion-assembly.webm`
- Regenerate: `media/anadiffusion-assembly-poster.png`

- [ ] **Step 1: Write failing duration, rotation, and opacity tests**

Update the loop-boundary assertion to compare seconds 0 and 12. Assert that the stage is fully visible at second 8 and fully faded at second 12, that camera azimuth advances exactly 360 degrees between seconds 5.2 and 11.2, and that maximum surface opacity equals `0.70`. Update media metadata expectations from 8 to 12 seconds.

```python
self.assertEqual(renderer.camera_angles(0.0), renderer.camera_angles(12.0))
self.assertEqual(renderer.stage_state(8.0), {"left": 1.0, "right": 1.0, "cb": 1.0})
self.assertEqual(renderer.stage_state(12.0), {"left": 0.0, "right": 0.0, "cb": 0.0})
_, start_azimuth = renderer.camera_angles(5.2)
_, end_azimuth = renderer.camera_angles(11.2)
self.assertAlmostEqual(end_azimuth - start_azimuth, 360.0)
self.assertAlmostEqual(renderer.PART_OPACITY, 0.70)
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
MPLCONFIGDIR=/tmp/anadiffusion-mpl-cache XDG_CACHE_HOME=/tmp/anadiffusion-xdg-cache /opt/anaconda3/bin/python3 -m unittest tests.test_assembly_animation.AnimationStateTests tests.test_assembly_animation.MediaOutputTests -v
```

Expected: FAIL because the current renderer is 8 seconds, spans less than 360 degrees, and uses `0.82` opacity.

- [ ] **Step 3: Implement the 12-second turn**

Set `DURATION = 12.0` and `PART_OPACITY = 0.70`. Preserve the assembly entrance times, hold the starting three-quarter view through second 5.2, then map a smoothstep progress from `5.2–11.2` to 360 degrees of azimuth. Apply one sinusoidal elevation cycle across the same progress. Move the stage fade to `11.2–12.0` and the title fade to `11.4–12.0`.

```python
turn_progress = _smoothstep(5.2, 11.2, loop_time)
elevation = 18.0 + 5.0 * math.sin(2.0 * math.pi * turn_progress)
azimuth = -38.0 + 360.0 * turn_progress
```

- [ ] **Step 4: Regenerate and inspect all outputs**

Render 288 frames at 24 fps, encode both formats, regenerate the poster, and inspect a one-frame-per-second contact sheet from the MP4. Confirm that the fully assembled anatomy exposes all sides at 70% opacity and that depth sorting remains correct.

- [ ] **Step 5: Verify and commit locally**

Run the complete Python and Node test suites, `git diff --check`, and the webpage/NIfTI unchanged audit. Commit locally without pushing or embedding the media in the webpage.

### Task 7: Use a fixed elevated translucent view

**Files:**
- Modify: `tests/test_assembly_animation.py`
- Modify: `scripts/render-assembly-animation.py`
- Regenerate: `media/anadiffusion-assembly.mp4`
- Regenerate: `media/anadiffusion-assembly.webm`
- Regenerate: `media/anadiffusion-assembly-poster.png`

- [ ] **Step 1: Write failing elevation and opacity tests**

Replace the varying-elevation assertion with checks that `camera_angles()` returns exactly 45 degrees of elevation at seconds `0.0`, `5.2`, `8.2`, `11.2`, and `12.0`. Change the maximum surface-opacity expectation from `0.70` to `0.50`. Keep the 360-degree azimuth and 12-second media assertions unchanged.

```python
for time_s in (0.0, 5.2, 8.2, 11.2, 12.0):
    elevation, _ = renderer.camera_angles(time_s)
    self.assertEqual(elevation, 45.0)
self.assertAlmostEqual(renderer.PART_OPACITY, 0.50)
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
MPLCONFIGDIR=/tmp/anadiffusion-mpl-cache XDG_CACHE_HOME=/tmp/anadiffusion-xdg-cache /opt/anaconda3/bin/python3 -m unittest tests.test_assembly_animation.AnimationStateTests -v
```

Expected: FAIL because the current renderer uses variable elevation around 18 degrees and `0.70` opacity.

- [ ] **Step 3: Implement the fixed elevated view**

Set `PART_OPACITY = 0.50` and return constant elevation `45.0` from `camera_angles()`. Preserve the existing smoothstep `turn_progress` and 360-degree azimuth:

```python
elevation = 45.0
azimuth = -38.0 + 360.0 * turn_progress
```

- [ ] **Step 4: Regenerate, inspect, verify, and commit**

Render all 288 frames and replace both videos and the poster. Inspect the preview, encoded one-frame-per-second contact sheet, and poster for full 360-degree coverage, stable 45-degree elevation, 50% translucency, and correct depth sorting. Run all Python and Node tests plus the unchanged webpage/NIfTI audit. Commit locally without pushing.

### Task 8: Briefly reveal the inferior surface

**Files:**
- Modify: `tests/test_assembly_animation.py`
- Modify: `scripts/render-assembly-animation.py`
- Regenerate: `media/anadiffusion-assembly.mp4`
- Regenerate: `media/anadiffusion-assembly.webm`
- Regenerate: `media/anadiffusion-assembly-poster.png`

- [ ] **Step 1: Write a failing inferior-view camera test**

Replace the fixed-elevation test with an assertion that the camera starts and ends at 45 degrees, remains above 40 degrees at the surrounding quarter-time samples, and reaches a restrained -15-degree inferior view at the midpoint:

```python
def test_camera_briefly_reveals_inferior_surface_then_returns(self):
    expected_elevations = {
        5.2: 45.0,
        8.2: -15.0,
        11.2: 45.0,
    }
    for time_s, expected in expected_elevations.items():
        elevation, _ = self.renderer.camera_angles(time_s)
        self.assertAlmostEqual(elevation, expected)

    for time_s in (6.7, 9.7):
        elevation, _ = self.renderer.camera_angles(time_s)
        self.assertGreater(elevation, 40.0)
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
MPLCONFIGDIR=/tmp/anadiffusion-mpl-cache XDG_CACHE_HOME=/tmp/anadiffusion-xdg-cache /opt/anaconda3/bin/python3 -m unittest tests.test_assembly_animation.AnimationStateTests -v
```

Expected: FAIL at the midpoint because the current camera elevation remains fixed at 45 degrees.

- [ ] **Step 3: Implement the minimal eased elevation curve**

Keep the existing 360-degree azimuth and compute elevation from the same turn progress:

```python
elevation = 45.0 - 60.0 * math.sin(math.pi * turn_progress) ** 4
azimuth = -38.0 + 360.0 * turn_progress
```

This preserves 45 degrees before the turn and at the loop boundary, exposes the underside briefly, and changes no anatomical surface or opacity behavior.

- [ ] **Step 4: Verify, regenerate, inspect, and commit**

Run the focused test, render the preview strip, then regenerate all 288 frames and replace both videos and the poster. Inspect an encoded one-frame-per-second contact sheet to confirm the brief inferior view, seamless 45-degree return, complete 360-degree coverage, 50% opacity, and correct depth sorting. Run all Python and Node tests plus the unchanged webpage/NIfTI audit. Commit locally without pushing.

### Task 9: Slow the complete-assembly turn

**Files:**
- Modify: `tests/test_assembly_animation.py`
- Modify: `scripts/render-assembly-animation.py`
- Regenerate: `media/anadiffusion-assembly.mp4`
- Regenerate: `media/anadiffusion-assembly.webm`
- Regenerate: `media/anadiffusion-assembly-poster.png`

- [ ] **Step 1: Write failing 16-second timing tests**

Update the loop, stage, camera, and media assertions to protect the longer timeline:

```python
self.assertEqual(state(12.0), {"left": 1.0, "right": 1.0, "cb": 1.0})
self.assertEqual(state(16.0), {"left": 0.0, "right": 0.0, "cb": 0.0})
self.assertEqual(renderer.camera_angles(0.0), renderer.camera_angles(16.0))

_, starting_azimuth = renderer.camera_angles(5.2)
_, ending_azimuth = renderer.camera_angles(15.2)
self.assertAlmostEqual(ending_azimuth - starting_azimuth, 360.0)

expected_elevations = {5.2: 45.0, 10.2: -15.0, 15.2: 45.0}
for time_s, expected in expected_elevations.items():
    elevation, _ = renderer.camera_angles(time_s)
    self.assertAlmostEqual(elevation, expected)
```

Rename the media test to `test_videos_are_silent_sixteen_second_720p_loops` and assert a duration of `16.0` seconds.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
MPLCONFIGDIR=/tmp/anadiffusion-mpl-cache XDG_CACHE_HOME=/tmp/anadiffusion-xdg-cache /opt/anaconda3/bin/python3 -m unittest tests.test_assembly_animation.AnimationStateTests tests.test_assembly_animation.MediaOutputTests -v
```

Expected: FAIL because the current renderer and encoded media remain 12 seconds and complete the turn at 11.2 seconds.

- [ ] **Step 3: Implement the 16-second timeline**

Set `DURATION = 16.0`. Preserve all assembly entrance times, but move the turn end and fade boundaries:

```python
if time_s >= 15.2:
    fade_out = 1.0 - _smoothstep(15.2, 16.0, time_s)

turn_progress = _smoothstep(5.2, 15.2, loop_time)
title_alpha = 1.0 - _smoothstep(15.4, 16.0, time_s)
```

Keep the existing azimuth, inferior-view elevation curve, 50% opacity, stage labels, and poster timestamp unchanged.

- [ ] **Step 4: Verify, regenerate, inspect, and commit**

Run the focused tests, render all 384 frames, and replace both videos and the poster. Inspect an encoded two-second contact sheet for calmer full-turn motion, the midpoint inferior view, seamless return, 50% opacity, and correct depth sorting. Run all Python and Node tests plus the unchanged webpage/NIfTI audit. Commit locally without pushing.

### Task 10: Deliver the approved animation at 1.25x playback

**Files:**
- Modify: `tests/test_assembly_animation.py`
- Modify: `scripts/render-assembly-animation.py`
- Regenerate: `media/anadiffusion-assembly.mp4`
- Regenerate: `media/anadiffusion-assembly.webm`
- Verify unchanged: `media/anadiffusion-assembly-poster.png`

- [ ] **Step 1: Write failing playback-rate tests**

Add a renderer configuration test that requires an exact 1.25x playback rate and 30 fps output:

```python
def test_output_uses_the_approved_playback_rate(self):
    self.assertAlmostEqual(getattr(self.renderer, "PLAYBACK_RATE", 1.0), 1.25)
    self.assertEqual(getattr(self.renderer, "OUTPUT_FPS", self.renderer.FPS), 30)
```

Rename the media test to `test_videos_are_silent_1_25x_720p_loops`, change the expected frame rate from `24/1` to `30/1`, and change the expected duration from `16.0` to `12.8` seconds.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
MPLCONFIGDIR=/tmp/anadiffusion-mpl-cache XDG_CACHE_HOME=/tmp/anadiffusion-xdg-cache /opt/anaconda3/bin/python3 -m unittest tests.test_assembly_animation.AnimationStateTests tests.test_assembly_animation.MediaOutputTests -v
```

Expected: FAIL because the renderer has no playback-rate configuration and both current videos probe as 16 seconds at 24 fps.

- [ ] **Step 3: Implement exact frame-preserving 1.25x encoding**

Keep `FPS = 24` as the source-frame sampling rate and add:

```python
PLAYBACK_RATE = 1.25
OUTPUT_FPS = int(FPS * PLAYBACK_RATE)
```

Change only FFmpeg's frame-sequence input rate:

```python
"-framerate",
str(OUTPUT_FPS),
```

Do not change `DURATION`, source frame count, stage/camera functions, opacity, labels, or poster rendering.

- [ ] **Step 4: Verify, regenerate, inspect, and commit**

Run the focused configuration tests, regenerate the same 384 source frames, and replace both videos. Compare the poster hash to its pre-render value. Inspect a two-second contact sheet from the encoded MP4 for the unchanged frame sequence and complete orbit. Run all Python and Node tests plus the unchanged webpage/NIfTI audit. Commit locally without pushing.
