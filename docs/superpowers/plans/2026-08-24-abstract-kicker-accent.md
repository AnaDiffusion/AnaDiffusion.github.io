# Abstract Kicker Accent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the existing centered spectrum mini bar beneath the Abstract kicker.

**Architecture:** Keep the current Abstract markup and heading layout. Extend the established pseudo-element pattern with one Abstract-scoped selector, then cache-bust the stylesheet so browsers receive it.

**Tech Stack:** Static HTML, CSS, Node.js built-in test runner

---

### Task 1: Add and verify the Abstract accent bar

**Files:**
- Modify: `tests/static-page.test.mjs`
- Modify: `assets/css/main.css`
- Modify: `index.html`

- [ ] **Step 1: Write the failing test**

Add an assertion to the Abstract background test:

```js
assert.match(css, /\.abstract-section \.section-kicker::after\s*\{[^}]*width:\s*48px[^}]*height:\s*3px[^}]*margin:\s*14px auto 0[^}]*background:\s*var\(--grad\)/s);
```

Update the stylesheet-cache assertion to expect:

```js
assets/css/main.css?v=20260824-4
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
node --test --test-name-pattern="Abstract background|cache-busts the stylesheet" tests/static-page.test.mjs
```

Expected: failure because the Abstract-specific pseudo-element and the new cache key do not yet exist.

- [ ] **Step 3: Implement the minimal CSS and cache bump**

Add to `assets/css/main.css` beside the centered Abstract heading rules:

```css
.abstract-section .section-kicker::after {
  content: ""; display: block; width: 48px; height: 3px; margin: 14px auto 0;
  border-radius: 3px; background: var(--grad);
}
```

Change the stylesheet URL in `index.html` to:

```html
<link rel="stylesheet" href="assets/css/main.css?v=20260824-4">
```

- [ ] **Step 4: Run the complete verification suite**

Run:

```bash
node --test tests/*.test.mjs
git diff --check
```

Expected: 56 tests pass, zero failures, and no whitespace errors.

- [ ] **Step 5: Commit**

```bash
git add assets/css/main.css index.html tests/static-page.test.mjs
git commit -m "Add abstract section accent"
```
