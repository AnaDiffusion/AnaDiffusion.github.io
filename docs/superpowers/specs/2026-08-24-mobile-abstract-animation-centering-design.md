# Mobile Abstract Animation Centering Design

## Goal

Keep the transparent assembly animation visually centered on narrow screens without changing its desktop placement, opacity, vertical offset, playback, or media asset.

## Root cause

The mobile rule renders the video at `165vw` inside a grid-centered overlay. Because that grid item is wider than its containing block, the generated grid track can overflow from the inline start edge rather than positioning the oversized item symmetrically around the viewport center. The WebM itself is 1280×720 and its nontransparent brain content stays close to the media-frame center, so the asset does not need to be regenerated.

## Chosen approach

On screens up to 720px, take the video out of grid layout and center its oversized frame explicitly:

```css
.abstract-motion video {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 165vw;
  opacity: .3;
  transform: translate(-50%, calc(-50% + 120px));
}
```

The two `-50%` translations center the video around the overlay midpoint; the existing `120px` downward offset is retained. The desktop rule remains unchanged.

## Alternatives considered

- Re-encode or crop the WebM: unnecessary because the visible alpha bounds are already centered within the 1280px frame.
- Apply an arbitrary `translateX()` correction while keeping the video in grid flow: fragile across viewport widths because it compensates for a layout symptom rather than anchoring to the viewport center.
- Reduce the mobile video width: would alter the intended background scale and coverage.

## Verification

- Add a static regression assertion for absolute 50%/50% mobile anchoring and the combined centering/vertical transform.
- Confirm the regression assertion fails before the CSS change and passes afterward.
- Run the full static test suite and `git diff --check`.
- Confirm the stylesheet cache key is advanced so browsers receive the fix.
