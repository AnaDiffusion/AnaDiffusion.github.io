# Abstract Assembly Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved transparent continuous brain-assembly animation as a subtle, responsive, motion-accessible background behind the existing Abstract section.

**Architecture:** The Abstract section receives one decorative, absolutely positioned `<video>` layer beneath its unchanged reading shell. Existing site CSS controls clipping, stacking, placement, and 10%/7% opacity, while a focused initializer in `site.mjs` plays only when the section is visible and leaves the poster static for reduced-motion users.

**Tech Stack:** Static HTML, CSS, browser-native `<video>`, `IntersectionObserver`, Node's built-in test runner, local HTTP browser QA.

---

## File structure

- `index.html`: declare the decorative media layer and cache-bust the updated CSS and site module.
- `assets/css/main.css`: contain, position, fade, and responsively shift the media beneath Abstract content.
- `assets/js/site.mjs`: initialize visibility-aware playback with reduced-motion and unsupported-observer fallbacks.
- `tests/static-page.test.mjs`: enforce asset existence, accessible markup, styling, playback behavior, unchanged copy, and cache-busting.

No new runtime module is needed because playback is a small page-level progressive enhancement and `site.mjs` already owns similar motion initialization.

### Task 1: Add a failing contract for the Abstract background

**Files:**
- Modify: `tests/static-page.test.mjs:8-15`
- Modify: `tests/static-page.test.mjs:73-86`
- Modify: `tests/static-page.test.mjs:316-332`
- Modify: `tests/static-page.test.mjs:416-425`

- [ ] **Step 1: Add paths for the site module and continuous animation**

Add beside the existing path constants:

```js
const siteModulePath = resolve(pageRoot, 'assets/js/site.mjs');
const continuousAssemblyPath = resolve(pageRoot, 'media/anadiffusion-assembly-transparent-continuous.webm');
```

- [ ] **Step 2: Add the failing Abstract-background test**

Insert after `uses the concise requested TLDR`:

```js
test('uses the continuous assembly as a quiet accessible Abstract background', () => {
  const html = readPage();
  const css = readFileSync(cssPath, 'utf8');
  const siteModule = readFileSync(siteModulePath, 'utf8');
  const abstract = html.match(/<section class="paper-section abstract-section"[\s\S]*?<\/section>/)?.[0] ?? '';

  assert.equal(existsSync(continuousAssemblyPath), true, 'Missing continuous transparent assembly animation');
  assert.match(abstract, /<div class="abstract-motion" aria-hidden="true">/);
  assert.match(
    abstract,
    /<video\s+data-abstract-motion\s+muted\s+loop\s+playsinline\s+preload="metadata"\s+poster="media\/anadiffusion-assembly-transparent-poster\.png"\s+tabindex="-1">/,
  );
  assert.match(
    abstract,
    /<source src="media\/anadiffusion-assembly-transparent-continuous\.webm\?v=20260824-1" type="video\/webm">/,
  );
  assert.doesNotMatch(abstract, /\b(?:autoplay|controls)\b/);

  assert.match(css, /\.abstract-section\s*\{[^}]*position:\s*relative[^}]*isolation:\s*isolate[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.abstract-motion\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0[^}]*pointer-events:\s*none[^}]*z-index:\s*0/s);
  assert.match(css, /\.abstract-motion video\s*\{[^}]*opacity:\s*\.1[^}]*transform:\s*translateX\(18%\)/s);
  assert.match(css, /@media \(max-width:\s*720px\)[\s\S]*\.abstract-motion video\s*\{[^}]*opacity:\s*\.07[^}]*transform:\s*translateX\(28%\)/);
  assert.match(css, /\.abstract-section > \.reading-shell\s*\{[^}]*z-index:\s*1/s);

  assert.match(siteModule, /function initAbstractMotion\(root\)/);
  assert.match(siteModule, /prefers-reduced-motion:\s*reduce/);
  assert.match(siteModule, /new IntersectionObserver/);
  assert.match(siteModule, /video\.play\(\)/);
  assert.match(siteModule, /video\.pause\(\)/);
  assert.match(siteModule, /initAbstractMotion\(document\)/);
});
```

- [ ] **Step 3: Update existing module and cache-busting expectations**

In `loads complete progressive-enhancement modules`, reuse `siteModulePath` and allow the versioned script:

```js
  const siteModule = readFileSync(siteModulePath, 'utf8');
  assert.match(siteModule, /initSampleGallery/);
  assert.doesNotMatch(siteModule, /initAnatomyExplorer|initFigureDialogs|showModal|data-figure-open/);
  assert.match(html, /<script\s+type=["']module["']\s+src=["']assets\/js\/site\.mjs\?v=20260824-1["']/);
```

Replace the stylesheet cache-busting expectation with:

```js
  assert.match(
    html,
    /<link\s+rel=["']stylesheet["']\s+href=["']assets\/css\/main\.css\?v=20260824-1["']>/,
  );
```

- [ ] **Step 4: Run the targeted tests and verify the new contract fails**

Run:

```bash
node --test --test-name-pattern="Abstract background|progressive-enhancement|cache-busts the stylesheet" tests/static-page.test.mjs
```

Expected: FAIL because the Abstract video markup, styling, playback initializer, and new cache versions do not exist yet.

### Task 2: Implement the decorative media layer and responsive styling

**Files:**
- Modify: `index.html:22`
- Modify: `index.html:96-97`
- Modify: `index.html:364`
- Modify: `assets/css/main.css:286-294`
- Test: `tests/static-page.test.mjs`

- [ ] **Step 1: Add the video before the Abstract reading shell**

Change the Abstract opening to:

```html
      <section class="paper-section abstract-section" aria-labelledby="abstract-title">
        <div class="abstract-motion" aria-hidden="true">
          <video data-abstract-motion muted loop playsinline preload="metadata" poster="media/anadiffusion-assembly-transparent-poster.png" tabindex="-1">
            <source src="media/anadiffusion-assembly-transparent-continuous.webm?v=20260824-1" type="video/webm">
          </video>
        </div>
        <div class="reading-shell">
```

Do not modify the heading, TL;DR, lead paragraph, or four contribution items.

- [ ] **Step 2: Add the desktop background treatment**

Replace the Abstract section positioning rules with:

```css
.abstract-section { position: relative; isolation: isolate; background: var(--surface-alt); overflow: hidden; }
.abstract-section::before {
  content: ""; position: absolute; z-index: 0; top: -140px; right: -120px; width: 460px; height: 460px; border-radius: 50%;
  background: radial-gradient(circle, rgba(132,181,120,.2), transparent 68%); pointer-events: none;
}
.abstract-motion {
  position: absolute; inset: 0; z-index: 0; display: grid; place-items: center;
  overflow: hidden; pointer-events: none;
}
.abstract-motion video {
  display: block; width: min(1100px, 78vw); max-width: none; height: auto;
  opacity: .1; transform: translateX(18%); filter: saturate(.9);
}
.abstract-section h2 { max-width: 760px; }
.abstract-section > .reading-shell { position: relative; z-index: 1; }
```

- [ ] **Step 3: Add the mobile placement inside the existing 720px media query**

Add:

```css
  .abstract-motion video { width: 165vw; opacity: .07; transform: translateX(28%); }
```

This intentionally enlarges and shifts the transparent media while the section clips it, preventing a tiny full-frame animation from becoming visual noise on narrow screens.

- [ ] **Step 4: Cache-bust the changed CSS and site module**

Update the references in `index.html`:

```html
    <link rel="stylesheet" href="assets/css/main.css?v=20260824-1">
```

```html
    <script type="module" src="assets/js/site.mjs?v=20260824-1"></script>
```

- [ ] **Step 5: Run the markup and CSS contract while leaving playback assertions red**

Run:

```bash
node --test --test-name-pattern="Abstract background|progressive-enhancement|cache-busts the stylesheet|abstract contributions|TLDR" tests/static-page.test.mjs
```

Expected: the playback initializer assertions remain FAIL; markup, styling, unchanged Abstract copy, and cache-busting assertions PASS.

### Task 3: Add visibility-aware, reduced-motion-safe playback

**Files:**
- Modify: `assets/js/site.mjs:45-57`
- Modify: `assets/js/site.mjs:78-88`
- Test: `tests/static-page.test.mjs`

- [ ] **Step 1: Add the focused initializer after `initTitleAssembly`**

```js
function initAbstractMotion(root) {
  const video = root.querySelector('[data-abstract-motion]');
  if (!video) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const section = video.closest('.abstract-section');
  const play = () => {
    const playback = video.play();
    playback?.catch(() => {});
  };

  if (!section || !('IntersectionObserver' in window)) {
    play();
    return;
  }

  const observer = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) {
      play();
    } else {
      video.pause();
    }
  }, { threshold: 0.05 });

  observer.observe(section);
}
```

- [ ] **Step 2: Initialize the feature with the existing fault-isolation pattern**

Append after title assembly initialization:

```js
try {
  initAbstractMotion(document);
} catch (error) {
  console.warn('AnaDiffusion Abstract motion fallback active.', error);
}
```

- [ ] **Step 3: Run all frontend tests**

Run:

```bash
node --test tests/*.test.mjs
```

Expected: PASS, 56 tests and 0 failures.

- [ ] **Step 4: Check source formatting and diff scope**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only `index.html`, `assets/css/main.css`, `assets/js/site.mjs`, and `tests/static-page.test.mjs` are modified, while the plan file is new.

- [ ] **Step 5: Commit the tested implementation**

```bash
git add index.html assets/css/main.css assets/js/site.mjs tests/static-page.test.mjs docs/superpowers/plans/2026-08-24-abstract-assembly-background.md
git commit -m "Add abstract assembly background"
```

### Task 4: Verify desktop, mobile, and motion behavior in a browser

**Files:**
- Verify: `index.html`
- Verify: `assets/css/main.css`
- Verify: `assets/js/site.mjs`

- [ ] **Step 1: Start the static site**

Run:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Expected: the server reports it is serving on `http://127.0.0.1:8765/`.

- [ ] **Step 2: Inspect the Abstract section at desktop width**

Open `http://127.0.0.1:8765/#overview`, scroll to the Abstract section, and verify:

- the assembly is visible as a low-contrast background without a rectangular fill;
- heading, TL;DR, lead, and all four bullets remain immediately legible;
- text selection and scrolling are unobstructed;
- no media controls or extra labels appear;
- the page has no horizontal overflow.

- [ ] **Step 3: Inspect at a representative mobile width**

Resize to approximately `390 × 844`, return to the Abstract section, and verify that the brain stays subtly visible at 7% opacity, the single-column bullets remain unchanged, and there is no horizontal page overflow.

- [ ] **Step 4: Verify viewport playback and reduced-motion fallback**

Confirm the video plays while the Abstract section is visible and pauses after scrolling it fully off-screen. Emulate `prefers-reduced-motion: reduce`, reload, and confirm the poster remains static while all content remains readable.

- [ ] **Step 5: Re-run the automated frontend suite after browser QA**

Run:

```bash
node --test tests/*.test.mjs
```

Expected: PASS, 56 tests and 0 failures.

## Baseline note

Before implementation, all 55 frontend tests passed. The independent Python NIfTI-rendering suite could not import because the current shell lacks `nibabel`; this feature does not modify Python, NIfTI, renderer, or animation-generation sources, so its verification boundary is the complete frontend suite plus browser QA.
