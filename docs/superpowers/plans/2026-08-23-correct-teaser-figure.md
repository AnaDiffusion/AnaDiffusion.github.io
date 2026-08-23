# Correct Teaser Figure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `images/teaser.png` the canonical Figure 1 displayed on the webpage.

**Architecture:** Reference the supplied asset directly rather than copying or transforming it. Update the static contract and HTML together while leaving the obsolete PDF crop unreferenced.

**Tech Stack:** HTML, PNG, Node.js test runner

---

### Task 1: Define the correct Figure 1 contract

**Files:**
- Modify: `tests/static-page.test.mjs`

- [ ] **Step 1: Update the Figure 1 test**

Require `images/teaser.png`, SHA-256 `39174e58622485c77ee0a837716bf7afddc4bba1da29d0159b78c9547e91b0be`, dimensions 2800 by 1595, direct image/full-resolution references, and alternative text describing the FID radar and SynthSeg effect-size comparison. Reject webpage references to `images/figure-1-overview.png`.

- [ ] **Step 2: Verify the test fails**

Run: `node --test --test-name-pattern="uses the supplied teaser as Figure 1" tests/static-page.test.mjs`

Expected: FAIL because the webpage still references the PDF-derived crop.

### Task 2: Update the webpage

**Files:**
- Modify: `index.html:85-96`

- [ ] **Step 1: Switch the image and links**

Change the image source, figure anchor, and full-resolution link to `images/teaser.png`.

- [ ] **Step 2: Correct metadata**

Set dimensions to 2800 by 1595 and use alternative text that describes baseline failures, AnaDiffusion outputs, the MedicalNet FID radar chart, and the SynthSeg effect-size comparison.

- [ ] **Step 3: Verify focused and full suites**

Run the focused test and expect one pass. Then run `node --test tests/*.test.mjs` and expect zero failures.

### Task 3: Visual verification

**Files:**
- Verify: `images/teaser.png`

- [ ] **Step 1: Inspect the source asset**

Confirm that the complete baseline, AnaDiffusion, MedicalNet FID, and SynthSeg panels are visible with no cropping or corruption.
