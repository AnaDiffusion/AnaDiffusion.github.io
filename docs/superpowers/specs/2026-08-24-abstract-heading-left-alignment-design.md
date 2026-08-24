# Abstract Heading Left Alignment Design

## Goal

Align the Abstract heading group with the reading-heavy body content beneath it.

## Approved Design

- Left-align the `Abstract` kicker, its mini spectrum bar, and the section title as one visual group.
- Keep the heading group on the existing reading-column edge; do not change its width, type scale, or vertical spacing.
- Keep the mini bar at `48px × 3px` with the existing lavender–gold–green gradient, but replace its automatic horizontal margins with a zero left margin.
- Leave the TL;DR card, lead paragraph, contribution bullets, background animation, and responsive behavior unchanged.

## Verification

- Add a regression assertion for left-aligned Abstract kicker/title and the bar's left margin.
- Bump the stylesheet cache key.
- Run the complete frontend test suite and verify the served CSS on localhost.
