# Editing Panel and Figure Border Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display only the panel-(b) localized editing comparison and make Figure 3 use the shared skinny purple figure border.

**Architecture:** Reuse the existing `images/editing-comparison.png` asset without pixel changes. Update the semantic figure markup and its static regression coverage; remove Figure 3's dark-frame modifier so the shared `.figure-link` presentation applies.

**Tech Stack:** Static HTML, CSS class composition, Node's built-in test runner.

---

### Task 1: Add regression coverage for both figure changes

**Files:**
- Modify: `tests/static-page.test.mjs`

- [ ] **Step 1: Update the generic Figure 4 expectations**

Change the required Figure 4 asset to `images/editing-comparison.png`, loop over numbered asset URLs for Figures 1–3, and add explicit Figure 4 assertions:

```js
const requiredFigures = [
  'images/figure-1-overview.png',
  'images/figure-2-method.png',
  'images/figure-3-comparison.png',
  'images/editing-comparison.png',
];

for (let number = 1; number <= 3; number += 1) {
  assert.match(html, new RegExp(`<a[^>]+data-paper-figure=["']${number}["'][^>]+href=["']images/figure-${number}-[^"']+\\.png["']`));
}
assert.match(html, /<a[^>]+data-paper-figure=["']4["'][^>]+href=["']images\/editing-comparison\.png["']/);
```

Use these source assertions in the main-flow test:

```js
for (let number = 1; number <= 3; number += 1) {
  assert.match(html, new RegExp(`src=["']images/figure-${number}-[^"']+\\.png["']`));
  assert.match(html, new RegExp(`Figure ${number}`));
}
assert.match(html, /src=["']images\/editing-comparison\.png["']/);
assert.match(html, /Figure 4b/);
```

- [ ] **Step 2: Add focused failing tests**

```js
test('shows only the localized editing comparison above the editing table', () => {
  const html = readPage();
  const figure = html.match(/<figure class="paper-figure">[\s\S]*?data-paper-figure="4"[\s\S]*?<\/figure>/)?.[0] ?? '';

  assert.match(figure, /href="images\/editing-comparison\.png"/);
  assert.match(figure, /src="images\/editing-comparison\.png"/);
  assert.match(figure, /width="2200" height="1096"/);
  assert.doesNotMatch(figure, /figure-4-editing\.png|Quantitative editing locality above/);
  assert.match(html, /data-table="editing"/);
  assert.equal((html.match(/data-editing-row/g) ?? []).length, 6);
});

test('uses the shared skinny border for Figure 3', () => {
  const html = readPage();
  const figureClass = html.match(/<figure class="([^"]*)">\s*<a[^>]+data-paper-figure="3"/)?.[1] ?? '';

  assert.equal(figureClass, 'paper-figure');
  assert.doesNotMatch(figureClass, /paper-figure-dark/);
});
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
node --test --test-name-pattern="localized editing comparison|skinny border" tests/static-page.test.mjs
```

Expected: both focused tests fail because Figure 4 still uses the full composite and Figure 3 still has `paper-figure-dark`.

### Task 2: Update the figure markup

**Files:**
- Modify: `index.html:172-180`
- Modify: `index.html:246-254`

- [ ] **Step 1: Normalize Figure 3's frame**

Change:

```html
<figure class="paper-figure paper-figure-dark">
```

to:

```html
<figure class="paper-figure">
```

- [ ] **Step 2: Swap Figure 4 to the panel-only asset**

Use this image/link metadata:

```html
<a class="figure-link" data-paper-figure="4" href="images/editing-comparison.png" target="_blank" rel="noopener" aria-label="Open the localized editing comparison at full resolution">
  <img class="paper-figure-image" src="images/editing-comparison.png" width="2200" height="1096" loading="lazy" alt="Localized part replacement comparison between Segmentation cLDM and AnaDiff across generated source brains, replacement part assets, and edited brains">
</a>
```

Use this caption:

```html
<figcaption>
  <span class="figure-label">Figure 4b</span>
  <div><h3>Localized part editing.</h3><p>Generated source brains, replacement part assets, and resulting edited brains are shown side by side for Segmentation cLDM and AnaDiff (Ours). Green boxes identify the replaced region across views.</p></div>
  <a class="full-resolution-link" href="images/editing-comparison.png" target="_blank" rel="noopener">Full resolution ↗</a>
</figcaption>
```

- [ ] **Step 3: Run the focused tests and verify GREEN**

Run:

```bash
node --test --test-name-pattern="localized editing comparison|skinny border" tests/static-page.test.mjs
```

Expected: 2 focused tests pass with zero failures.

### Task 3: Complete verification

**Files:**
- Verify: `index.html`
- Verify: `tests/static-page.test.mjs`

- [ ] **Step 1: Run the complete test suite**

Run:

```bash
node --test tests/*.test.mjs
```

Expected: all tests pass with zero failures.

- [ ] **Step 2: Inspect the exact panel-only asset**

Confirm `images/editing-comparison.png` contains the comparison columns without the Figure 4a table or Figure 4b title, and confirm `images/figure-3-comparison.png` remains unchanged.

## Repository note

This workspace is not a Git repository, so commit steps are intentionally omitted.
