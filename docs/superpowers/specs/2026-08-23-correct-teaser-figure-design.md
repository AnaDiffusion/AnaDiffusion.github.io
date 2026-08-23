# Correct Teaser Figure Design

## Goal

Use the user-supplied `images/teaser.png` as the webpage’s canonical Figure 1.

## Design

Point the Figure 1 image, full-resolution link, and accessibility metadata directly to `images/teaser.png`. Use its native 2800 by 1595 dimensions and describe the MedicalNet FID radar chart plus the SynthSeg effect-size comparison accurately. Preserve the existing caption because it remains consistent with the supplied figure.

The previous PDF-derived `images/figure-1-overview.png` remains in the project but is no longer referenced by the webpage.

## Verification

Pin the `teaser.png` SHA-256, require the direct image and link references, reject the obsolete Figure 1 reference, visually inspect the supplied asset, and run the complete test suite.
