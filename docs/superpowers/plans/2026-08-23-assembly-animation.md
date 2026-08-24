# Anatomical Assembly Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the three staged assembly NIfTIs as a deterministic 8-second cinematic 3D loop in MP4 and WebM formats with a matching poster frame.

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
self.assertEqual(state(8.0), {"left": 0.0, "right": 0.0, "cb": 0.0})
self.assertEqual(renderer.camera_angles(0.0), renderer.camera_angles(8.0))
```

Call `load_part_masks()` and assert every mask is `(128, 128, 128)`, all masks are nonempty and pairwise disjoint, and the returned affine equals the shared assembly affine.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
/opt/anaconda3/bin/python3 -m unittest tests.test_assembly_animation -v
```

Expected: FAIL because `scripts/render-assembly-animation.py` does not exist.

- [ ] **Step 3: Implement schedule and mask extraction**

Create constants for `WIDTH = 1280`, `HEIGHT = 720`, `FPS = 24`, `DURATION = 8.0`, the three input paths, and the established RGB colors.

Implement a clamped smoothstep fade:

```python
def smoothstep(start: float, end: float, value: float) -> float:
    x = np.clip((value - start) / (end - start), 0.0, 1.0)
    return float(x * x * (3.0 - 2.0 * x))
```

`stage_state(time_s)` multiplies each part's entrance opacity by `1 - smoothstep(7.2, 8.0, time_s)`. Entrances are left `0.0–0.5`, right `2.4–3.0`, and cb `4.6–5.2`. `camera_angles(time_s)` uses a full-period sine so time 0 and 8 return identical elevation and azimuth.

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

Add `render_animation(output_dir: Path)` that renders exactly `FPS * DURATION = 192` frames into a `TemporaryDirectory`, saving files as `frame-0000.png` through `frame-0191.png`. Save a separate full-resolution poster from time `6.0`.

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

Expected: the MP4, WebM, and poster appear under `media/` and temporary frames are removed automatically.

- [ ] **Step 3: Inspect one poster and representative video frames**

Use the local image viewer on the poster and FFmpeg-extracted frames near seconds 1, 4, and 6. Confirm correct anatomy, palette, framing, stage labels, and absence of axes/crosshairs.

### Task 4: Verify media and regressions

**Files:**
- Modify: `tests/test_assembly_animation.py`
- Verify unchanged: `index.html`
- Verify unchanged: `assets/js/volume-viewer.mjs`
- Verify unchanged: the three input NIfTIs

- [ ] **Step 1: Add media metadata tests**

Use `ffprobe -v error -show_entries stream=codec_type,width,height -show_entries format=duration -of json` from `subprocess.run`. Assert both videos exist, have one video stream, have no audio stream, are `1280 × 720`, and report duration within `0.05` seconds of `8.0`. Assert the poster is `1280 × 720` RGB.

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
