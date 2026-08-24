import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import unittest

import nibabel as nib
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
RENDERER_PATH = ROOT / "scripts" / "render-assembly-animation.py"
VOLUME_DIR = ROOT / "volumes"


def load_renderer():
    spec = importlib.util.spec_from_file_location("assembly_animation_renderer", RENDERER_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class RendererPresenceTests(unittest.TestCase):
    def test_renderer_exists(self):
        self.assertTrue(RENDERER_PATH.exists(), "animation renderer is missing")


@unittest.skipUnless(RENDERER_PATH.exists(), "animation renderer is missing")
class AnimationStateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.renderer = load_renderer()

    def test_stage_schedule_matches_the_approved_timeline(self):
        state = self.renderer.stage_state
        self.assertEqual(state(0.0), {"left": 0.0, "right": 0.0, "cb": 0.0})
        self.assertEqual(state(1.0)["left"], 1.0)
        self.assertEqual(state(1.0)["right"], 0.0)
        self.assertEqual(state(4.0)["right"], 1.0)
        self.assertEqual(state(4.0)["cb"], 0.0)
        self.assertEqual(state(6.0), {"left": 1.0, "right": 1.0, "cb": 1.0})
        self.assertEqual(state(8.0), {"left": 1.0, "right": 1.0, "cb": 1.0})
        self.assertEqual(state(12.0), {"left": 1.0, "right": 1.0, "cb": 1.0})
        self.assertEqual(state(16.0), {"left": 0.0, "right": 0.0, "cb": 0.0})

    def test_camera_returns_to_its_starting_angle(self):
        self.assertEqual(
            self.renderer.camera_angles(0.0),
            self.renderer.camera_angles(16.0),
        )

    def test_complete_assembly_turns_a_full_360_degrees(self):
        _, starting_azimuth = self.renderer.camera_angles(5.2)
        _, ending_azimuth = self.renderer.camera_angles(15.2)
        self.assertAlmostEqual(ending_azimuth - starting_azimuth, 360.0)

    def test_camera_briefly_reveals_inferior_surface_then_returns(self):
        expected_elevations = {
            5.2: 45.0,
            10.2: -15.0,
            15.2: 45.0,
        }
        for time_s, expected in expected_elevations.items():
            elevation, _ = self.renderer.camera_angles(time_s)
            self.assertAlmostEqual(elevation, expected)

        for time_s in (7.7, 12.7):
            elevation, _ = self.renderer.camera_angles(time_s)
            self.assertGreater(elevation, 40.0)

    def test_anatomical_surfaces_use_the_approved_translucency(self):
        opacity = getattr(self.renderer, "PART_OPACITY", 1.0)
        self.assertAlmostEqual(opacity, 0.50)

    def test_output_uses_the_approved_playback_rate(self):
        self.assertAlmostEqual(getattr(self.renderer, "PLAYBACK_RATE", 1.0), 1.25)
        self.assertEqual(getattr(self.renderer, "OUTPUT_FPS", self.renderer.FPS), 30)


@unittest.skipUnless(RENDERER_PATH.exists(), "animation renderer is missing")
class AnatomicalMaskTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.renderer = load_renderer()
        cls.masks, cls.affine = cls.renderer.load_part_masks()

    def test_masks_share_the_final_canvas_geometry(self):
        reference = nib.load(VOLUME_DIR / "assembly-parts-sample-01.nii.gz")
        self.assertEqual(set(self.masks), {"left", "right", "cb"})
        self.assertTrue(np.array_equal(self.affine, reference.affine))
        for mask in self.masks.values():
            self.assertEqual(mask.shape, (128, 128, 128))
            self.assertGreater(np.count_nonzero(mask), 0)

    def test_masks_are_pairwise_disjoint(self):
        left = self.masks["left"]
        right = self.masks["right"]
        cb = self.masks["cb"]
        self.assertFalse(np.any(left & right))
        self.assertFalse(np.any(left & cb))
        self.assertFalse(np.any(right & cb))


@unittest.skipUnless(RENDERER_PATH.exists(), "animation renderer is missing")
class FrameRenderTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.renderer_module = load_renderer()
        masks, affine = cls.renderer_module.load_part_masks()
        cls.renderer = cls.renderer_module.AssemblyRenderer(
            masks,
            affine,
            width=320,
            height=180,
            mesh_step=6,
        )

    @classmethod
    def tearDownClass(cls):
        cls.renderer.close()

    def test_rendered_frame_has_exact_dimensions_and_visible_anatomy(self):
        frame = self.renderer.render_frame(1.0)
        self.assertIsInstance(frame, Image.Image)
        self.assertEqual(frame.mode, "RGB")
        self.assertEqual(frame.size, (320, 180))

        pixels = np.asarray(frame)
        background = np.array(self.renderer_module.BACKGROUND_RGB, dtype=np.uint8)
        self.assertGreater(np.count_nonzero(np.any(pixels != background, axis=-1)), 500)

    def test_all_anatomical_faces_share_one_depth_sorted_collection(self):
        self.assertEqual(
            len(self.renderer.axes.collections),
            1,
            "separate part collections impose a fixed inter-part paint order",
        )


class MediaOutputTests(unittest.TestCase):
    def test_expected_media_files_exist(self):
        for filename in (
            "anadiffusion-assembly.mp4",
            "anadiffusion-assembly.webm",
            "anadiffusion-assembly-poster.png",
        ):
            self.assertTrue((ROOT / "media" / filename).is_file(), filename)

    def test_poster_is_exactly_1280_by_720(self):
        poster_path = ROOT / "media" / "anadiffusion-assembly-poster.png"
        with Image.open(poster_path) as poster:
            self.assertEqual(poster.mode, "RGB")
            self.assertEqual(poster.size, (1280, 720))

    @unittest.skipUnless(shutil.which("ffprobe"), "ffprobe is required")
    def test_videos_are_silent_1_25x_720p_loops(self):
        for filename in ("anadiffusion-assembly.mp4", "anadiffusion-assembly.webm"):
            path = ROOT / "media" / filename
            result = subprocess.run(
                [
                    "ffprobe",
                    "-v",
                    "error",
                    "-show_entries",
                    "format=duration:stream=codec_type,width,height,r_frame_rate",
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
            self.assertEqual(video_streams[0]["width"], 1280)
            self.assertEqual(video_streams[0]["height"], 720)
            self.assertEqual(video_streams[0]["r_frame_rate"], "30/1")
            self.assertAlmostEqual(float(probe["format"]["duration"]), 12.8, places=2)


if __name__ == "__main__":
    unittest.main()
