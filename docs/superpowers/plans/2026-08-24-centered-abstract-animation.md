# Centered Abstract Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Center the existing Abstract background animation and increase it to 30% opacity on desktop and mobile.

**Architecture:** Keep the existing decorative video markup and playback code unchanged. Tighten the static-page contract, update only the base and mobile video presentation rules, and advance the stylesheet cache key so localhost and GitHub Pages fetch the new CSS.

**Tech Stack:** Static CSS and HTML, Node's built-in test runner, local HTTP verification.

---

## File structure

- `tests/static-page.test.mjs`: enforce centered alignment, 30% opacity, and the new stylesheet cache key.
- `assets/css/main.css`: update desktop and mobile Abstract-video presentation.
- `index.html`: advance the stylesheet cache key.

### Task 1: Center and strengthen the Abstract animation

**Files:**
- Modify: `tests/static-page.test.mjs:105-109`
- Modify: `tests/static-page.test.mjs:486-491`
- Modify: `assets/css/main.css:295-298`
- Modify: `assets/css/main.css:600`
- Modify: `index.html:22`

- [ ] **Step 1: Write the failing centered-opacity contract**

Replace the desktop and mobile style assertions with:

```js
  assert.match(css, /\.abstract-motion video\s*\{[^}]*opacity:\s*\.3[^}]*transform:\s*translateX\(0\)/s);
  assert.match(css, /@media \(max-width:\s*720px\)[\s\S]*\.abstract-motion video\s*\{[^}]*opacity:\s*\.3[^}]*transform:\s*translateX\(0\)/);
```

Replace the stylesheet cache assertion with:

```js
  assert.match(
    html,
    /<link\s+rel=["']stylesheet["']\s+href=["']assets\/css\/main\.css\?v=20260824-2["']>/,
  );
```

- [ ] **Step 2: Run the targeted tests and verify they fail**

Run:

```bash
node --test --test-name-pattern="Abstract background|cache-busts the stylesheet" tests/static-page.test.mjs
```

Expected: both tests FAIL because CSS still uses 10%/7% opacity and rightward offsets, while HTML still references cache key `20260824-1`.

- [ ] **Step 3: Implement the minimal CSS change**

Update the desktop rule to:

```css
.abstract-motion video {
  display: block; width: min(1100px, 78vw); max-width: none; height: auto;
  opacity: .3; transform: translateX(0); filter: saturate(.9);
}
```

Update the existing mobile rule to:

```css
  .abstract-motion video { width: 165vw; opacity: .3; transform: translateX(0); }
```

- [ ] **Step 4: Advance the stylesheet cache key**

Change the stylesheet reference in `index.html` to:

```html
    <link rel="stylesheet" href="assets/css/main.css?v=20260824-2">
```

- [ ] **Step 5: Run the full frontend suite**

Run:

```bash
node --test tests/*.test.mjs
```

Expected: PASS, 56 tests and 0 failures.

- [ ] **Step 6: Verify scope and formatting**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only the test, CSS, HTML, and this plan are changed.

- [ ] **Step 7: Commit the change**

```bash
git add tests/static-page.test.mjs assets/css/main.css index.html docs/superpowers/plans/2026-08-24-centered-abstract-animation.md
git commit -m "Center abstract animation"
```

### Task 2: Integrate and verify localhost

**Files:**
- Verify: `index.html`
- Verify: `assets/css/main.css`

- [ ] **Step 1: Fast-forward the feature branch into `main`**

Merge only after the feature branch is clean and all frontend tests pass. Preserve the user's uncommitted `.gitignore` file byte-for-byte.

- [ ] **Step 2: Re-run the full frontend suite from `main`**

Run:

```bash
node --test tests/*.test.mjs
```

Expected: PASS, 56 tests and 0 failures.

- [ ] **Step 3: Verify the active localhost response**

Request `http://127.0.0.1:8765/` and confirm it references `assets/css/main.css?v=20260824-2`. Request that stylesheet and confirm its base and mobile Abstract-video rules both contain `opacity: .3` and `translateX(0)`.

- [ ] **Step 4: Clean up the merged worktree and branch**

Remove `.worktrees/centered-abstract-animation` and delete `feature/centered-abstract-animation` only after merged-main verification succeeds.

## Baseline

All 56 frontend tests passed before this change. The animation file, playback initializer, Abstract text, and user-owned `.gitignore` modification remain outside this plan's edit scope.
