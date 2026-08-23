# Future Heading Font Design

## Goal

Make “Where AnaDiffusion goes next.” use the same editorial serif treatment as the page’s other primary section headings.

## Design

Extend the existing shared heading selector with `.future-section h2`. This reuses the established `var(--serif)` family, responsive size, weight, tracking, and line height without adding duplicate declarations or changing the HTML structure.

## Verification

Add a static regression assertion that the shared selector includes `.future-section h2`, then run the complete test suite.
