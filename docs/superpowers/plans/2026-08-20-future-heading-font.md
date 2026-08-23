# Future Heading Font Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the established editorial serif section-heading style to “Where AnaDiffusion goes next.”

**Architecture:** Extend the existing shared CSS selector rather than introducing a duplicate rule or changing HTML. Protect the selector membership with a static regression test.

**Tech Stack:** HTML, CSS, Node.js test runner

---

### Task 1: Correct the Future Work heading font

**Files:**
- Modify: `tests/static-page.test.mjs`
- Modify: `assets/css/main.css:258`

- [ ] **Step 1: Write the failing test**

Add an assertion that the shared editorial heading selector contains `.future-section h2` and declares `font-family: var(--serif)`.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test --test-name-pattern="uses the editorial serif for the future-work heading" tests/static-page.test.mjs`

Expected: FAIL because `.future-section h2` is absent from the selector.

- [ ] **Step 3: Implement the minimal CSS change**

Change the shared selector to:

```css
.section-heading h2, .abstract-section h2, .limitations-section h2, .future-section h2, .citation-section h2 {
```

- [ ] **Step 4: Verify focused and full suites**

Run the focused command again and expect one passing test. Then run `node --test tests/*.test.mjs` and expect zero failures.

- [ ] **Step 5: Confirm cache delivery**

Bump the stylesheet query string in `index.html` from `v=20260820-2` to `v=20260820-3` and update its cache-busting assertion.
