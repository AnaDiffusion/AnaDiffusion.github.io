# Citation Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the citation section heading and remove its redundant explanatory sentence.

**Architecture:** Make a copy-only HTML edit. Protect the requested wording with a static regression test; no CSS or JavaScript changes are needed.

**Tech Stack:** HTML, Node.js test runner

---

### Task 1: Update citation copy

**Files:**
- Modify: `tests/static-page.test.mjs`
- Modify: `index.html:333-340`

- [ ] **Step 1: Write the failing test**

Add a test that extracts the citation section, requires `<h2 id="citation-title">Cite AnaDiffusion</h2>`, and rejects both the old heading and the supplied-preprint sentence.

- [ ] **Step 2: Verify the test fails**

Run: `node --test --test-name-pattern="uses the concise AnaDiffusion citation heading" tests/static-page.test.mjs`

Expected: FAIL because the current heading and paragraph still use the old copy.

- [ ] **Step 3: Implement the copy edit**

Replace the heading with “Cite AnaDiffusion” and delete the explanatory paragraph. Do not change the kicker, resource links, or BibTeX card.

- [ ] **Step 4: Verify focused and full suites**

Run the focused command again and expect one passing test. Then run `node --test tests/*.test.mjs` and expect zero failures.
