# Responsive typography design

## Goal

Make the project page more readable without sacrificing screen fit on desktop or mobile, with particular emphasis on the animated AnaDiffusion title.

## Typography system

- Replace the fixed 19px body size and 18px mobile override with `clamp(19px, calc(17px + 0.25vw), 21px)`.
- Tighten the root line height from 1.70 to 1.65. This offsets the larger type so paragraph blocks retain nearly the same vertical footprint.
- Let existing `rem`-based headings, captions, buttons, cards, tables, and navigation inherit the fluid root scale instead of adding component-specific overrides.
- Replace the animated title's desktop clamp and narrow-screen fixed override with `min(13.5vw, 128px)`. The title grows to 128px on large screens and scales down continuously on smaller screens so the wordmark remains within the viewport.
- Preserve the animated title markup, keyframes, spacing, font family, and color treatment.

## Responsive behavior

- Phones use a 19px body base and a viewport-fitted title.
- Typical laptops render body text around 20px and a larger title.
- Large desktops cap body text at 21px and the title at 128px.
- Existing content widths and responsive breakpoints remain unchanged, preventing larger text from creating overly long lines.

## Verification

- Static regression tests require the new body clamp, 1.65 line height, and viewport-fitted title size.
- Tests reject the obsolete 18px mobile body and 3.2rem narrow-screen title overrides.
- The complete Node test suite must pass after the CSS change.
