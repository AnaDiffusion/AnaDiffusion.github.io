# Page Polish and Limitations Design

## Goal

Improve footer-logo visibility, restore all four paper-grounded limitations, reduce sample-image enlargement, and remove the obsolete Figure 1 overview note.

## Selected design

### Footer logos

Preserve the source logo files. Display the PHAI logo in its original blue-and-white colors at full opacity. Render the dark Texas A&M mark as white with a CSS filter, increase its maximum width to 160 pixels, and keep both marks aligned without adding a light container that would compete with the footer.

### Limitations

Replace the two compressed entries with four separate limitations faithful to the supplied paper text:

1. Multi-stage complexity compared with a monolithic LDM.
2. Incomplete broader tissue-level calibration despite improved local part and seam behavior.
3. A predefined regional decomposition that may miss tissue classes, functional networks, and multi-scale anatomical hierarchies.
4. Approximate MNI152 correspondence and lack of validation for severe mass effect or displaced boundaries, motivating lesion-aware or subject-adaptive localization.

### Sample gallery

Reduce desktop sample cards from a 920-pixel cap and 72-viewport-width basis to a 720-pixel cap and 62-viewport-width basis. Preserve the current mobile behavior, where the card remains within the viewport, and do not alter the 466 × 192 source images.

### Figure 1 note

Remove the overview caption note and its now-unused `.caption-note` CSS rule. Keep the main Figure 1 caption and full-resolution link unchanged.

## Delivery and verification

Bump the main stylesheet query version so the visual changes are not hidden by browser cache. Add static tests for the two distinct logo treatments, four limitation entries and their key paper phrases, smaller desktop sample-card sizing, removal of the overview note, and the updated stylesheet version. Run the focused tests and then the complete Node suite.
