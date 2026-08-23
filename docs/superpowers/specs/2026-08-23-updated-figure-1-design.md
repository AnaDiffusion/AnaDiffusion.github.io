# Updated Figure 1 Design

## Goal

Synchronize the webpage’s Figure 1 with the revised Figure 1 in the August 23, 2026 `paper.pdf`.

## Source and extraction

Figure 1 is a composite of multiple images, vector annotations, and chart elements on PDF page 2. Render page 2 at 300 DPI and crop only the published figure area, excluding its PDF caption and surrounding manuscript text. The resulting web asset is 1990 by 1110 pixels.

## Web integration

Replace `images/figure-1-overview.png` in place so existing links remain stable. Update the HTML intrinsic dimensions, describe the revised MedicalNet FID and SynthSeg radar charts in the alternative text, and add the revised caption sentence about regional and global anatomy across FID and SynthSeg-based metrics.

## Verification

Pin the August 23 PDF SHA-256 and the new Figure 1 SHA-256 in static tests. Verify the new dimensions and caption copy, render and inspect the final asset, then run the complete test suite.
