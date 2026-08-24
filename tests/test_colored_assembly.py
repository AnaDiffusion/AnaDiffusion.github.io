import importlib.util
from pathlib import Path
import unittest

import nibabel as nib
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
VOLUME_DIR = ROOT / "volumes"
BUILDER_PATH = ROOT / "scripts" / "build-colored-assembly.py"

SPEC = importlib.util.spec_from_file_location("colored_assembly_builder", BUILDER_PATH)
builder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)


def rgb(image: nib.Nifti1Image) -> np.ndarray:
    data = np.asanyarray(image.dataobj)
    return np.stack([data["R"], data["G"], data["B"]], axis=-1)


def foreground(image: nib.Nifti1Image) -> np.ndarray:
    return np.any(rgb(image) > 0, axis=-1)


class PartSelectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.left = builder.build_assembly(part_names=("left",))
        cls.right = builder.build_assembly(part_names=("right",))
        cls.cb = builder.build_assembly(part_names=("cb",))
        cls.hemispheres = builder.build_assembly(part_names=("left", "right"))

    def test_selected_parts_share_the_final_canvas(self):
        self.assertEqual(self.left.shape, (128, 128, 128))
        self.assertEqual(self.hemispheres.shape, self.left.shape)
        self.assertTrue(np.array_equal(self.hemispheres.affine, self.left.affine))

    def test_left_only_contains_lavender_anatomy(self):
        left_values = rgb(self.left)[foreground(self.left)]
        self.assertGreater(left_values.size, 0)
        mean_channels = left_values.mean(axis=0)
        self.assertGreater(mean_channels[2], mean_channels[0])
        self.assertGreater(mean_channels[0], mean_channels[1])

    def test_hemisphere_assembly_contains_left_and_right_without_cb(self):
        left_mask = foreground(self.left)
        right_mask = foreground(self.right)
        cb_mask = foreground(self.cb)
        hemisphere_values = rgb(self.hemispheres)

        left_exclusive = left_mask & ~right_mask
        right_exclusive = right_mask & ~left_mask
        cb_exclusive = cb_mask & ~(left_mask | right_mask)

        self.assertGreater(np.count_nonzero(left_exclusive), 0)
        self.assertGreater(np.count_nonzero(right_exclusive), 0)
        self.assertGreater(np.count_nonzero(cb_exclusive), 0)
        self.assertTrue(np.array_equal(hemisphere_values[left_exclusive], rgb(self.left)[left_exclusive]))
        self.assertTrue(np.array_equal(hemisphere_values[right_exclusive], rgb(self.right)[right_exclusive]))
        self.assertTrue(np.all(hemisphere_values[cb_exclusive] == 0))

    def test_rejects_an_empty_selection(self):
        with self.assertRaisesRegex(ValueError, "at least one part"):
            builder.build_assembly(part_names=())

    def test_rejects_an_unknown_part(self):
        with self.assertRaisesRegex(ValueError, "unknown part"):
            builder.build_assembly(part_names=("unknown",))


class PartialAssemblyArtifactTests(unittest.TestCase):
    def assert_matches_generated_assembly(self, filename, part_names):
        path = VOLUME_DIR / filename
        self.assertTrue(path.exists(), f"missing generated assembly: {filename}")

        actual = nib.load(path)
        expected = builder.build_assembly(part_names=part_names)
        self.assertEqual(actual.shape, (128, 128, 128))
        self.assertEqual(int(actual.header["datatype"]), 128)
        self.assertEqual(int(actual.header["bitpix"]), 24)
        self.assertTrue(np.array_equal(actual.affine, expected.affine))
        self.assertTrue(np.array_equal(rgb(actual), rgb(expected)))

    def test_left_only_artifact_matches_the_generator(self):
        self.assert_matches_generated_assembly(
            "assembly-left-sample-01.nii.gz",
            ("left",),
        )

    def test_hemisphere_artifact_matches_the_generator(self):
        self.assert_matches_generated_assembly(
            "assembly-hemispheres-sample-01.nii.gz",
            ("left", "right"),
        )


if __name__ == "__main__":
    unittest.main()
