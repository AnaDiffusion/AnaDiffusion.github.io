# Mobile Abstract Animation Centering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Center the oversized Abstract brain animation horizontally on mobile screens while preserving its desktop position and existing presentation.

**Architecture:** Keep the existing transparent WebM and desktop grid placement. In the mobile media query, remove the oversized video from grid sizing and anchor its midpoint explicitly to the overlay midpoint with absolute 50% coordinates and a two-axis translation.

**Tech Stack:** Static HTML, CSS media queries, Node.js built-in test runner.

---

### Task 1: Add the mobile-centering regression test

**Files:**
- Modify: `tests/static-page.test.mjs:107-141`

- [ ] **Step 1: Replace the existing mobile animation assertion with an explicit anchoring assertion**

```js
assert.match(
  css,
  /@media \(max-width:\s*720px\)[\s\S]*\.abstract-motion video\s*\{[^}]*position:\s*absolute[^}]*top:\s*50%[^}]*left:\s*50%[^}]*width:\s*165vw[^}]*opacity:\s*\.3[^}]*transform:\s*translate\(-50%,\s*calc\(-50% \+ 120px\)\)/,
);
```

- [ ] **Step 2: Advance the expected stylesheet cache key**

```js
assert.match(html, /assets\/css\/main\.css\?v=20260824-6/);
```

- [ ] **Step 3: Run the focused static-page test and verify RED**

Run: `node --test tests/static-page.test.mjs`

Expected: FAIL because the mobile rule does not yet include absolute 50% anchoring and `index.html` still uses the prior stylesheet cache key.

### Task 2: Implement explicit mobile centering

**Files:**
- Modify: `assets/css/main.css:604-607`
- Modify: `index.html:23`

- [ ] **Step 1: Replace the mobile video rule**

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

- [ ] **Step 2: Advance the stylesheet cache key**

```html
<link rel="stylesheet" href="assets/css/main.css?v=20260824-6">
```

- [ ] **Step 3: Run the focused test and verify GREEN**

Run: `node --test tests/static-page.test.mjs`

Expected: all static-page tests pass.

### Task 3: Verify the complete site and commit

**Files:**
- Verify: `assets/css/main.css`
- Verify: `index.html`
- Verify: `tests/static-page.test.mjs`

- [ ] **Step 1: Run the full test suite**

Run: `node --test tests/*.test.mjs`

Expected: 57 tests pass, 0 fail.

- [ ] **Step 2: Check patch hygiene and scope**

Run: `git diff --check && git diff --stat && git status --short`

Expected: no whitespace errors; only the plan, test, CSS, and HTML cache key are changed.

- [ ] **Step 3: Commit the implementation**

```bash
git add docs/superpowers/plans/2026-08-24-mobile-abstract-animation-centering.md tests/static-page.test.mjs assets/css/main.css index.html
git commit -m "Fix mobile abstract animation centering"
```
