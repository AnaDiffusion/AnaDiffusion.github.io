# Updated Figure 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the webpage’s Figure 1 with the revised Figure 1 from the August 23, 2026 paper.

**Architecture:** Treat `paper.pdf` page 2 as the visual source of truth. Use the visually verified 300-DPI figure-only crop as the stable web asset, update its semantic HTML metadata and caption, and pin source/output hashes in static tests.

**Tech Stack:** HTML, PNG, Poppler, Node.js test runner

---

### Task 1: Pin the revised paper and Figure 1 contract

**Files:**
- Modify: `tests/static-page.test.mjs`

- [ ] **Step 1: Update the paper digest expectation and add the new figure contract**

Expect the paper SHA-256 `2201fc3e80b5a1e3d01cd80774b31cb7962f7b2000543bc6a0122c6d504e6858`. Add a Figure 1 test requiring SHA-256 `c26d7cd9a6fdda1023010dcb4485fd6d60a863d5848b09d87c869982c1ae200b`, HTML dimensions `1990` by `1110`, MedicalNet FID/SynthSeg radar-chart alternative text, and the revised caption sentence.

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `node --test --test-name-pattern="uses the exact standalone paper build|publishes the revised Figure 1" tests/static-page.test.mjs`

Expected: the old paper digest, Figure 1 asset, dimensions, alt text, and caption fail the revised contract.

### Task 2: Integrate the revised figure

**Files:**
- Replace: `images/figure-1-overview.png`
- Modify: `index.html:85-97`

- [ ] **Step 1: Replace the binary asset**

Copy the visually verified `tmp/pdfs/figure1-crop-02.png` to `images/figure-1-overview.png`.

- [ ] **Step 2: Synchronize the HTML**

Set the image dimensions to `1990` by `1110`, update the alternative text to describe the baseline failures, AnaDiffusion outputs, and MedicalNet FID/SynthSeg radar charts, and append: “The resulting model generates better regional and global anatomy across FID and SynthSeg-based metrics.”

- [ ] **Step 3: Run focused tests and verify they pass**

Run the focused command from Task 1 and expect two passing tests.

### Task 3: Verify the rendered asset and page contracts

**Files:**
- Verify: `images/figure-1-overview.png`
- Verify: `paper.pdf`

- [ ] **Step 1: Inspect the final PNG**

Confirm the final image is 1990 by 1110, contains the complete dual-radar panel, and excludes the PDF caption and body text.

- [ ] **Step 2: Run the complete suite**

Run: `node --test tests/*.test.mjs`

Expected: zero failures.
