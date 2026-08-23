# Colored Assembly Only Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display only the three colored anatomical parts in the assembled viewer without crosshairs, orientation labels, or a gray whole-brain underlay.

**Architecture:** Keep NiiVue as the renderer and make the change at its supported configuration and volume-loading boundaries. A source-level regression test protects the exact viewer configuration without introducing DOM/WebGL mocks.

**Tech Stack:** Browser ES modules, NiiVue WebGL2, Node.js built-in test runner

---

### Task 1: Add the viewer regression test

**Files:**
- Modify: `tests/static-page.test.mjs`
- Test: `tests/static-page.test.mjs`

- [ ] **Step 1: Write the failing test**

Add a test that reads `assets/js/volume-viewer.mjs`, asserts `crosshairWidth: 0`, `show3Dcrosshair: false`, and `isOrientationTextVisible: false`, extracts the `assemble` branch, expects the three colored part URLs, and rejects `VOLUMES.whole.url` in that branch.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test --test-name-pattern="renders the assembly without viewer overlays" tests/static-page.test.mjs`

Expected: FAIL because the current viewer enables the 3D crosshair, leaves the 2D width at its default, shows orientation text, and loads the gray whole-brain volume in the assembly branch.

### Task 2: Configure the overlay-free colored assembly

**Files:**
- Modify: `assets/js/volume-viewer.mjs`
- Test: `tests/static-page.test.mjs`

- [ ] **Step 1: Hide renderer chrome**

Set these NiiVue constructor options:

```js
crosshairWidth: 0,
show3Dcrosshair: false,
isOrientationTextVisible: false,
```

- [ ] **Step 2: Load only the colored parts for assembly**

Replace the assembly volume list with:

```js
[
  { url: VOLUMES.lhemi.url, colormap: 'anaLavender', opacity: 0.9 },
  { url: VOLUMES.rhemi.url, colormap: 'anaGreen', opacity: 0.9 },
  { url: VOLUMES.cb.url, colormap: 'anaButter', opacity: 0.95 },
]
```

Apply `hideBackground` to every loaded assembly volume rather than starting at index one.

- [ ] **Step 3: Run the focused test and verify it passes**

Run: `node --test --test-name-pattern="renders the assembly without viewer overlays" tests/static-page.test.mjs`

Expected: PASS.

### Task 3: Verify the complete result

**Files:**
- Verify: `assets/js/volume-viewer.mjs`
- Verify: `tests/static-page.test.mjs`

- [ ] **Step 1: Run the complete automated suite**

Run: `node --test tests/*.test.mjs`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Inspect the rendered assembly**

Serve the workspace over HTTP, open the page, select **Assemble parts**, and confirm that only lavender, green, and butter anatomy appears on the dark canvas with no purple guides, orientation letters, or gray anatomical underlay.
