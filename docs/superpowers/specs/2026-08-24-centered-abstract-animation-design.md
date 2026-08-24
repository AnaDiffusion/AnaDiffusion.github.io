# Centered Abstract Animation Design

## Goal

Make the existing Abstract background animation visibly centered and easier to see without changing its content, playback behavior, or relationship to the text.

## Approved direction

Center `media/anadiffusion-assembly-transparent-continuous.webm` within the Abstract section at every viewport size and render it at 30% opacity.

Two alternatives were rejected:

- Reducing opacity on mobile would preserve more contrast, but it would not follow the requested consistent 30% treatment.
- Adding a separate text-protection gradient would improve contrast in selected areas, but it would introduce another visual layer and is unnecessary unless the centered animation proves distracting.

## Visual behavior

- Remove the desktop `translateX(18%)` offset and mobile `translateX(28%)` offset.
- Use `transform: translateX(0)` for both desktop and mobile rules.
- Use `opacity: .3` for both desktop and mobile rules.
- Preserve the existing desktop and mobile media widths so this change affects only alignment and visibility.
- Preserve clipping, stacking, transparent media, poster fallback, non-interactivity, and the existing Abstract content.

## Verification

Automated checks must enforce centered positioning and 30% opacity in both the base rule and the existing `720px` mobile media query. The complete frontend suite must continue to pass, and localhost must serve the updated cache-busted stylesheet.

## Non-goals

- Do not edit or regenerate the video or poster.
- Do not alter Abstract copy, typography, spacing, or bullet layout.
- Do not change playback, reduced-motion handling, or any other section.
- Do not modify or commit the user's `.gitignore` changes.
- Do not push unless separately requested.
