# Partial Assembly Volumes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate reproducible left-only and left-plus-right colored RGB24 NIfTIs on the final assembled-world canvas without changing the webpage.

**Architecture:** Extend the existing assembly builder with validated anatomical-part filtering while preserving its current all-parts default. Exercise the Python API with `unittest`, then generate and validate the two requested binary assets against the same API.

**Tech Stack:** Python 3, `unittest`, nibabel, NumPy, NIfTI RGB24, Node.js static-page regression suite

---

### Task 1: Specify anatomical part selection

**Files:**
- Create: `tests/test_colored_assembly.py`
- Modify: `scripts/build-colored-assembly.py`

- [ ] **Step 1: Write the failing API tests**

Create `tests/test_colored_assembly.py` with tests that load the hyphenated builder module through `importlib.util`, call `build_assembly(part_names=("left",))` and `build_assembly(part_names=("left", "right"))`, and assert:

```python
left = builder.build_assembly(part_names=("left",))
hemispheres = builder.build_assembly(part_names=("left", "right"))
right = builder.build_assembly(part_names=("right",))
cb = builder.build_assembly(part_names=("cb",))

assert left.shape == (128, 128, 128)
assert hemispheres.shape == left.shape
assert np.array_equal(hemispheres.affine, left.affine)
assert np.any(rgb(left) > 0)
assert np.any(rgb(right) > 0)
assert np.any(rgb(cb) > 0)
assert np.all(rgb(hemispheres)[exclusive_cb_mask] == 0)
```

Also assert that `part_names=()` raises `ValueError` containing `at least one part` and that `part_names=("unknown",)` raises `ValueError` containing `unknown part`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
python3 -m unittest tests.test_colored_assembly -v
```

Expected: FAIL because `build_assembly` does not accept `part_names`.

- [ ] **Step 3: Implement validated part filtering**

Change each `PARTS` entry to include a stable identifier:

```python
PARTS = (
    ("left", "lhemi-sample-01.nii.gz", LEFT_COLOR, LEFT_OFFSET),
    ("right", "rhemi-sample-01.nii.gz", RIGHT_COLOR, RIGHT_OFFSET),
    ("cb", "cb-sample-01.nii.gz", CB_COLOR, CB_OFFSET),
)
```

Add:

```python
def select_parts(part_names: tuple[str, ...] | None = None) -> tuple:
    if part_names is None:
        return PARTS
    if not part_names:
        raise ValueError("select at least one part")
    unknown = set(part_names) - {part_id for part_id, *_ in PARTS}
    if unknown:
        raise ValueError(f"unknown part: {', '.join(sorted(unknown))}")
    selected = set(part_names)
    return tuple(part for part in PARTS if part[0] in selected)
```

Add `part_names` to `build_assembly`, assign `parts = select_parts(part_names)`, and use `parts` for loading, masking, and coloring. Preserve `None` as the all-parts default.

Add the CLI option and pass its parsed identifiers into the builder:

```python
parser.add_argument("--parts", default="left,right,cb")
part_names = tuple(name.strip() for name in args.parts.split(",") if name.strip())
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run:

```bash
python3 -m unittest tests.test_colored_assembly -v
```

Expected: all part-selection and validation tests pass.

### Task 2: Generate and validate the requested artifacts

**Files:**
- Create: `volumes/assembly-left-sample-01.nii.gz`
- Create: `volumes/assembly-hemispheres-sample-01.nii.gz`
- Modify: `tests/test_colored_assembly.py`

- [ ] **Step 1: Add failing artifact tests**

Add tests that load each requested output and compare it voxel-for-voxel with the corresponding API result:

```python
left_file = nib.load(VOLUME_DIR / "assembly-left-sample-01.nii.gz")
hemisphere_file = nib.load(VOLUME_DIR / "assembly-hemispheres-sample-01.nii.gz")

assert int(left_file.header["datatype"]) == 128
assert int(left_file.header["bitpix"]) == 24
assert np.array_equal(rgb(left_file), rgb(builder.build_assembly(part_names=("left",))))
assert np.array_equal(
    rgb(hemisphere_file),
    rgb(builder.build_assembly(part_names=("left", "right"))),
)
```

- [ ] **Step 2: Run the artifact tests and verify RED**

Run:

```bash
python3 -m unittest tests.test_colored_assembly -v
```

Expected: FAIL because both requested files are absent.

- [ ] **Step 3: Generate both NIfTIs**

Run:

```bash
python3 scripts/build-colored-assembly.py --parts left --output assembly-left-sample-01.nii.gz
python3 scripts/build-colored-assembly.py --parts left,right --output assembly-hemispheres-sample-01.nii.gz
```

- [ ] **Step 4: Run the artifact tests and verify GREEN**

Run:

```bash
python3 -m unittest tests.test_colored_assembly -v
```

Expected: all API and artifact tests pass.

### Task 3: Regression verification and local commit

**Files:**
- Verify: `scripts/build-colored-assembly.py`
- Verify: `tests/test_colored_assembly.py`
- Verify: `volumes/assembly-left-sample-01.nii.gz`
- Verify: `volumes/assembly-hemispheres-sample-01.nii.gz`
- Verify unchanged: `index.html`
- Verify unchanged: `assets/js/volume-viewer.mjs`

- [ ] **Step 1: Verify the existing full assembly default**

Run an in-memory comparison:

```bash
python3 -c 'import runpy, nibabel as nib, numpy as np; ns=runpy.run_path("scripts/build-colored-assembly.py"); expected=ns["build_assembly"](); actual=nib.load("volumes/assembly-parts-sample-01.nii.gz"); assert np.array_equal(np.asanyarray(expected.dataobj), np.asanyarray(actual.dataobj))'
```

Expected: exit code 0.

- [ ] **Step 2: Run every automated test**

Run:

```bash
python3 -m unittest tests.test_colored_assembly -v
node --test tests/*.test.mjs
git diff --check
```

Expected: all tests pass and the diff check is clean.

- [ ] **Step 3: Confirm webpage sources are untouched**

Run:

```bash
git diff --exit-code HEAD -- index.html assets/js/volume-viewer.mjs
```

Expected: exit code 0 with no output.

- [ ] **Step 4: Commit the implementation locally**

```bash
git add scripts/build-colored-assembly.py tests/test_colored_assembly.py volumes/assembly-left-sample-01.nii.gz volumes/assembly-hemispheres-sample-01.nii.gz docs/superpowers/plans/2026-08-23-partial-assembly-volumes.md
git commit -m "Add partial assembly volumes"
```

Do not push; publishing remains a separate user decision.
