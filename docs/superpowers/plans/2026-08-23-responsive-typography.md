# Responsive Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase overall text readability and enlarge the animated title while keeping both fluidly fitted to desktop and mobile screens.

**Architecture:** Use one fluid root font-size so existing rem-based components scale together. Give the animated wordmark a viewport-relative size with a hard desktop cap, and remove the two fixed narrow-screen overrides that would defeat the fluid system.

**Tech Stack:** CSS, Node.js built-in test runner

---

### Task 1: Implement fluid page typography

**Files:**
- Modify: `tests/static-page.test.mjs:215-239`
- Modify: `assets/css/main.css:56-64`
- Modify: `assets/css/main.css:167-170`
- Modify: `assets/css/main.css:581-602`

- [ ] **Step 1: Update the regression test first**

Replace the fixed desktop and mobile font assertions in `implements a readable evidence-first responsive design system` with:

```js
assert.match(css, /body\s*\{[^}]*font-size:\s*clamp\(19px,\s*calc\(17px \+ 0\.25vw\),\s*21px\)[^}]*line-height:\s*1\.65/s);
assert.match(css, /\.assemble-title\s*\{[^}]*font-size:\s*min\(13\.5vw,\s*128px\)/s);
assert.doesNotMatch(css, /body\s*\{\s*font-size:\s*18px;\s*\}/);
assert.doesNotMatch(css, /\.assemble-title\s*\{\s*font-size:\s*3\.2rem;\s*\}/);
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
node --test --test-name-pattern="implements a readable evidence-first responsive design system" tests/static-page.test.mjs
```

Expected: FAIL because the stylesheet still uses 19px, 1.7, the old title clamp, and the two fixed mobile overrides.

- [ ] **Step 3: Implement the fluid typography**

Change the body typography to:

```css
font-size: clamp(19px, calc(17px + 0.25vw), 21px);
line-height: 1.65;
```

Change the animated title size to:

```css
font-size: min(13.5vw, 128px);
```

Remove these obsolete declarations while keeping their surrounding media queries and other rules:

```css
body { font-size: 18px; }
.assemble-title { font-size: 3.2rem; }
```

- [ ] **Step 4: Run focused and full verification**

Run:

```bash
node --test --test-name-pattern="implements a readable evidence-first responsive design system" tests/static-page.test.mjs
node --test tests/*.test.mjs
git diff --check
```

Expected: the focused test passes, all 51 tests pass, and the diff check reports no errors.

- [ ] **Step 5: Commit the implementation**

```bash
git add assets/css/main.css tests/static-page.test.mjs
git commit -m "Improve responsive page typography"
```
