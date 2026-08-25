# Canonical arXiv Paper Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the bundled `paper.pdf` and direct every paper action to `https://arxiv.org/pdf/2608.23014`.

**Architecture:** Keep paper navigation entirely in static HTML. Replace the local-asset integrity test with a link-contract test that requires four canonical external links and guarantees the local PDF cannot return unnoticed.

**Tech Stack:** Static HTML, Node.js built-in test runner, Git.

---

### Task 1: Define the canonical paper-link contract

**Files:**
- Modify: `tests/static-page.test.mjs:1-180`

- [ ] **Step 1: Replace the PDF checksum test while retaining the shared crypto import used by Figure 1 verification**

```js
test('routes every paper action to the canonical arXiv PDF without bundling a local paper', () => {
  const html = readPage();
  const paperLinks = [...html.matchAll(/<a\b[^>]*href="https:\/\/arxiv\.org\/pdf\/2608\.23014"[^>]*>/g)];

  assert.equal(paperLinks.length, 4);
  for (const [link] of paperLinks) {
    assert.match(link, /target="_blank"/);
    assert.match(link, /rel="noopener"/);
  }
  assert.doesNotMatch(html, /paper\.pdf/);
  assert.equal(existsSync(resolve(pageRoot, 'paper.pdf')), false);
});
```

- [ ] **Step 2: Update the existing destination test**

```js
assert.match(html, /https:\/\/arxiv\.org\/pdf\/2608\.23014/);
assert.doesNotMatch(html, /href=["']paper\.pdf["']/);
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run: `node --test --test-name-pattern='canonical arXiv|supplied paper' tests/static-page.test.mjs`

Expected: FAIL because the HTML still links `paper.pdf` and the local PDF still exists.

### Task 2: Replace live links and remove the bundled PDF

**Files:**
- Modify: `index.html:41,66,343,365`
- Delete: `paper.pdf`

- [ ] **Step 1: Replace all four paper anchors**

Use this exact attribute contract for each navigation, hero, citation, and footer paper link:

```html
href="https://arxiv.org/pdf/2608.23014" target="_blank" rel="noopener"
```

- [ ] **Step 2: Remove the bundled paper**

Run: `git rm paper.pdf`

Expected: `paper.pdf` is staged for deletion.

- [ ] **Step 3: Run the focused tests and verify GREEN**

Run: `node --test --test-name-pattern='canonical arXiv|supplied paper' tests/static-page.test.mjs`

Expected: both focused tests pass.

### Task 3: Verify and commit

**Files:**
- Verify: `index.html`
- Verify: `tests/static-page.test.mjs`
- Verify absent: `paper.pdf`

- [ ] **Step 1: Verify source and repository state**

Run: `rg -n 'paper\.pdf' index.html || true`

Expected: no matches.

Run: `test "$(rg -o 'https://arxiv.org/pdf/2608.23014' index.html | wc -l | tr -d ' ')" = 4`

Expected: exit 0.

- [ ] **Step 2: Run the full static test suite**

Run: `node --test tests/*.test.mjs`

Expected: 57 tests pass, 0 fail.

- [ ] **Step 3: Check patch hygiene**

Run: `git diff --check && git status --short && git diff --stat`

Expected: only `index.html`, `tests/static-page.test.mjs`, `paper.pdf`, and this plan are changed.

- [ ] **Step 4: Commit**

```bash
git add index.html tests/static-page.test.mjs docs/superpowers/plans/2026-08-24-arxiv-paper-links.md
git commit -m "Link paper actions to arXiv"
```
