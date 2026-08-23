import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createBrainModel,
  projectPoint,
  rotatePoint,
  sortByDepth,
} from '../assets/js/anatomy-model.mjs';

const round = (value) => Math.round(value * 1e6) / 1e6;

test('creates the requested deterministic point density for every part', () => {
  const model = createBrainModel({ seed: 23, density: 120 });

  assert.equal(model.left.length, 120);
  assert.equal(model.right.length, 120);
  assert.equal(model.cb.length, 72);
});

test('repeats exactly for the same seed', () => {
  assert.deepEqual(
    createBrainModel({ seed: 23, density: 12 }),
    createBrainModel({ seed: 23, density: 12 }),
  );
});

test('changes the generated surface when the seed changes', () => {
  assert.notDeepEqual(
    createBrainModel({ seed: 23, density: 12 }),
    createBrainModel({ seed: 24, density: 12 }),
  );
});

test('rotates a point around the vertical axis', () => {
  const rotated = rotatePoint([1, 0, 0], { x: 0, y: Math.PI / 2 }).map(round);

  assert.deepEqual(rotated, [0, 0, -1]);
});

test('projects a finite point into a finite canvas coordinate', () => {
  const projected = projectPoint([0.2, 0.1, 1], 800, 600);

  assert.equal(Number.isFinite(projected.x), true);
  assert.equal(Number.isFinite(projected.y), true);
  assert.equal(projected.scale > 0, true);
});

test('sorts projected points from farthest to nearest', () => {
  const points = [{ depth: 2 }, { depth: -1 }, { depth: 0.5 }];

  assert.deepEqual(sortByDepth(points).map((point) => point.depth), [-1, 0.5, 2]);
  assert.deepEqual(points.map((point) => point.depth), [2, -1, 0.5]);
});
