# Continuous Assembly Orbit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a separate transparent, text-free WebM in which anatomical parts assemble during one uninterrupted 360-degree brain orbit.

**Architecture:** Add an explicit camera motion mode while preserving the current assemble-then-turn default. Route both transparent outputs through one reusable RGBA frame-sequence encoder, then expose a dedicated CLI flag that writes only the continuous-orbit comparison WebM. Tests protect the old camera path, the new concurrent motion, media metadata, decoded alpha, and all existing assets.

**Tech Stack:** Python 3, unittest, NumPy, Matplotlib Agg, Pillow, FFmpeg/libvpx-vp9, ffprobe, Node test runner

---

### Task 1: Add an isolated continuous camera mode

**Files:**
- Modify: `tests/test_assembly_animation.py`
- Modify: `scripts/render-assembly-animation.py`

- [ ] **Step 1: Write failing continuous-camera tests**

Add these methods to `AnimationStateTests`:

```python
def test_continuous_mode_turns_while_parts_are_assembling(self):
    _, default_start = self.renderer.camera_angles(0.0)
    _, default_during_assembly = self.renderer.camera_angles(2.4)
    self.assertEqual(default_start, default_during_assembly)

    _, continuous_start = self.renderer.camera_angles(
        0.0,
        motion_mode="continuous",
    )
    _, continuous_during_assembly = self.renderer.camera_angles(
        2.4,
        motion_mode="continuous",
    )
    self.assertGreater(continuous_during_assembly, continuous_start)

def test_continuous_mode_completes_one_smooth_loop(self):
    start_elevation, start_azimuth = self.renderer.camera_angles(
        0.0,
        motion_mode="continuous",
    )
    midpoint_elevation, _ = self.renderer.camera_angles(
        7.6,
        motion_mode="continuous",
    )
    end_elevation, end_azimuth = self.renderer.camera_angles(
        15.2,
        motion_mode="continuous",
    )
    loop_elevation, loop_azimuth = self.renderer.camera_angles(
        16.0,
        motion_mode="continuous",
    )

    self.assertAlmostEqual(end_azimuth - start_azimuth, 360.0)
    self.assertAlmostEqual(midpoint_elevation, -15.0)
    self.assertAlmostEqual(end_elevation, start_elevation)
    self.assertAlmostEqual(loop_elevation, start_elevation)
    self.assertAlmostEqual(loop_azimuth, start_azimuth)

def test_camera_rejects_an_unknown_motion_mode(self):
    with self.assertRaisesRegex(ValueError, "unknown camera motion mode"):
        self.renderer.camera_angles(1.0, motion_mode="unknown")
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
MPLCONFIGDIR=/tmp/anadiffusion-mpl-cache XDG_CACHE_HOME=/tmp/anadiffusion-xdg-cache /opt/anaconda3/bin/python3 -m unittest tests.test_assembly_animation.AnimationStateTests -v
```

Expected: the three new tests fail because `camera_angles()` does not accept `motion_mode`.

- [ ] **Step 3: Implement the camera mode**

Replace `camera_angles()` with:

```python
def camera_angles(
    time_s: float,
    *,
    motion_mode: str = "assembled",
) -> tuple[float, float]:
    """Return the approved loop for the selected assembly motion mode."""
    turn_starts = {
        "assembled": 5.2,
        "continuous": 0.0,
    }
    try:
        turn_start = turn_starts[motion_mode]
    except KeyError as error:
        raise ValueError(f"unknown camera motion mode: {motion_mode}") from error

    loop_time = float(time_s) % DURATION
    turn_progress = _smoothstep(turn_start, 15.2, loop_time)
    elevation = 45.0 - 60.0 * math.sin(math.pi * turn_progress) ** 4
    azimuth = -38.0 + 360.0 * turn_progress
    return elevation, azimuth
```

Add a keyword-only `motion_mode: str = "assembled"` parameter to `AssemblyRenderer.__init__()`, assign `self.motion_mode = motion_mode`, and validate it once by calling:

```python
camera_angles(0.0, motion_mode=self.motion_mode)
```

Update `render_frame()` to use:

```python
elevation, azimuth = camera_angles(
    time_s,
    motion_mode=self.motion_mode,
)
```

- [ ] **Step 4: Run camera and frame tests and verify GREEN**

Run:

```bash
MPLCONFIGDIR=/tmp/anadiffusion-mpl-cache XDG_CACHE_HOME=/tmp/anadiffusion-xdg-cache /opt/anaconda3/bin/python3 -m unittest tests.test_assembly_animation.AnimationStateTests tests.test_assembly_animation.FrameRenderTests tests.test_assembly_animation.TransparentFrameRenderTests -v
```

Expected: all camera and frame tests pass, including the unchanged default-camera assertions.

- [ ] **Step 5: Commit the camera mode**

```bash
git add tests/test_assembly_animation.py scripts/render-assembly-animation.py
git commit -m "Add continuous assembly camera mode"
```

### Task 2: Add a dedicated transparent comparison renderer and CLI

**Files:**
- Modify: `tests/test_assembly_animation.py`
- Modify: `scripts/render-assembly-animation.py`

- [ ] **Step 1: Write a failing renderer-contract test**

Add this method to `RendererPresenceTests`:

```python
def test_continuous_transparent_renderer_has_a_dedicated_cli(self):
    renderer = load_renderer()
    self.assertTrue(callable(renderer.render_continuous_transparent_animation))
    source = RENDERER_PATH.read_text(encoding="utf-8")
    self.assertIn("--continuous-assembly", source)
    self.assertIn("anadiffusion-assembly-transparent-continuous.webm", source)
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
MPLCONFIGDIR=/tmp/anadiffusion-mpl-cache XDG_CACHE_HOME=/tmp/anadiffusion-xdg-cache /opt/anaconda3/bin/python3 -m unittest tests.test_assembly_animation.RendererPresenceTests.test_continuous_transparent_renderer_has_a_dedicated_cli -v
```

Expected: FAIL because the dedicated function and CLI flag do not exist.

- [ ] **Step 3: Extract the shared transparent-video renderer**

Add this helper immediately before `render_transparent_animation()`:

```python
def _render_transparent_video(
    output_path: Path,
    *,
    motion_mode: str,
    width: int,
    height: int,
    mesh_step: int,
) -> Path:
    masks, affine = load_part_masks()
    renderer = AssemblyRenderer(
        masks,
        affine,
        width=width,
        height=height,
        mesh_step=mesh_step,
        transparent=True,
        show_text=False,
        motion_mode=motion_mode,
    )
    try:
        with tempfile.TemporaryDirectory(
            prefix=f"anadiffusion-assembly-{motion_mode}-"
        ) as temp_dir:
            frame_dir = Path(temp_dir)
            frame_count = int(DURATION * FPS)
            for index in range(frame_count):
                time_s = index / FPS
                frame = renderer.render_frame(time_s)
                frame.save(frame_dir / f"frame-{index:04d}.png", compress_level=1)
                if index % FPS == 0:
                    print(f"Rendered {index:03d}/{frame_count} frames", flush=True)

            _encode_transparent_webm(
                frame_dir / "frame-%04d.png",
                output_path,
            )
    finally:
        renderer.close()
    return output_path
```

Replace the entire `render_transparent_animation()` function with:

```python
def render_transparent_animation(
    output_dir: Path = MEDIA_DIR,
    *,
    width: int = WIDTH,
    height: int = HEIGHT,
    mesh_step: int = 2,
) -> tuple[Path, Path]:
    """Render the approved assemble-then-turn animation on alpha."""
    output_dir.mkdir(parents=True, exist_ok=True)
    webm_path = _render_transparent_video(
        output_dir / "anadiffusion-assembly-transparent.webm",
        motion_mode="assembled",
        width=width,
        height=height,
        mesh_step=mesh_step,
    )
    poster_path = output_dir / "anadiffusion-assembly-transparent-poster.png"
    render_transparent_poster(
        poster_path,
        width=width,
        height=height,
        mesh_step=1,
    )
    return webm_path, poster_path
```

- [ ] **Step 4: Add the comparison renderer and CLI path**

Add:

```python
def render_continuous_transparent_animation(
    output_dir: Path = MEDIA_DIR,
    *,
    width: int = WIDTH,
    height: int = HEIGHT,
    mesh_step: int = 2,
) -> Path:
    """Render assembly and rotation concurrently on a transparent canvas."""
    output_dir.mkdir(parents=True, exist_ok=True)
    return _render_transparent_video(
        output_dir / "anadiffusion-assembly-transparent-continuous.webm",
        motion_mode="continuous",
        width=width,
        height=height,
        mesh_step=mesh_step,
    )
```

Add this parser option:

```python
parser.add_argument(
    "--continuous-assembly",
    action="store_true",
    help="Render the transparent assembly during one continuous orbit",
)
```

Handle it before `--transparent-variant`:

```python
if args.continuous_assembly:
    path = render_continuous_transparent_animation(
        args.output_dir,
        width=args.width,
        height=args.height,
        mesh_step=args.mesh_step,
    )
    print(_display_path(path))
    return
```

- [ ] **Step 5: Run focused and regression tests**

Run:

```bash
MPLCONFIGDIR=/tmp/anadiffusion-mpl-cache XDG_CACHE_HOME=/tmp/anadiffusion-xdg-cache /opt/anaconda3/bin/python3 -m unittest tests.test_assembly_animation.RendererPresenceTests tests.test_assembly_animation.AnimationStateTests tests.test_assembly_animation.FrameRenderTests tests.test_assembly_animation.TransparentFrameRenderTests -v
```

Expected: all focused tests pass. Run `python scripts/render-assembly-animation.py --help` and confirm both `--continuous-assembly` and `--transparent-variant` remain listed.

- [ ] **Step 6: Commit the isolated render path**

```bash
git add tests/test_assembly_animation.py scripts/render-assembly-animation.py
git commit -m "Add continuous transparent assembly renderer"
```

### Task 3: Render, inspect, and verify the comparison video

**Files:**
- Modify: `tests/test_assembly_animation.py`
- Create: `media/anadiffusion-assembly-transparent-continuous.webm`

- [ ] **Step 1: Record protected-asset hashes**

Run:

```bash
shasum -a 256 \
  media/anadiffusion-assembly.mp4 \
  media/anadiffusion-assembly.webm \
  media/anadiffusion-assembly-poster.png \
  media/anadiffusion-assembly-transparent.webm \
  media/anadiffusion-assembly-transparent-poster.png \
  index.html assets/css/main.css volumes/*.nii.gz
```

Save the output for comparison after rendering. No protected hash may change.

- [ ] **Step 2: Write failing media-contract tests**

Add `"anadiffusion-assembly-transparent-continuous.webm"` to `test_expected_media_files_exist()` and add:

```python
@unittest.skipUnless(shutil.which("ffprobe"), "ffprobe is required")
def test_continuous_webm_is_silent_alpha_1_25x_720p(self):
    path = ROOT / "media" / "anadiffusion-assembly-transparent-continuous.webm"
    self.assertTrue(path.is_file(), path.name)
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration:stream=codec_type,width,height,r_frame_rate:stream_tags=alpha_mode",
            "-of",
            "json",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    probe = json.loads(result.stdout)
    video_streams = [
        stream for stream in probe["streams"] if stream["codec_type"] == "video"
    ]
    audio_streams = [
        stream for stream in probe["streams"] if stream["codec_type"] == "audio"
    ]
    self.assertEqual(len(video_streams), 1)
    self.assertEqual(audio_streams, [])
    video = video_streams[0]
    self.assertEqual(video["width"], 1280)
    self.assertEqual(video["height"], 720)
    self.assertEqual(video["r_frame_rate"], "30/1")
    tags = {key.lower(): value for key, value in video.get("tags", {}).items()}
    self.assertEqual(tags.get("alpha_mode"), "1")
    self.assertAlmostEqual(float(probe["format"]["duration"]), 12.8, places=2)
```

- [ ] **Step 3: Run the media tests and verify RED**

Run:

```bash
MPLCONFIGDIR=/tmp/anadiffusion-mpl-cache XDG_CACHE_HOME=/tmp/anadiffusion-xdg-cache /opt/anaconda3/bin/python3 -m unittest tests.test_assembly_animation.MediaOutputTests -v
```

Expected: the new existence and metadata tests fail because the comparison WebM has not been rendered.

- [ ] **Step 4: Render the full comparison animation**

Run:

```bash
MPLCONFIGDIR=/tmp/anadiffusion-mpl-cache XDG_CACHE_HOME=/tmp/anadiffusion-xdg-cache /opt/anaconda3/bin/python3 scripts/render-assembly-animation.py --continuous-assembly
```

Expected: 384 source frames render, then `media/anadiffusion-assembly-transparent-continuous.webm` is encoded.

- [ ] **Step 5: Verify metadata and decoded alpha**

Run:

```bash
ffprobe -v error \
  -show_entries format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate:stream_tags=alpha_mode \
  -of json media/anadiffusion-assembly-transparent-continuous.webm
```

Expected: one VP9 video stream, no audio stream, `1280 × 720`, `30/1`, `ALPHA_MODE=1`, and `12.800000` seconds.

Decode a complete-assembly frame with the alpha-capable decoder:

```bash
ffmpeg -hide_banner -loglevel error -y \
  -c:v libvpx-vp9 -ss 6.2 \
  -i media/anadiffusion-assembly-transparent-continuous.webm \
  -frames:v 1 /private/tmp/anadiffusion-continuous-decoded.png
```

Inspect its alpha channel:

```bash
/opt/anaconda3/bin/python3 -c 'from PIL import Image; import numpy as np; im=Image.open("/private/tmp/anadiffusion-continuous-decoded.png"); a=np.asarray(im)[...,3]; print(im.mode, im.size, int(a.min()), int(a.max()), int(np.count_nonzero(a > 0)))'
```

Expected: `RGBA (1280, 720)`, minimum alpha `0`, maximum alpha greater than `0`, and a positive visible-pixel count.

- [ ] **Step 6: Inspect representative motion frames**

Decode left-only, right-entry, complete, inferior, and closing frames over a temporary dark background:

```bash
ffmpeg -hide_banner -loglevel error -y \
  -c:v libvpx-vp9 \
  -i media/anadiffusion-assembly-transparent-continuous.webm \
  -f lavfi -i color=c=0x21162f:s=1280x720:r=30 \
  -filter_complex "[1:v][0:v]overlay=shortest=1,select='eq(n,24)+eq(n,65)+eq(n,130)+eq(n,182)+eq(n,360)',scale=320:180,tile=5x1:nb_frames=5:padding=4:margin=4" \
  -frames:v 1 /private/tmp/anadiffusion-continuous-contact.png
```

Open `/private/tmp/anadiffusion-continuous-contact.png` with the `view_image` tool. Confirm that azimuth changes between every assembly stage, the parts remain registered, overlap order is depth-correct, no text appears, and no background from the source video covers the temporary dark canvas.

- [ ] **Step 7: Run complete verification**

Run:

```bash
MPLCONFIGDIR=/tmp/anadiffusion-mpl-cache XDG_CACHE_HOME=/tmp/anadiffusion-xdg-cache /opt/anaconda3/bin/python3 -m unittest tests.test_assembly_animation tests.test_colored_assembly -v
node --test tests/*.test.mjs
git diff --check
```

Expected: all Python tests pass, all 55 Node tests pass, and the diff check is clean. Repeat the Step 1 hash command and confirm every protected hash matches exactly.

- [ ] **Step 8: Commit the verified comparison media**

```bash
git add tests/test_assembly_animation.py media/anadiffusion-assembly-transparent-continuous.webm
git commit -m "Render continuous assembly orbit comparison"
```

- [ ] **Step 9: Integrate locally without pushing**

Use `superpowers:finishing-a-development-branch`. Fast-forward the verified commits onto local `main`, rerun all Python and Node tests on the merged result, clean up the worktree and feature branch, and do not push.
