# Citation Copy Design

## Goal

Simplify the citation section copy.

## Design

Change the citation section’s primary heading to “Cite AnaDiffusion” and remove the sentence about the supplied preprint and implementation repository. Preserve the “Citation” kicker, resource links, and BibTeX card without layout or styling changes.

## Verification

Add a static regression assertion for the new heading and the absence of the removed sentence, then run the complete test suite.
