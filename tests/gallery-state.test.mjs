import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createGalleryState,
  formatGalleryStatus,
  moveGallery,
  selectGalleryIndex,
} from '../assets/js/gallery-state.mjs';

test('creates a stable ten-sample gallery state', () => {
  assert.deepEqual(createGalleryState(10), { index: 0, count: 10 });
});

test('moves forward and backward without mutating state', () => {
  const initial = createGalleryState(10);
  const forward = moveGallery(initial, 1);

  assert.deepEqual(forward, { index: 1, count: 10 });
  assert.deepEqual(moveGallery(forward, -1), initial);
  assert.deepEqual(initial, { index: 0, count: 10 });
});

test('clamps movement at both rail boundaries', () => {
  assert.deepEqual(moveGallery(createGalleryState(10), -1), { index: 0, count: 10 });
  assert.deepEqual(moveGallery({ index: 9, count: 10 }, 1), { index: 9, count: 10 });
});

test('selects a valid visible sample and rejects invalid indexes', () => {
  const initial = createGalleryState(10);

  assert.deepEqual(selectGalleryIndex(initial, 6), { index: 6, count: 10 });
  assert.equal(selectGalleryIndex(initial, -1), initial);
  assert.equal(selectGalleryIndex(initial, 10), initial);
  assert.equal(selectGalleryIndex(initial, Number.NaN), initial);
});

test('formats the one-based accessible progress label', () => {
  assert.equal(formatGalleryStatus({ index: 0, count: 10 }), 'Sample 1 of 10');
  assert.equal(formatGalleryStatus({ index: 9, count: 10 }), 'Sample 10 of 10');
});
