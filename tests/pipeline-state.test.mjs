import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PART_IDS,
  STAGE_IDS,
  createInitialState,
  getStageTransform,
  reduceExplorerState,
} from '../assets/js/pipeline-state.mjs';

test('exposes the four method stages in narrative order', () => {
  assert.deepEqual(STAGE_IDS, ['parts', 'scaffold', 'inject', 'refine']);
});

test('exposes the three anatomical part identifiers', () => {
  assert.deepEqual(PART_IDS, ['left', 'right', 'cb']);
});

test('creates the stable initial explorer state', () => {
  assert.deepEqual(createInitialState(), {
    stage: 'parts',
    visible: { left: true, right: true, cb: true },
    rotation: { x: -0.12, y: 0.36 },
    autoRotate: true,
  });
});

test('selects a valid method stage without mutating the current state', () => {
  const initial = createInitialState();
  const next = reduceExplorerState(initial, { type: 'select-stage', stage: 'refine' });

  assert.equal(next.stage, 'refine');
  assert.equal(initial.stage, 'parts');
});

test('ignores an unknown method stage', () => {
  const initial = createInitialState();

  assert.equal(reduceExplorerState(initial, { type: 'select-stage', stage: 'unknown' }), initial);
});

test('toggles one anatomical part without changing the others', () => {
  const next = reduceExplorerState(createInitialState(), { type: 'toggle-part', part: 'left' });

  assert.deepEqual(next.visible, { left: false, right: true, cb: true });
});

test('updates rotation by a pointer or keyboard delta', () => {
  const next = reduceExplorerState(createInitialState(), { type: 'rotate', dx: 0.2, dy: -0.1 });

  assert.deepEqual(next.rotation, { x: -0.22, y: 0.56 });
  assert.equal(next.autoRotate, false);
});

test('resets every interaction value', () => {
  const changed = {
    stage: 'inject',
    visible: { left: false, right: true, cb: false },
    rotation: { x: 1, y: 2 },
    autoRotate: false,
  };

  assert.deepEqual(reduceExplorerState(changed, { type: 'reset' }), createInitialState());
});

test('returns stage-specific part transforms', () => {
  assert.deepEqual(getStageTransform('parts', 'left').offset, [-1.05, 0.08, 0]);
  assert.deepEqual(getStageTransform('scaffold', 'left').offset, [-0.38, 0, 0]);
  assert.equal(getStageTransform('inject', 'cb').pulse, true);
  assert.equal(getStageTransform('refine', 'right').opacity, 0.92);
});
