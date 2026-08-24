# Abstract Kicker Accent Design

## Goal

Give the centered Abstract kicker the same short spectrum bar used beneath the Method and other light-section kickers.

## Design

- Keep the existing Abstract markup and centered heading layout unchanged.
- Add a narrowly scoped `.abstract-section .section-kicker::after` rule.
- Match the established section-heading accent exactly: `48px` wide, `3px` high, `14px` top spacing, centered with automatic inline margins, rounded corners, and `var(--grad)`.
- Do not broaden the shared selector or add `section-heading` to the Abstract reading shell, because either choice would affect unrelated spacing or text alignment.
- Apply identically at desktop and mobile widths.

## Verification

- Add a static regression assertion for the scoped accent rule and its dimensions, centering, and gradient.
- Bump the stylesheet cache key so localhost and GitHub Pages load the updated CSS.
- Run the complete frontend test suite and verify the served stylesheet.
