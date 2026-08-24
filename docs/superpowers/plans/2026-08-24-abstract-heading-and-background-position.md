# Abstract Heading and Background Position Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Center the Abstract kicker and title and move the existing brain background down by exactly 120px.

**Architecture:** Keep the HTML structure, media dimensions, 30% opacity, and playback code unchanged. Strengthen the static CSS contract first, update only the Abstract presentation rules, and advance the stylesheet cache key.

**Tech Stack:** Static CSS and HTML, Node's built-in test runner, local HTTP verification.

---

## File structure

- `tests/static-page.test.mjs`: enforce the centered heading, exact 120px media offset, and cache key.
- `assets/css/main.css`: center the kicker/title and shift the desktop/mobile media vertically.
- `index.html`: advance the stylesheet cache key.

### Task 1: Add the failing visual contract

**Files:**
- Modify: `tests/static-page.test.mjs:105-110`
- Modify: `tests/static-page.test.mjs:486-491`

- [ ] **Step 1: Require centered Abstract heading elements**

Add to the existing Abstract-background test:

```js
  assert.match(css, /\.abstract-section \.section-kicker,\s*\.abstract-section h2\s*\{[^}]*text-align:\s*center/s);
  assert.match(css, /\.abstract-section h2\s*\{[^}]*max-width:\s*760px[^}]*margin-inline:\s*auto/s);
```

- [ ] **Step 2: Require the 120px vertical media offset**

Replace the two current transform assertions with:

```js
  assert.match(css, /\.abstract-motion video\s*\{[^}]*opacity:\s*\.3[^}]*transform:\s*translateY\(120px\)/s);
  assert.match(css, /@media \(max-width:\s*720px\)[\s\S]*\.abstract-motion video\s*\{[^}]*opacity:\s*\.3[^}]*transform:\s*translateY\(120px\)/);
```

- [ ] **Step 3: Require stylesheet cache key `20260824-3`**

Update the existing cache assertion to:

```js
  assert.match(
    html,
    /<link\s+rel=["']stylesheet["']\s+href=["']assets\/css\/main\.css\?v=20260824-3["']>/,
  );
```

- [ ] **Step 4: Run the targeted tests and verify failure**

Run:

```bash
node --test --test-name-pattern="Abstract background|cache-busts the stylesheet" tests/static-page.test.mjs
```

Expected: both tests FAIL because the heading is not centered, the transform remains horizontal, and the cache key remains `20260824-2`.

### Task 2: Implement, verify, and commit

**Files:**
- Modify: `assets/css/main.css:295-301`
- Modify: `assets/css/main.css:600`
- Modify: `index.html:22`
- Test: `tests/static-page.test.mjs`

- [ ] **Step 1: Center the kicker and title**

Use:

```css
.abstract-section .section-kicker,
.abstract-section h2 { text-align: center; }
.abstract-section h2 { max-width: 760px; margin-inline: auto; }
```

- [ ] **Step 2: Move the brain down 120px at both sizes**

Update the base rule to:

```css
.abstract-motion video {
  display: block; width: min(1100px, 78vw); max-width: none; height: auto;
  opacity: .3; transform: translateY(120px); filter: saturate(.9);
}
```

Update the mobile rule to:

```css
  .abstract-motion video { width: 165vw; opacity: .3; transform: translateY(120px); }
```

- [ ] **Step 3: Advance the stylesheet cache key**

Use:

```html
    <link rel="stylesheet" href="assets/css/main.css?v=20260824-3">
```

- [ ] **Step 4: Run the complete frontend suite and scope checks**

Run:

```bash
node --test tests/*.test.mjs
git diff --check
git status --short
```

Expected: 56 tests pass with no failures or whitespace errors; only CSS, HTML, the static test, and this plan are in scope.

- [ ] **Step 5: Commit the implementation**

```bash
git add assets/css/main.css index.html tests/static-page.test.mjs docs/superpowers/plans/2026-08-24-abstract-heading-and-background-position.md
git commit -m "Align abstract heading and background"
```

### Task 3: Merge and verify localhost

- [ ] **Step 1: Fast-forward the tested branch into `main` while preserving `.gitignore` byte-for-byte.**

- [ ] **Step 2: Run `node --test tests/*.test.mjs` from merged `main`; expect 56 passes and zero failures.**

- [ ] **Step 3: Confirm `http://127.0.0.1:8765/` references cache key `20260824-3` and the served CSS contains centered heading rules plus `translateY(120px)` in base and mobile rules.**

- [ ] **Step 4: Remove the merged worktree and delete the feature branch.**

## Baseline

All 56 frontend tests passed before this change. The selected vertical movement is exactly 120px, and the user's `.gitignore` remains outside the edit scope.
