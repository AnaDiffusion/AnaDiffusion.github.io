#!/usr/bin/env python3
"""Build one RGB NIfTI strictly from the three regional sample volumes."""

from pathlib import Path

import nibabel as nib
import numpy as np
from nibabel.processing import resample_from_to


ROOT = Path(__file__).resolve().parents[1]
VOLUME_DIR = ROOT / "volumes"
OUTPUT_PATH = VOLUME_DIR / "assembly-parts-sample-01.nii.gz"

PARTS = (
    ("lhemi-sample-01.nii.gz", np.array([170, 140, 224], dtype=np.float32)),
    ("rhemi-sample-01.nii.gz", np.array([150, 199, 132], dtype=np.float32)),
    ("cb-sample-01.nii.gz", np.array([240, 205, 120], dtype=np.float32)),
)


def load_on_grid(path: Path, reference: nib.Nifti1Image) -> np.ndarray:
    image = nib.load(path)
    aligned = resample_from_to(image, reference, order=0)
    return np.asarray(aligned.dataobj, dtype=np.float32)


def build_assembly() -> nib.Nifti1Image:
    # Use the whole image only as the shared world-coordinate grid. Its voxel
    # values are never read or included in the colored assembly.
    whole_image = nib.load(VOLUME_DIR / "whole-sample-01.nii.gz")
    part_values = [load_on_grid(VOLUME_DIR / name, whole_image) for name, _ in PARTS]
    part_masks = np.stack([values > 0 for values in part_values])

    target_mask = np.any(part_masks, axis=0)
    labels = np.argmax(part_masks, axis=0).astype(np.uint8)

    intensity = np.zeros(whole_image.shape, dtype=np.float32)
    for index, values in enumerate(part_values):
        use_part = target_mask & (labels == index)
        intensity[use_part] = values[use_part]

    rgb_dtype = np.dtype([("R", "u1"), ("G", "u1"), ("B", "u1")])
    rgb = np.zeros(whole_image.shape, dtype=rgb_dtype)
    for index, (_, color) in enumerate(PARTS):
        region = target_mask & (labels == index)
        scaled = np.rint(intensity[region, None] * color[None, :] / 255.0).astype(np.uint8)
        rgb["R"][region] = scaled[:, 0]
        rgb["G"][region] = scaled[:, 1]
        rgb["B"][region] = scaled[:, 2]

    output = nib.Nifti1Image(rgb, whole_image.affine)
    output.header.set_xyzt_units(*whole_image.header.get_xyzt_units())
    output.set_qform(whole_image.get_qform(), int(whole_image.header["qform_code"]))
    output.set_sform(whole_image.get_sform(), int(whole_image.header["sform_code"]))
    return output


if __name__ == "__main__":
    nib.save(build_assembly(), OUTPUT_PATH)
    print(OUTPUT_PATH)
