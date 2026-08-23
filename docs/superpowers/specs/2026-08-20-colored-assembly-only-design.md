# Colored Assembly Only Design

## Goal

Keep the interactive volume viewer focused on one colored anatomical assembly made only from the three supplied regional parts, with NiiVue's crosshair/orientation overlays and runtime volume overlays removed.

## Selected approach

Configure NiiVue itself to hide viewer chrome (`crosshairWidth: 0`, `show3Dcrosshair: false`, and `isOrientationTextVisible: false`). Precompose the left hemisphere, right hemisphere, and cerebellum-brainstem files into a single RGB NIfTI asset, then load that one asset when the user selects **Assemble parts**.

Two alternatives were rejected:

- Covering the guides with CSS would not work reliably because they are drawn inside the WebGL canvas.
- Replacing NiiVue with a custom renderer would add substantial code and risk for a configuration-level change.

## Viewer behavior

- Individual whole-brain and part buttons continue loading their existing grayscale volumes.
- The assembled view loads one RGB volume with lavender left-hemisphere, green right-hemisphere, and butter cerebellum-brainstem regions.
- Regional files retain their original intensity wherever they contain signal. Voxels absent from all three regional files remain empty; no whole-brain-derived filler is added.
- The whole-brain voxel data is not included in the RGB asset or loaded into NiiVue, and the assembled view has no NiiVue overlay volumes.
- Crosshair lines and anatomical orientation letters are not drawn in slice or 3D modes.
- Colorbars remain disabled, and the existing status message and controls remain unchanged.

## Verification

Add static regression tests that confirm the hidden-overlay options, the single RGB assembly load, and the absence of whole-brain filler from the assembly builder. Run the complete Node test suite, then serve the page locally and inspect the assembled viewer in the browser.
