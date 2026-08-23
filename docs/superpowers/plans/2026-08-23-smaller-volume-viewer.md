# Smaller Volume Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the desktop generated-volume viewer from 820px to 720px while preserving its square shape and responsive mobile layout.

**Architecture:** Keep the existing HTML and NiiVue rendering module unchanged. Adjust only the desktop grid column in `assets/css/main.css`, and update the existing static-page regression test to lock the new size.

**Tech Stack:** HTML, CSS, Node.js built-in test runner

---

### Task 1: Reduce the desktop viewer size

**Files:**
- Modify: `tests/static-page.test.mjs:321-329`
- Modify: `assets/css/main.css:511-513`

- [ ] **Step 1: Write the failing test**

Change the viewer-shell assertion to require the new 720px column:

```js
assert.match(css, /\.viewer-shell\s*\{[^}]*grid-template-columns:\s*210px minmax\(0,\s*720px\)/s);
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
node --test --test-name-pattern="uses a smaller square viewer beside a vertical volume rail" tests/static-page.test.mjs
```

Expected: FAIL because the stylesheet still contains `minmax(0, 820px)`.

- [ ] **Step 3: Implement the minimal CSS change**

Update the desktop viewer grid:

```css
.viewer-shell {
  display: grid; grid-template-columns: 210px minmax(0, 720px); gap: 24px; align-items: start; justify-content: center;
}
```

Do not change `.viewer-stage`, the mobile media query, or the NiiVue JavaScript.

- [ ] **Step 4: Run focused and full verification**

Run:

```bash
node --test --test-name-pattern="uses a smaller square viewer beside a vertical volume rail" tests/static-page.test.mjs
node --test tests/*.test.mjs
```

Expected: the focused test passes and all 51 tests pass.

- [ ] **Step 5: Commit the implementation**

```bash
git add assets/css/main.css tests/static-page.test.mjs docs/superpowers/plans/2026-08-23-smaller-volume-viewer.md
git commit -m "Reduce interactive volume viewer size"
```
