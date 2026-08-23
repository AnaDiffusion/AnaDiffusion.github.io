# Square Volume Viewer Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the oversized rectangular viewer with a square four-panel canvas beside a vertical volume-button rail, remove redundant view-mode controls, and restore readable Assemble parts text.

**Architecture:** Keep NiiVue's fixed multiplanar initialization and existing volume-loading flow. Restructure only the viewer HTML/CSS around a two-column shell, remove the obsolete `data-view` markup and listener, and cover the behavior with static regression tests.

**Tech Stack:** Static HTML, CSS Grid/Flexbox, JavaScript ES modules, NiiVue, Node's built-in test runner.

---

### Task 1: Add viewer layout regression coverage

**Files:**
- Modify: `tests/static-page.test.mjs`

- [ ] **Step 1: Write the failing tests**

Add tests that read `index.html`, `assets/css/main.css`, and `assets/js/volume-viewer.mjs` and assert the approved structure:

```js
test('uses a square viewer beside a vertical volume rail', () => {
  const html = readPage();
  const css = readFileSync(cssPath, 'utf8');

  assert.match(html, /<div class="viewer-viewport">[\s\S]*data-volume-viewer[\s\S]*data-viewer-status/);
  assert.match(css, /\.viewer-shell\s*\{[^}]*grid-template-columns:\s*210px minmax\(0,\s*820px\)/s);
  assert.match(css, /\.viewer-stage\s*\{[^}]*aspect-ratio:\s*1/s);
  assert.match(css, /\.viewer-chips\s*\{[^}]*flex-direction:\s*column/s);
  assert.match(css, /@media \(max-width:\s*720px\)[\s\S]*\.viewer-chips\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
});

test('keeps one four-panel mode without redundant view buttons', () => {
  const html = readPage();
  const viewerModule = readFileSync(volumeViewerPath, 'utf8');

  assert.doesNotMatch(html, /data-view=/);
  assert.doesNotMatch(html, />Slices<|>3D</);
  assert.doesNotMatch(viewerModule, /querySelectorAll\('\[data-view\]'\)/);
  assert.match(viewerModule, /nv\.setSliceType\(nv\.sliceTypeMultiplanar\)/);
});

test('uses readable viewer emphasis and active-button text', () => {
  const css = readFileSync(cssPath, 'utf8');

  assert.match(css, /\.viewer-heading strong\s*\{[^}]*color:\s*#fff/s);
  assert.match(css, /\.viewer-chips button\.is-active\s*\{[^}]*color:\s*#21172c/s);
});
```

- [ ] **Step 2: Update the cache-bust expectation**

Change the existing expected module URL from `v=20260820-6` to `v=20260820-7`.

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
node --test --test-name-pattern="square viewer|four-panel mode|readable viewer emphasis|cache-busts" tests/static-page.test.mjs
```

Expected: the new layout tests fail because the viewer is still rectangular, the view buttons/listener still exist, the emphasis rule is missing, and the cache version is still 6.

### Task 2: Implement the approved viewer structure and styles

**Files:**
- Modify: `index.html:146-163`
- Modify: `assets/css/main.css:504-530`
- Modify: `assets/js/volume-viewer.mjs:77-91`

- [ ] **Step 1: Restructure the viewer markup**

Keep the five volume buttons, remove the Choose view group, and wrap the stage/status pair:

```html
<div class="wide-shell viewer-shell">
  <div class="viewer-controls">
    <div class="viewer-chips" role="group" aria-label="Choose volume">
      <button type="button" data-vol="whole" class="is-active">Whole brain</button>
      <button type="button" data-vol="lhemi">Left hemi</button>
      <button type="button" data-vol="rhemi">Right hemi</button>
      <button type="button" data-vol="cb">Cerebellum–brainstem</button>
      <button type="button" data-vol="assemble">Assemble parts</button>
    </div>
  </div>
  <div class="viewer-viewport">
    <div class="viewer-stage" data-volume-viewer></div>
    <p class="viewer-status" data-viewer-status aria-live="polite">Loading the interactive viewer…</p>
  </div>
</div>
```

- [ ] **Step 2: Implement the desktop and mobile layout**

Replace the current viewer layout rules with:

```css
.viewer-heading strong { color: #fff; }
.viewer-shell {
  display: grid;
  grid-template-columns: 210px minmax(0, 820px);
  gap: 24px;
  align-items: start;
  justify-content: center;
}
.viewer-controls, .viewer-viewport { min-width: 0; }
.viewer-chips { display: flex; flex-direction: column; gap: 8px; }
.viewer-chips button {
  width: 100%; padding: 11px 15px; border: 1px solid #3a3358; border-radius: 999px;
  background: #1c1730; color: #d8d5e6; cursor: pointer; font-size: .85rem;
  font-weight: 650; text-align: left;
  transition: border-color 150ms ease, background 150ms ease, color 150ms ease, transform 150ms var(--ease);
}
.viewer-chips button:hover { border-color: var(--iris-bright); color: #fff; transform: translateY(-1px); }
.viewer-chips button.is-active { border-color: transparent; background: var(--grad); color: #21172c; font-weight: 760; }
.viewer-stage {
  position: relative; width: 100%; height: auto; min-height: 0; aspect-ratio: 1; overflow: hidden;
  border: 1px solid #2c2545; border-radius: 14px; background: #0b0817;
  box-shadow: 0 30px 80px rgba(20,8,40,.5);
}
.viewer-canvas { display: block; width: 100%; height: 100%; outline: none; }
.viewer-status { margin: 12px 0 0; min-height: 1.2em; color: #a7a3bb; font-size: .85rem; text-align: center; }

@media (max-width: 720px) {
  .viewer-shell { grid-template-columns: minmax(0, 1fr); gap: 18px; }
  .viewer-chips { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .viewer-chips button { text-align: center; }
  .viewer-chips button:last-child { grid-column: 1 / -1; }
}
```

- [ ] **Step 3: Remove the obsolete view-mode listener**

Delete the loop over `[data-view]`. Keep:

```js
nv.setSliceType(nv.sliceTypeMultiplanar);
await load('whole');
```

- [ ] **Step 4: Bump the viewer module URL**

Set the script source to:

```html
<script type="module" src="assets/js/volume-viewer.mjs?v=20260820-7"></script>
```

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run:

```bash
node --test --test-name-pattern="square viewer|four-panel mode|readable viewer emphasis|cache-busts" tests/static-page.test.mjs
```

Expected: 4 focused tests pass with zero failures.

### Task 3: Complete verification

**Files:**
- Verify: `index.html`
- Verify: `assets/css/main.css`
- Verify: `assets/js/volume-viewer.mjs`
- Verify: `tests/static-page.test.mjs`

- [ ] **Step 1: Check JavaScript syntax**

Run:

```bash
node --check assets/js/volume-viewer.mjs
```

Expected: exit code 0 with no output.

- [ ] **Step 2: Run the complete test suite**

Run:

```bash
node --test tests/*.test.mjs
```

Expected: all tests pass with zero failures.

- [ ] **Step 3: Inspect layout requirements**

Confirm the desktop viewer is square with a left button rail, the mobile layout places a two-column button grid above the viewer, the Assemble parts prose is readable, and no Slices/3D controls appear. If browser control is unavailable, report that limitation rather than claiming live browser verification.

## Repository note

This workspace is not a Git repository, so commit steps are intentionally omitted.
