# Abstract Heading Left Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Left-align the Abstract kicker, mini bar, and title with the reading column.

**Architecture:** Preserve the current markup and override only the three Abstract-scoped alignment values. Cache-bust the stylesheet so the new layout loads immediately.

**Tech Stack:** Static HTML, CSS, Node.js built-in test runner

---

### Task 1: Left-align the Abstract heading group

**Files:**
- Modify: `tests/static-page.test.mjs`
- Modify: `assets/css/main.css`
- Modify: `index.html`

- [ ] **Step 1: Write the failing test**

Update the Abstract assertions to require:

```js
assert.match(css, /\.abstract-section \.section-kicker,\s*\.abstract-section h2\s*\{[^}]*text-align:\s*left/s);
assert.match(css, /\.abstract-section \.section-kicker::after\s*\{[^}]*margin:\s*14px 0 0/s);
assert.match(css, /\.abstract-section h2\s*\{[^}]*max-width:\s*760px[^}]*margin-inline:\s*0/s);
```

Update the stylesheet-cache assertion to expect:

```js
assets/css/main.css?v=20260824-5
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
node --test --test-name-pattern="Abstract background|cache-busts the stylesheet" tests/static-page.test.mjs
```

Expected: failure because the existing rules center the heading group and the page references the previous cache key.

- [ ] **Step 3: Implement the minimal CSS and cache bump**

Change the Abstract rules in `assets/css/main.css` to:

```css
.abstract-section .section-kicker,
.abstract-section h2 { text-align: left; }
.abstract-section .section-kicker::after {
  content: ""; display: block; width: 48px; height: 3px; margin: 14px 0 0;
  border-radius: 3px; background: var(--grad);
}
.abstract-section h2 { max-width: 760px; margin-inline: 0; }
```

Change the stylesheet URL in `index.html` to:

```html
<link rel="stylesheet" href="assets/css/main.css?v=20260824-5">
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
git commit -m "Left-align abstract heading"
```
