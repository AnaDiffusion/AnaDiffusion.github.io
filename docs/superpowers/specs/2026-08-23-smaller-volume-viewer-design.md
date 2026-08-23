# Smaller volume viewer design

## Goal

Reduce the apparent upscaling of the generated-volume preview while preserving its square four-panel layout and the vertical control rail.

## Design

- Reduce the desktop viewer column from 820px to 720px.
- Keep the control rail at 210px and the gap at 24px.
- Keep the viewer stage at a 1:1 aspect ratio so NiiVue receives a square viewport.
- Retain the existing single-column mobile layout, where the viewer remains fluid-width.
- Do not change volume data, rendering code, controls, or interaction behavior.

## Verification

- A static regression test requires the `210px + 720px` desktop grid.
- Existing tests continue to require a square stage, vertical controls, and responsive mobile behavior.
- Run the complete Node test suite after the CSS change.
