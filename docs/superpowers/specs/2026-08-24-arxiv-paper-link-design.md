# arXiv Paper Link Design

## Goal

Stop publishing a repository-owned `paper.pdf` and route every paper action to the canonical arXiv PDF at `https://arxiv.org/pdf/2608.23014`.

## Scope

- Replace the four live `paper.pdf` links in `index.html`: navigation, hero resource button, citation resource button, and footer.
- Give all four external links `target="_blank"` and `rel="noopener"`.
- Remove `paper.pdf` from Git tracking and the working tree.
- Replace the local-PDF checksum test with a regression test that requires four canonical arXiv PDF links and forbids any `paper.pdf` reference.
- Preserve all unrelated content, styling, media, and local ignore rules.

## Alternatives considered

1. **Direct arXiv PDF for every paper action (chosen).** One canonical destination, exactly matching the requested URL.
2. Mix the arXiv abstract page and PDF URL. This creates inconsistent behavior and does not follow the requested link exactly.
3. Keep a local redirect or duplicate PDF. This retains unnecessary repository weight and defeats the request to delete the local paper.

## Verification

- Demonstrate the updated regression test fails before the HTML and asset changes.
- Verify exactly four canonical arXiv PDF links and zero `paper.pdf` references remain in live source.
- Verify `paper.pdf` is absent from `HEAD` and the working tree.
- Run the complete Node and Python test suites before committing and pushing.
