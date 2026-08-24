# Abstract Assembly Background Design

## Goal

Use the approved transparent continuous assembly animation as a subtle background for the Abstract section. The motion should reinforce AnaDiffusion's part-to-whole idea without competing with the heading, TL;DR, introductory paragraph, or four contribution bullets.

## Approved direction

Place `media/anadiffusion-assembly-transparent-continuous.webm` inside the Abstract section as a decorative background layer. Keep the existing Abstract content, typography, reading width, and single-column contribution list unchanged.

Two alternatives were rejected:

- A standalone animation panel below the method figure would make the asset easier to inspect, but it would separate the motion from the introductory explanation it illustrates.
- A fully opaque or foreground video would make the assembly more prominent, but it would reduce text legibility and distract from the paper's contribution summary.

## Structure and visual treatment

Add one non-interactive media wrapper as the first child of the Abstract section, before the existing reading shell. The wrapper and video sit behind all Abstract content through an isolated stacking context. The video must not affect section height, reading width, or document flow.

- Center the animation within the section and bias it slightly toward the right so the brain remains visible without sitting directly beneath every line of copy.
- Use 10% video opacity on desktop and 7% on screens at or below the existing mobile breakpoint.
- Preserve the WebM's transparent background and anatomical colors. Do not add a dark rectangle, border, controls, caption, or text.
- Disable pointer interaction so selection, scrolling, and links behave exactly as they do now.
- Keep the existing TL;DR card and content above the animation at full opacity. Its translucent white surface provides additional local contrast.
- Retain the Abstract section's existing pale background and decorative radial glow.

The background is decorative rather than explanatory. The method figure, interactive viewer, and downloadable media remain the authoritative ways to inspect the anatomy in detail.

## Playback and accessibility

The video is muted, looped, inline, and omitted from the accessibility tree. It has no controls and cannot receive focus.

Do not use the HTML `autoplay` attribute. A small initializer in the existing site script controls playback:

- If the user prefers reduced motion, leave the animation paused and display the existing transparent poster as the static fallback.
- Otherwise, use `IntersectionObserver` to play while the Abstract section is visible and pause when it leaves the viewport.
- If `IntersectionObserver` is unavailable, attempt playback once and retain the poster if the browser rejects it.
- Ignore the resolved play promise and handle rejection without surfacing an error or changing the surrounding page.

Use `media/anadiffusion-assembly-transparent-poster.png` as the poster. Browsers that cannot decode VP9 alpha therefore retain a quiet static image rather than showing an empty or broken media area.

## Responsive behavior

On desktop, keep the video large enough to read as a brain assembly but contained within the Abstract section. On mobile, allow the media to extend beyond the section's horizontal bounds, shift it farther to the right, and lower opacity to 7%. This maintains a visible anatomical texture while prioritizing the narrower text column.

The layer must be clipped by the Abstract section at every viewport size. It must not create horizontal scrolling, alter the existing single-column bullets, or cover content from adjacent sections.

## Verification

Automated checks must prove that:

- the Abstract section references the approved continuous WebM and transparent poster;
- the media is decorative, muted, looped, inline, non-focusable, and has no controls or HTML autoplay;
- the background wrapper is absolutely positioned, clipped, non-interactive, and below the reading shell;
- desktop and mobile opacity values are 10% and 7%, respectively;
- the site script respects reduced motion and uses visibility-based play and pause behavior;
- the existing Abstract copy and four contribution bullets remain unchanged.

Browser QA must inspect the section at representative desktop and mobile widths. Text must remain immediately legible, the animation must not introduce a rectangular background, the page must not gain horizontal overflow, and playback must pause outside the section.

## Non-goals

- Do not edit or regenerate any animation, poster, NIfTI volume, figure, or interactive-viewer asset.
- Do not change Abstract wording, typography, spacing, or bullet layout.
- Do not add animation controls, labels, audio, or a separate media panel.
- Do not change other page sections.
- Do not modify or commit the user's `.gitignore` changes.
- Do not push unless separately requested.
