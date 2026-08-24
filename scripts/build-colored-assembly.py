#!/usr/bin/env python3
"""Build one RGB NIfTI strictly from the three regional sample volumes."""

import argparse
from pathlib import Path

import nibabel as nib
import numpy as np
from nibabel.processing import resample_from_to


ROOT = Path(__file__).resolve().parents[1]
VOLUME_DIR = ROOT / "volumes"
OUTPUT_PATH = VOLUME_DIR / "assembly-parts-sample-01.nii.gz"
REFERENCE_PATH = VOLUME_DIR / "assembled-whole-01.nii.gz"
DISPLAY_MIN = -1.0
DISPLAY_MAX = 1.0

PARTS = (
    (
        "lhemi-sample-01.nii.gz",
        np.array([170, 140, 224], dtype=np.float32),
        np.array([-78.0, 0.0, 0.0]),
    ),
    (
        "rhemi-sample-01.nii.gz",
        np.array([150, 199, 132], dtype=np.float32),
        np.array([-13.5, 0.0, 0.0]),
    ),
    (
        "cb-sample-01.nii.gz",
        np.array([240, 205, 120], dtype=np.float32),
        np.array([0.0, -9.5, 16.0]),
    ),
)


def load_on_grid(
    path: Path,
    reference: nib.Nifti1Image,
    world_offset: np.ndarray,
) -> np.ndarray:
    image = nib.load(path)
    placement_affine = reference.affine.copy()
    placement_affine[:3, 3] += world_offset
    placed = nib.Nifti1Image(
        np.asanyarray(image.dataobj),
        placement_affine,
        image.header.copy(),
    )
    placed.set_sform(placement_affine, code=2)
    placed.set_qform(placement_affine, code=0)
    aligned = resample_from_to(placed, reference, order=0)
    return np.asarray(aligned.dataobj, dtype=np.float32)


def build_assembly(
    reference_path: Path = REFERENCE_PATH,
    display_min: float = DISPLAY_MIN,
    display_max: float = DISPLAY_MAX,
    mask_threshold: float = 0.0,
) -> nib.Nifti1Image:
    if display_max <= display_min:
        raise ValueError("display_max must be greater than display_min")

    # Use the reference image only as the shared world-coordinate grid. Its
    # voxel values are never read or included in the colored assembly.
    reference_image = nib.load(reference_path)
    part_values = [
        load_on_grid(VOLUME_DIR / name, reference_image, world_offset)
        for name, _, world_offset in PARTS
    ]
    part_masks = np.stack([values > mask_threshold for values in part_values])

    target_mask = np.any(part_masks, axis=0)
    labels = np.argmax(part_masks, axis=0).astype(np.uint8)

    intensity = np.zeros(reference_image.shape, dtype=np.float32)
    for index, values in enumerate(part_values):
        use_part = target_mask & (labels == index)
        intensity[use_part] = values[use_part]

    rgb_dtype = np.dtype([("R", "u1"), ("G", "u1"), ("B", "u1")])
    rgb = np.zeros(reference_image.shape, dtype=rgb_dtype)
    for index, (_, color, _) in enumerate(PARTS):
        region = target_mask & (labels == index)
        normalized = np.clip(
            (intensity[region] - display_min) / (display_max - display_min),
            0.0,
            1.0,
        )
        scaled = np.rint(normalized[:, None] * color[None, :]).astype(np.uint8)
        rgb["R"][region] = scaled[:, 0]
        rgb["G"][region] = scaled[:, 1]
        rgb["B"][region] = scaled[:, 2]

    output = nib.Nifti1Image(rgb, reference_image.affine)
    output.header.set_xyzt_units(*reference_image.header.get_xyzt_units())
    output.set_qform(reference_image.get_qform(), int(reference_image.header["qform_code"]))
    output.set_sform(reference_image.get_sform(), int(reference_image.header["sform_code"]))
    return output


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reference", default=REFERENCE_PATH.name)
    parser.add_argument("--output", default=OUTPUT_PATH.name)
    parser.add_argument("--display-min", type=float, default=DISPLAY_MIN)
    parser.add_argument("--display-max", type=float, default=DISPLAY_MAX)
    parser.add_argument("--mask-threshold", type=float, default=0.0)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    output_path = VOLUME_DIR / args.output
    nib.save(
        build_assembly(
            reference_path=VOLUME_DIR / args.reference,
            display_min=args.display_min,
            display_max=args.display_max,
            mask_threshold=args.mask_threshold,
        ),
        output_path,
    )
    print(output_path)
