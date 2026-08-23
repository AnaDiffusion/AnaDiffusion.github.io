# Square Volume Viewer Layout Design

## Goal

Make the interactive volume viewer fit its square four-panel content, improve the visibility of the inline **Assemble parts** text, move volume selection into a vertical side rail, and remove the redundant Slices/3D controls.

## Approved layout

Use a centered two-column layout on desktop:

- A 210-pixel control rail on the left contains the five volume buttons in a vertical stack.
- A square viewer on the right uses `aspect-ratio: 1`, fills its available column, and is capped at 820 pixels.
- The viewer status message sits directly below the square canvas and aligns with it.
- The existing four-panel multiplanar-plus-render display remains the only view mode.

At narrow widths, switch to one column. The five volume buttons become a compact wrapping grid above the square viewer, with full button labels preserved.

## Visual treatment

- Set the inline **Assemble parts** text in the viewer introduction to high-contrast white.
- Keep inactive buttons dark with light text.
- Keep the active gradient button, with an explicit dark text color that remains readable across the gradient.
- Retain the existing viewer background, border, radius, and shadow.

## Markup and behavior

- Keep the existing five `data-vol` buttons and their loading behavior.
- Remove the entire view-mode button group containing Slices and 3D.
- Add a small viewport wrapper so the canvas and status message form one grid column.
- Remove the unused `data-view` event-handler loop from the viewer module.
- Continue setting NiiVue to multiplanar mode during initialization so all four panels remain visible.
- Bump the viewer module query version so browsers receive the updated JavaScript.

## Accessibility and responsiveness

- Preserve the `Choose volume` group label and button semantics.
- Preserve visible keyboard focus behavior and readable full labels.
- Avoid fixed viewport heights; the square aspect ratio controls the canvas size.
- Keep the mobile viewer within the page width without horizontal scrolling.

## Verification

Add static regression tests before implementation that require:

- No `data-view` controls in the HTML or view-mode event loop in JavaScript.
- A viewport wrapper containing the viewer stage and status message.
- A square viewer rule and a two-column desktop shell.
- A vertical desktop button rail and responsive compact grid.
- Explicit readable colors for inline **Assemble parts** text and active buttons.
- An updated cache-busting version.

Run the focused tests first, then the complete Node test suite and JavaScript syntax check. Inspect the rendered page at desktop and mobile widths when a browser connection is available.
