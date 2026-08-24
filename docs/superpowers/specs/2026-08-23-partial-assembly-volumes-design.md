# Partial Assembly Volumes Design

## Goal

Generate two additional colored assembly NIfTI assets from the updated regional volumes without changing the webpage:

- `volumes/assembly-left-sample-01.nii.gz`: the left hemisphere alone, placed in the final whole-volume canvas.
- `volumes/assembly-hemispheres-sample-01.nii.gz`: the left and right hemispheres together, placed in that same canvas.

The existing full three-part assembly remains unchanged.

## Selected approach

Extend `scripts/build-colored-assembly.py` with an explicit part-selection interface and use that interface to generate both assets. This keeps the geometry, masking, intensity mapping, and color logic in one reproducible implementation.

One-off generation commands were rejected because they would make the new files difficult to reproduce. Scalar outputs were rejected because these are assembly previews and should retain the established anatomical palette.

## Data and appearance

Both outputs use `volumes/assembled-whole-01.nii.gz` only as the final 128 × 128 × 128 world-coordinate canvas. Its voxel values are not copied into either assembly.

The regional source data and appearance are:

- Left hemisphere: `lhemi-sample-01.nii.gz`, lavender `[170, 140, 224]`, corrected world offset `[-78.0, 0.0, 0.0]` mm.
- Right hemisphere: `rhemi-sample-01.nii.gz`, green `[150, 199, 132]`, corrected world offset `[-13.5, 0.0, 0.0]` mm.

Only voxels above the existing `0.0` anatomy threshold are included. Their brightness is normalized with the established `[-1, 1]` display range before applying the regional color. Background voxels remain black.

The outputs are NIfTI RGB24 volumes with the final canvas affine, qform, sform, units, and dimensions. The cerebellum–brainstem is absent from both files.

## Generator interface

`build_assembly` will accept a part-name selection while retaining all three parts as its default. The command-line interface will expose the same selection as a comma-separated `--parts` value, using the identifiers `left`, `right`, and `cb`.

The generator must reject an empty selection or an unknown part name with a clear error. Existing no-argument behavior must continue rebuilding `assembly-parts-sample-01.nii.gz` with all three parts.

## Verification

Automated checks will establish that:

- Both new files exist and are valid 128 × 128 × 128 RGB24 NIfTIs.
- Both inherit the exact final-canvas affine.
- The left-only file equals a left-only generator result and contains lavender anatomy only.
- The hemisphere file equals a left-plus-right generator result and contains both lavender and green anatomy.
- Neither file contains the butter cerebellum–brainstem region.
- The existing full assembly still reproduces exactly from the default generator call.
- The webpage source is unchanged by this task.

## Non-goals

- Do not add buttons or load paths for these files to the interactive viewer.
- Do not replace or modify `assembly-parts-sample-01.nii.gz`.
- Do not include voxel data from the whole-brain or assembled-whole reference volumes.
- Do not commit or push the generated assets unless separately requested.
