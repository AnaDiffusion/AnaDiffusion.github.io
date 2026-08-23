# Editing Panel and Figure Border Design

## Goal

Remove the duplicated quantitative table and the “(b) Example localized part replacement” heading from the displayed editing figure while preserving the localized replacement comparison exactly. Make Figure 3 use the same skinny purple figure border as the other paper figures.

## Selected approach

Use the existing `images/editing-comparison.png` asset. It already contains only the Segm. cLDM and AnaDiff (Ours) comparison panels, without the Figure 4a table or Figure 4b heading. No scientific image pixels will be generated, inpainted, or reconstructed.

## Page changes

- Change the editing figure image source from `images/figure-4-editing.png` to `images/editing-comparison.png`.
- Change the full-resolution link to the same panel-only asset.
- Use the asset's intrinsic dimensions of 2200 × 1096 in the image markup.
- Update the image alternative text and visible caption to describe only the localized part-replacement comparison.
- Keep the readable quantitative editing table below the figure unchanged.
- Remove the `paper-figure-dark` class from Figure 3 so it inherits the shared 1-pixel purple border, white background, radius, and shadow from `.figure-link`.
- Do not modify the Figure 3 scientific image asset.

## Verification

Add static regression tests requiring the panel-only image and link in the editing section, rejecting the full composite asset there, confirming that the editing table remains present with all six rows, and requiring Figure 3 to omit the dark-frame class. Run the focused tests, then the complete Node test suite.
