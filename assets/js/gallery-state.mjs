function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function createGalleryState(count) {
  const safeCount = Number.isInteger(count) && count > 0 ? count : 1;
  return { index: 0, count: safeCount };
}

export function moveGallery(state, delta) {
  if (!Number.isFinite(delta)) return state;
  const index = clamp(state.index + Math.trunc(delta), 0, state.count - 1);
  return index === state.index ? { ...state } : { ...state, index };
}

export function selectGalleryIndex(state, index) {
  if (!Number.isInteger(index) || index < 0 || index >= state.count) return state;
  return index === state.index ? { ...state } : { ...state, index };
}

export function formatGalleryStatus(state) {
  return `Sample ${state.index + 1} of ${state.count}`;
}
