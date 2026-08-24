#!/usr/bin/env python3
"""Render the AnaDiffusion part-to-whole assembly animation."""

from __future__ import annotations

import argparse
import math
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

os.environ.setdefault(
    "MPLCONFIGDIR", str(Path(tempfile.gettempdir()) / "anadiffusion-mpl-cache")
)
os.environ.setdefault(
    "XDG_CACHE_HOME", str(Path(tempfile.gettempdir()) / "anadiffusion-xdg-cache")
)

import matplotlib

matplotlib.use("Agg")
from matplotlib.backends.backend_agg import FigureCanvasAgg
from matplotlib.colors import to_rgba
from matplotlib.figure import Figure
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import nibabel as nib
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
from skimage.measure import marching_cubes


ROOT = Path(__file__).resolve().parents[1]
VOLUME_DIR = ROOT / "volumes"
MEDIA_DIR = ROOT / "media"

WIDTH = 1280
HEIGHT = 720
FPS = 24
PLAYBACK_RATE = 1.25
OUTPUT_FPS = int(FPS * PLAYBACK_RATE)
DURATION = 16.0
PART_OPACITY = 0.50

BACKGROUND = "#0d091b"
BACKGROUND_RGB = (13, 9, 27)
PART_COLORS = {
    "left": "#a883ed",
    "right": "#91c978",
    "cb": "#f0cf68",
}


def _smoothstep(start: float, end: float, value: float) -> float:
    if start == end:
        return float(value >= end)
    progress = float(np.clip((value - start) / (end - start), 0.0, 1.0))
    return progress * progress * (3.0 - 2.0 * progress)


def stage_state(time_s: float) -> dict[str, float]:
    """Return the opacity of each anatomical component at ``time_s``."""
    time_s = float(np.clip(time_s, 0.0, DURATION))

    left = _smoothstep(0.0, 0.5, time_s)
    right = _smoothstep(2.4, 3.0, time_s)
    cb = _smoothstep(4.6, 5.2, time_s)

    if time_s >= 15.2:
        fade_out = 1.0 - _smoothstep(15.2, 16.0, time_s)
        left *= fade_out
        right *= fade_out
        cb *= fade_out

    return {"left": left, "right": right, "cb": cb}


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


def _foreground(image: nib.spatialimages.SpatialImage) -> np.ndarray:
    data = np.asanyarray(image.dataobj)
    if data.dtype.fields and {"R", "G", "B"}.issubset(data.dtype.fields):
        return (data["R"] > 0) | (data["G"] > 0) | (data["B"] > 0)
    if data.ndim == 4 and data.shape[-1] >= 3:
        return np.any(data[..., :3] > 0, axis=-1)
    return data != 0


def load_part_masks(
    volume_dir: Path = VOLUME_DIR,
) -> tuple[dict[str, np.ndarray], np.ndarray]:
    """Recover disjoint left, right, and CB masks from the three stage volumes."""
    paths = {
        "left": volume_dir / "assembly-left-sample-01.nii.gz",
        "hemispheres": volume_dir / "assembly-hemispheres-sample-01.nii.gz",
        "full": volume_dir / "assembly-parts-sample-01.nii.gz",
    }
    images = {name: nib.load(path) for name, path in paths.items()}
    reference = images["full"]

    for name, image in images.items():
        if image.shape != reference.shape:
            raise ValueError(
                f"{name} volume has shape {image.shape}; expected {reference.shape}"
            )
        if not np.allclose(image.affine, reference.affine):
            raise ValueError(f"{name} volume does not share the final-canvas affine")

    left_stage = _foreground(images["left"])
    hemispheres_stage = _foreground(images["hemispheres"])
    full_stage = _foreground(images["full"])

    left = left_stage
    right = hemispheres_stage & ~left_stage
    cb = full_stage & ~hemispheres_stage

    masks = {"left": left, "right": right, "cb": cb}
    for name, mask in masks.items():
        if not np.any(mask):
            raise ValueError(f"derived {name} mask is empty")

    return masks, reference.affine.copy()


def _make_mesh(
    mask: np.ndarray,
    affine: np.ndarray,
    *,
    mesh_step: int,
) -> tuple[np.ndarray, np.ndarray]:
    field = gaussian_filter(mask.astype(np.float32), sigma=0.8)
    vertices, faces, _, _ = marching_cubes(
        field,
        level=0.35,
        step_size=mesh_step,
        allow_degenerate=False,
    )
    vertices = nib.affines.apply_affine(affine, vertices)
    return vertices, faces


def _stage_label(time_s: float) -> str:
    if time_s < 2.4:
        return "01  ·  LEFT HEMISPHERE"
    if time_s < 4.6:
        return "02  ·  BILATERAL HEMISPHERES"
    if time_s < 5.2:
        return "03  ·  CEREBELLUM–BRAINSTEM"
    return "ASSEMBLED ANATOMY"


class AssemblyRenderer:
    """Cached Matplotlib renderer for the three anatomical meshes."""

    def __init__(
        self,
        masks: dict[str, np.ndarray],
        affine: np.ndarray,
        *,
        width: int = WIDTH,
        height: int = HEIGHT,
        mesh_step: int = 2,
        transparent: bool = False,
        show_text: bool = True,
        motion_mode: str = "assembled",
    ) -> None:
        self.width = int(width)
        self.height = int(height)
        self.dpi = 100
        self.transparent = bool(transparent)
        self.show_text = bool(show_text)
        self.motion_mode = motion_mode
        camera_angles(0.0, motion_mode=self.motion_mode)
        canvas_color = (0.0, 0.0, 0.0, 0.0) if self.transparent else BACKGROUND

        self.figure = Figure(
            figsize=(self.width / self.dpi, self.height / self.dpi),
            dpi=self.dpi,
            facecolor=canvas_color,
        )
        self.canvas = FigureCanvasAgg(self.figure)
        self.axes = self.figure.add_axes(
            [0.02, 0.03, 0.96, 0.94],
            projection="3d",
            computed_zorder=True,
        )
        self.axes.set_facecolor(canvas_color)
        self.axes.set_axis_off()
        self.axes.set_proj_type("ortho")

        mesh_data: dict[str, tuple[np.ndarray, np.ndarray]] = {}
        all_vertices: list[np.ndarray] = []
        for name in ("left", "right", "cb"):
            vertices, faces = _make_mesh(
                masks[name], affine, mesh_step=max(1, int(mesh_step))
            )
            mesh_data[name] = (vertices, faces)
            all_vertices.append(vertices)

        bounds_source = np.concatenate(all_vertices, axis=0)
        minimum = bounds_source.min(axis=0)
        maximum = bounds_source.max(axis=0)
        center = (minimum + maximum) / 2.0
        radius = float(np.max(maximum - minimum) / 2.0) * 1.08

        self.axes.set_xlim(center[0] - radius, center[0] + radius)
        self.axes.set_ylim(center[1] - radius, center[1] + radius)
        self.axes.set_zlim(center[2] - radius, center[2] + radius)
        self.axes.set_box_aspect((1.0, 1.0, 1.0), zoom=1.35)

        triangle_groups: list[np.ndarray] = []
        facecolor_groups: list[np.ndarray] = []
        self.face_part_slices: dict[str, slice] = {}
        face_offset = 0
        light_direction = np.array([0.35, -0.45, 0.82], dtype=np.float64)
        light_direction /= np.linalg.norm(light_direction)

        for name in ("left", "right", "cb"):
            vertices, faces = mesh_data[name]
            triangles = vertices[faces]
            triangle_groups.append(triangles)

            edges_a = triangles[:, 1] - triangles[:, 0]
            edges_b = triangles[:, 2] - triangles[:, 0]
            normals = np.cross(edges_a, edges_b)
            lengths = np.linalg.norm(normals, axis=1, keepdims=True)
            normals = np.divide(normals, lengths, out=np.zeros_like(normals), where=lengths > 0)
            illumination = np.clip(normals @ light_direction, -1.0, 1.0)
            illumination = 0.68 + 0.32 * (illumination + 1.0) / 2.0

            base_rgba = np.array(to_rgba(PART_COLORS[name]), dtype=np.float64)
            facecolors = np.tile(base_rgba, (len(faces), 1))
            facecolors[:, :3] *= illumination[:, None]
            facecolors[:, 3] = 0.0
            facecolor_groups.append(facecolors)

            next_offset = face_offset + len(faces)
            self.face_part_slices[name] = slice(face_offset, next_offset)
            face_offset = next_offset

        all_triangles = np.concatenate(triangle_groups, axis=0)
        self.base_facecolors = np.concatenate(facecolor_groups, axis=0)
        self.surface_collection = Poly3DCollection(
            all_triangles,
            facecolors=self.base_facecolors,
            edgecolors="none",
            linewidth=0.0,
            zsort="average",
        )
        self.axes.add_collection3d(self.surface_collection)

        scale = self.width / WIDTH
        self.eyebrow = self.figure.text(
            0.055,
            0.905,
            "ANADIFFUSION",
            color="#b9e29e",
            fontsize=max(7, 12 * scale),
            fontweight="bold",
            family="DejaVu Sans",
            ha="left",
            va="center",
        )
        self.heading = self.figure.text(
            0.055,
            0.845,
            "PART-TO-WHOLE ASSEMBLY",
            color="#ffffff",
            fontsize=max(9, 21 * scale),
            fontweight="bold",
            family="DejaVu Sans",
            ha="left",
            va="center",
        )
        self.stage_text = self.figure.text(
            0.5,
            0.075,
            "",
            color="#ded8ea",
            fontsize=max(7, 12 * scale),
            fontweight="bold",
            family="DejaVu Sans",
            ha="center",
            va="center",
        )
        self.eyebrow.set_visible(self.show_text)
        self.heading.set_visible(self.show_text)
        self.stage_text.set_visible(self.show_text)

    def render_frame(self, time_s: float) -> Image.Image:
        state = stage_state(time_s)
        facecolors = self.base_facecolors.copy()
        for name, alpha in state.items():
            facecolors[self.face_part_slices[name], 3] = alpha * PART_OPACITY
        self.surface_collection.set_facecolor(facecolors)

        elevation, azimuth = camera_angles(
            time_s,
            motion_mode=self.motion_mode,
        )
        self.axes.view_init(elev=elevation, azim=azimuth, roll=0.0)
        if self.show_text:
            self.stage_text.set_text(_stage_label(time_s))

            title_alpha = 1.0 - _smoothstep(15.4, 16.0, time_s)
            self.eyebrow.set_alpha(title_alpha)
            self.heading.set_alpha(title_alpha)
            self.stage_text.set_alpha(title_alpha)

        self.canvas.draw()
        rgba = np.asarray(self.canvas.buffer_rgba()).copy()
        if self.transparent:
            return Image.fromarray(rgba, mode="RGBA")
        return Image.fromarray(rgba[..., :3], mode="RGB")

    def close(self) -> None:
        self.figure.clear()


def _encode_video(
    frame_pattern: Path,
    output_path: Path,
    *,
    codec: str,
) -> None:
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        raise RuntimeError("ffmpeg is required to encode the animation")

    command = [
        ffmpeg,
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-framerate",
        str(OUTPUT_FPS),
        "-i",
        str(frame_pattern),
        "-an",
        "-c:v",
        codec,
    ]
    if codec == "libx264":
        command += ["-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
    elif codec == "libvpx-vp9":
        command += ["-crf", "30", "-b:v", "0", "-pix_fmt", "yuv420p"]
    command.append(str(output_path))
    subprocess.run(command, check=True)


def _encode_transparent_webm(frame_pattern: Path, output_path: Path) -> None:
    """Encode RGBA PNG frames as a browser-compatible VP9 alpha video."""
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        raise RuntimeError("ffmpeg is required to encode the animation")

    subprocess.run(
        [
            ffmpeg,
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-framerate",
            str(OUTPUT_FPS),
            "-i",
            str(frame_pattern),
            "-an",
            "-c:v",
            "libvpx-vp9",
            "-crf",
            "30",
            "-b:v",
            "0",
            "-pix_fmt",
            "yuva420p",
            "-auto-alt-ref",
            "0",
            "-metadata:s:v:0",
            "alpha_mode=1",
            str(output_path),
        ],
        check=True,
    )


def render_animation(
    output_dir: Path = MEDIA_DIR,
    *,
    width: int = WIDTH,
    height: int = HEIGHT,
    mesh_step: int = 2,
) -> tuple[Path, Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    masks, affine = load_part_masks()
    renderer = AssemblyRenderer(
        masks,
        affine,
        width=width,
        height=height,
        mesh_step=mesh_step,
    )

    mp4_path = output_dir / "anadiffusion-assembly.mp4"
    webm_path = output_dir / "anadiffusion-assembly.webm"
    poster_path = output_dir / "anadiffusion-assembly-poster.png"

    try:
        with tempfile.TemporaryDirectory(prefix="anadiffusion-assembly-") as temp_dir:
            frame_dir = Path(temp_dir)
            frame_count = int(DURATION * FPS)
            for index in range(frame_count):
                time_s = index / FPS
                frame = renderer.render_frame(time_s)
                frame.save(frame_dir / f"frame-{index:04d}.png", compress_level=1)
                if index % FPS == 0:
                    print(f"Rendered {index:03d}/{frame_count} frames", flush=True)

            pattern = frame_dir / "frame-%04d.png"
            _encode_video(pattern, mp4_path, codec="libx264")
            _encode_video(pattern, webm_path, codec="libvpx-vp9")
    finally:
        renderer.close()

    render_poster(poster_path, width=width, height=height, mesh_step=1)

    return mp4_path, webm_path, poster_path


def render_transparent_animation(
    output_dir: Path = MEDIA_DIR,
    *,
    width: int = WIDTH,
    height: int = HEIGHT,
    mesh_step: int = 2,
) -> tuple[Path, Path]:
    """Render the same animation on alpha with every label removed."""
    output_dir.mkdir(parents=True, exist_ok=True)
    masks, affine = load_part_masks()
    renderer = AssemblyRenderer(
        masks,
        affine,
        width=width,
        height=height,
        mesh_step=mesh_step,
        transparent=True,
        show_text=False,
    )

    webm_path = output_dir / "anadiffusion-assembly-transparent.webm"
    poster_path = output_dir / "anadiffusion-assembly-transparent-poster.png"

    try:
        with tempfile.TemporaryDirectory(
            prefix="anadiffusion-assembly-transparent-"
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
                webm_path,
            )
    finally:
        renderer.close()

    render_transparent_poster(
        poster_path,
        width=width,
        height=height,
        mesh_step=1,
    )
    return webm_path, poster_path


def render_poster(
    output_path: Path,
    *,
    width: int = WIDTH,
    height: int = HEIGHT,
    mesh_step: int = 1,
) -> Path:
    """Render the final assembled state with a higher-detail surface mesh."""
    masks, affine = load_part_masks()
    renderer = AssemblyRenderer(
        masks,
        affine,
        width=width,
        height=height,
        mesh_step=mesh_step,
    )
    try:
        frame = renderer.render_frame(6.2)
    finally:
        renderer.close()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    frame.save(output_path, optimize=True)
    return output_path


def render_transparent_poster(
    output_path: Path,
    *,
    width: int = WIDTH,
    height: int = HEIGHT,
    mesh_step: int = 1,
) -> Path:
    """Render the assembled state on alpha without any labels."""
    masks, affine = load_part_masks()
    renderer = AssemblyRenderer(
        masks,
        affine,
        width=width,
        height=height,
        mesh_step=mesh_step,
        transparent=True,
        show_text=False,
    )
    try:
        frame = renderer.render_frame(6.2)
    finally:
        renderer.close()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    frame.save(output_path, optimize=True)
    return output_path


def render_preview_strip(
    output_path: Path,
    *,
    width: int = 640,
    height: int = 360,
    mesh_step: int = 2,
) -> Path:
    """Render four representative states into one QA contact sheet."""
    masks, affine = load_part_masks()
    renderer = AssemblyRenderer(
        masks,
        affine,
        width=width,
        height=height,
        mesh_step=mesh_step,
    )
    try:
        frames = [renderer.render_frame(time_s) for time_s in (1.0, 3.5, 4.9, 6.2)]
    finally:
        renderer.close()

    sheet = Image.new("RGB", (width * 2, height * 2), BACKGROUND_RGB)
    for index, frame in enumerate(frames):
        sheet.paste(frame, ((index % 2) * width, (index // 2) * height))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output_path, optimize=True)
    return output_path


def _display_path(path: Path) -> str:
    """Prefer a repository-relative CLI path without rejecting external outputs."""
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=MEDIA_DIR,
        help="Directory for the rendered media (default: media/)",
    )
    parser.add_argument("--width", type=int, default=WIDTH)
    parser.add_argument("--height", type=int, default=HEIGHT)
    parser.add_argument(
        "--mesh-step",
        type=int,
        default=2,
        help="Marching-cubes step size; lower is more detailed and slower",
    )
    parser.add_argument(
        "--preview-strip",
        type=Path,
        help="Render a four-state PNG contact sheet instead of the videos",
    )
    parser.add_argument(
        "--poster-only",
        action="store_true",
        help="Render only the high-detail poster PNG",
    )
    parser.add_argument(
        "--transparent-variant",
        action="store_true",
        help="Render a transparent VP9 WebM and text-free RGBA poster",
    )
    args = parser.parse_args()
    if args.preview_strip:
        path = render_preview_strip(
            args.preview_strip,
            width=args.width,
            height=args.height,
            mesh_step=args.mesh_step,
        )
        print(path)
        return
    if args.poster_only:
        path = render_poster(
            args.output_dir / "anadiffusion-assembly-poster.png",
            width=args.width,
            height=args.height,
            mesh_step=1,
        )
        print(_display_path(path))
        return
    if args.transparent_variant:
        paths = render_transparent_animation(
            args.output_dir,
            width=args.width,
            height=args.height,
            mesh_step=args.mesh_step,
        )
        for path in paths:
            print(_display_path(path))
        return
    paths = render_animation(
        args.output_dir,
        width=args.width,
        height=args.height,
        mesh_step=args.mesh_step,
    )
    for path in paths:
        print(_display_path(path))


if __name__ == "__main__":
    main()
