# Page Polish and Limitations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve footer-logo contrast, publish all four limitations, reduce sample enlargement, and remove the obsolete Figure 1 note.

**Architecture:** Keep all existing image assets and page components. Make scoped HTML content changes and CSS presentation changes, then bump the stylesheet version so the browser receives them immediately.

**Tech Stack:** Static HTML, CSS, Node's built-in test runner.

---

### Task 1: Add failing regression coverage

**Files:**
- Modify: `tests/static-page.test.mjs`

- [ ] **Step 1: Add limitations coverage**

```js
test('publishes all four paper-grounded limitations', () => {
  const html = readPage();
  const section = html.match(/<section[^>]+id="limitations"[\s\S]*?<\/section>/)?.[0] ?? '';

  assert.equal((section.match(/<p><strong>/g) ?? []).length, 4);
  assert.match(section, /additional training and inference complexity compared with a monolithic LDM/i);
  assert.match(section, /does not fully solve broader tissue-level calibration/i);
  assert.match(section, /tissue classes, functional networks, or multi-scale anatomical hierarchies/i);
  assert.match(section, /approximate correspondence with MNI152/i);
  assert.match(section, /severe mass effect or displaced anatomical boundaries/i);
  assert.match(section, /lesion-aware or subject-adaptive localization/i);
});
```

- [ ] **Step 2: Add visual-style coverage**

```js
test('keeps footer logos legible and sample cards closer to source size', () => {
  const css = readFileSync(cssPath, 'utf8');

  assert.match(css, /\.footer-logos img:first-child\s*\{[^}]*filter:\s*none[^}]*opacity:\s*1/s);
  assert.match(css, /\.footer-logos img:last-child\s*\{[^}]*max-width:\s*160px[^}]*filter:\s*brightness\(0\) invert\(1\)/s);
  assert.match(css, /\.sample-card\s*\{[^}]*flex:\s*0 0 min\(720px,\s*62vw\)/s);
});
```

- [ ] **Step 3: Replace the obsolete note assertion**

Keep the citation assertions and require the note and its CSS selector to be absent:

```js
assert.doesNotMatch(html, /The overview is reproduced in full|final manuscript values are reported/);
assert.doesNotMatch(html, /class="caption-note"/);
assert.doesNotMatch(css, /\.caption-note\s*\{/);
```

- [ ] **Step 4: Update the stylesheet cache-bust expectation**

Require `assets/css/main.css?v=20260820-2` instead of version 1.

- [ ] **Step 5: Run the focused tests and verify RED**

Run:

```bash
node --test --test-name-pattern="four paper-grounded limitations|footer logos legible|corrected paper citation|cache-busts the stylesheet" tests/static-page.test.mjs
```

Expected: the new and updated tests fail on the current two limitations, low-contrast logo rules, 920-pixel sample cards, retained note, and stylesheet version 1.

### Task 2: Update page content

**Files:**
- Modify: `index.html:91-95`
- Modify: `index.html:309-317`

- [ ] **Step 1: Remove the Figure 1 note**

Delete exactly this paragraph; preserve the preceding main Figure 1 caption paragraph:

```html
<p class="caption-note">The overview is reproduced in full from the supplied PDF. Its embedded annotations are preserved as published; the final manuscript values are reported in the complete Table 1 below.</p>
```

- [ ] **Step 2: Replace the limitations list**

```html
<div class="limitations-list">
  <p><strong>Multi-stage complexity.</strong> The multi-stage design introduces additional training and inference complexity compared with a monolithic LDM.</p>
  <p><strong>Tissue-level calibration.</strong> The fixed, anatomy-driven factorization improves local part and seam behavior, but does not fully solve broader tissue-level calibration.</p>
  <p><strong>Predefined anatomy.</strong> The chosen decomposition focuses on predefined anatomical regions and may not capture other biologically meaningful organizations, including tissue classes, functional networks, or multi-scale anatomical hierarchies.</p>
  <p><strong>MNI152 correspondence.</strong> AnaDiffusion assumes approximate correspondence with MNI152 and has not been validated for severe mass effect or displaced anatomical boundaries. These pathologies may impair registration and invalidate fixed regional placements; supporting them would require lesion-aware or subject-adaptive localization.</p>
</div>
```

### Task 3: Update visual presentation and cache version

**Files:**
- Modify: `assets/css/main.css:283`
- Modify: `assets/css/main.css:448-455`
- Modify: `assets/css/main.css:491-492`
- Modify: `index.html:27`

- [ ] **Step 1: Remove the unused caption-note rule**

Delete this complete declaration:

```css
.caption-note { margin-top: 9px; padding-left: 13px; border-left: 3px solid transparent; border-image: var(--grad) 1; color: #7a7a83; font-size: .95rem; }
```

- [ ] **Step 2: Reduce desktop sample-card size**

Change the `.sample-card` flex declaration to:

```css
flex: 0 0 min(720px, 62vw);
```

- [ ] **Step 3: Apply distinct high-contrast logo treatments**

```css
.footer-logos { display: flex; align-items: center; gap: 18px; }
.footer-logos img { width: auto; object-fit: contain; }
.footer-logos img:first-child { max-width: 54px; max-height: 54px; filter: none; opacity: 1; }
.footer-logos img:last-child { max-width: 160px; max-height: 44px; filter: brightness(0) invert(1); opacity: .9; }
```

- [ ] **Step 4: Bump the stylesheet URL**

```html
<link rel="stylesheet" href="assets/css/main.css?v=20260820-2">
```

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run:

```bash
node --test --test-name-pattern="four paper-grounded limitations|footer logos legible|corrected paper citation|cache-busts the stylesheet" tests/static-page.test.mjs
```

Expected: 4 focused tests pass with zero failures.

### Task 4: Complete verification

**Files:**
- Verify: `index.html`
- Verify: `assets/css/main.css`
- Verify: `tests/static-page.test.mjs`

- [ ] **Step 1: Run the complete suite**

```bash
node --test tests/*.test.mjs
```

Expected: all tests pass with zero failures.

- [ ] **Step 2: Verify source assets remain unchanged**

Confirm the footer logo files and 466 × 192 sample images still exist and are referenced directly; only their CSS presentation changes.

## Repository note

This workspace is not a Git repository, so commit steps are intentionally omitted.
