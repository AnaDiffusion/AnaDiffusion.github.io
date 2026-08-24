# AnaDiffusion Favicon Design

## Goal

Replace the unrelated PHAI favicon with a compact AnaDiffusion identity mark consistent with the project-page palette and the supplied visual reference.

## Approved Design

- Use a transparent square canvas with a softly rounded white rim.
- Fill the inner rounded square with a smooth four-way spectrum: pale lavender at the upper left, stronger lavender at the lower left, butter gold at the upper right, and cream green at the lower right.
- Keep the mark text-free so it remains legible at browser-tab sizes.
- Create an SVG master for sharp browser rendering and replace `images/favicon.png` with a 256 × 256 PNG fallback derived from the same master.
- Reference both assets from `index.html` with a cache key so browsers do not retain the old PHAI icon.

## Constraints

- Preserve transparency outside the rounded square.
- Do not include the PHAI name, letters, or blue brand color.
- Do not change the visible page header logo or any other page imagery.

## Verification

- Confirm the SVG and PNG assets exist, are square, and contain no `PHAI` text.
- Confirm the HTML declares the SVG favicon and PNG fallback with the new cache key.
- Render and inspect the PNG at full size and a 32 × 32 browser-tab preview.
- Run the complete frontend test suite, commit the change, and push `main` to the configured origin.
