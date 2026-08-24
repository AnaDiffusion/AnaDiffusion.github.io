# Abstract Heading and Background Position Design

## Goal

Align the Abstract section's kicker and title with the centered presentation used by the page's other feature-section headings, and move the existing brain animation farther behind the contribution bullets.

## Approved direction

Center only the `Abstract` kicker and `From monolithic volumes to compositional anatomy.` title. Keep the TL;DR card, lead paragraph, and four contribution bullets left-aligned for reading.

Move the transparent brain animation down by exactly **120 pixels** on desktop and mobile. Retain its centered horizontal alignment and 30% opacity.

Two other vertical offsets were considered:

- `80px` would be subtler but would leave too much of the brain behind the lead paragraph rather than the bullets.
- `160px` would emphasize the lower bullets more strongly but risks pushing the anatomy too far below the first contribution on shorter viewports.

The `120px` offset is the balanced choice: it clearly shifts the visual emphasis into the contribution list without changing section height or media size.

## Visual behavior

- Apply centered text alignment to the Abstract kicker and title only.
- Preserve the title's `760px` maximum width and center that block with automatic inline margins.
- Change the animation transform from `translateX(0)` to `translateY(120px)` in both the base and mobile rules.
- Preserve desktop width `min(1100px, 78vw)`, mobile width `165vw`, and opacity `.3`.
- Preserve the current transparent media, clipping, stacking, pointer behavior, playback, poster, and reduced-motion behavior.

## Verification

Automated checks must enforce centered kicker/title alignment, automatic title margins, the exact `120px` vertical translation at desktop and mobile sizes, 30% opacity, and a new stylesheet cache key. The complete frontend suite must continue to pass, and localhost must serve the new CSS.

## Non-goals

- Do not center the TL;DR copy, lead paragraph, or bullet text.
- Do not change the animation size, opacity, media asset, or playback behavior.
- Do not modify any other page section.
- Do not modify or commit the user's `.gitignore` changes.
- Do not push unless separately requested.
