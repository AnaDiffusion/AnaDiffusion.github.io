# AnaDiffusion Favicon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the PHAI browser icon with a text-free AnaDiffusion spectrum mark.

**Architecture:** Create one deterministic SVG master and derive a 256 × 256 PNG fallback from it. Declare both in the document head with cache keys, then verify their structure, dimensions, rendering, and page references.

**Tech Stack:** Static HTML, SVG, PNG, macOS `sips`, Node.js built-in test runner

---

### Task 1: Specify the AnaDiffusion favicon contract

**Files:**
- Modify: `tests/static-page.test.mjs`

- [ ] **Step 1: Write the failing test**

Add SVG and PNG paths near the test constants and add this test:

```js
test('uses the AnaDiffusion spectrum favicon instead of the PHAI logo', () => {
  const html = readPage();
  const svg = readFileSync(faviconSvgPath, 'utf8');
  const png = readFileSync(faviconPngPath);

  assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="images\/favicon\.svg\?v=20260824-1">/);
  assert.match(html, /<link rel="icon" type="image\/png" sizes="256x256" href="images\/favicon\.png\?v=20260824-1">/);
  assert.match(svg, /viewBox="0 0 256 256"/);
  assert.match(svg, /#9b7fd4/i);
  assert.match(svg, /#f0d78a/i);
  assert.match(svg, /#a4cf94/i);
  assert.doesNotMatch(svg, /PHAI|#2d4f73/i);
  assert.equal(png.readUInt32BE(16), 256);
  assert.equal(png.readUInt32BE(20), 256);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --test-name-pattern="AnaDiffusion spectrum favicon" tests/static-page.test.mjs
```

Expected: failure because `images/favicon.svg` and the new HTML declarations do not exist.

### Task 2: Create and connect the favicon assets

**Files:**
- Create: `images/favicon.svg`
- Replace: `images/favicon.png`
- Modify: `index.html`

- [ ] **Step 1: Create the SVG master**

Create `images/favicon.svg` with this deterministic artwork:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="AnaDiffusion spectrum mark">
  <defs>
    <clipPath id="rounded"><rect x="14" y="14" width="228" height="228" rx="54"/></clipPath>
    <radialGradient id="violet" cx="0" cy="1" r="1">
      <stop offset="0" stop-color="#8667c8"/>
      <stop offset=".72" stop-color="#9b7fd4" stop-opacity=".62"/>
      <stop offset="1" stop-color="#9b7fd4" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="gold" cx="1" cy="0" r="1">
      <stop offset="0" stop-color="#f3db82"/>
      <stop offset=".72" stop-color="#f0d78a" stop-opacity=".7"/>
      <stop offset="1" stop-color="#f0d78a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="green" cx="1" cy="1" r="1">
      <stop offset="0" stop-color="#8fbe81"/>
      <stop offset=".72" stop-color="#a4cf94" stop-opacity=".76"/>
      <stop offset="1" stop-color="#a4cf94" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow" cx=".5" cy=".5" r=".66">
      <stop offset="0" stop-color="#fff" stop-opacity=".22"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g clip-path="url(#rounded)">
    <rect x="14" y="14" width="228" height="228" fill="#c9b8ea"/>
    <rect x="14" y="14" width="228" height="228" fill="url(#violet)"/>
    <rect x="14" y="14" width="228" height="228" fill="url(#gold)"/>
    <rect x="14" y="14" width="228" height="228" fill="url(#green)"/>
    <rect x="14" y="14" width="228" height="228" fill="url(#glow)"/>
  </g>
  <rect x="9" y="9" width="238" height="238" rx="59" fill="none" stroke="#fff" stroke-opacity=".86" stroke-width="8"/>
</svg>
```

- [ ] **Step 2: Render the PNG fallback**

Run:

```bash
sips -s format png images/favicon.svg --out images/favicon.png
```

Expected: `images/favicon.png` is a 256 × 256 RGBA PNG.

- [ ] **Step 3: Update the document head**

Replace the existing favicon declaration with:

```html
<link rel="icon" type="image/svg+xml" href="images/favicon.svg?v=20260824-1">
<link rel="icon" type="image/png" sizes="256x256" href="images/favicon.png?v=20260824-1">
```

- [ ] **Step 4: Run the full verification suite**

Run:

```bash
node --test tests/*.test.mjs
git diff --check
file images/favicon.png
```

Expected: 57 tests pass, zero failures, no whitespace errors, and the PNG reports 256 × 256 RGBA.

- [ ] **Step 5: Inspect full-size and tab-size renders**

Run:

```bash
sips -Z 32 images/favicon.png --out /tmp/anadiffusion-favicon-32.png
```

Inspect `images/favicon.png` and `/tmp/anadiffusion-favicon-32.png`; both must show the rounded spectrum mark without text.

- [ ] **Step 6: Commit**

```bash
git add images/favicon.svg images/favicon.png index.html tests/static-page.test.mjs
git commit -m "Replace PHAI favicon"
```

### Task 3: Integrate and publish

**Files:**
- No additional file changes

- [ ] **Step 1: Fast-forward the feature branch into local `main`**

Run:

```bash
git merge --ff-only feature/anadiffusion-favicon
```

- [ ] **Step 2: Re-run the full suite and localhost checks on `main`**

Run:

```bash
node --test tests/*.test.mjs
curl --fail --silent http://127.0.0.1:8765/ | rg 'favicon\.(svg|png)\?v=20260824-1'
```

Expected: 57 tests pass and both favicon declarations are served.

- [ ] **Step 3: Push `main`**

Run:

```bash
git push origin main
```

Expected: `main` updates successfully on `https://github.com/AnaDiffusion/AnaDiffusion.github.io.git`.
