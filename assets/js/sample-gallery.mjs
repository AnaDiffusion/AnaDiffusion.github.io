import {
  createGalleryState,
  formatGalleryStatus,
  moveGallery,
  selectGalleryIndex,
} from './gallery-state.mjs';

export function initSampleGallery(root = document) {
  const gallery = root.querySelector('[data-sample-gallery]');
  const rail = gallery?.querySelector('[data-sample-rail]');
  const cards = [...(gallery?.querySelectorAll('[data-sample-card]') ?? [])];
  const previous = gallery?.querySelector('[data-gallery-previous]');
  const next = gallery?.querySelector('[data-gallery-next]');
  const status = root.querySelector('[data-gallery-status]');

  if (!gallery || !rail || cards.length === 0 || !previous || !next || !status) {
    throw new Error('Sample gallery markup is incomplete.');
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let state = createGalleryState(cards.length);
  let frame = 0;

  function render() {
    status.textContent = formatGalleryStatus(state);
    previous.disabled = state.index === 0;
    next.disabled = state.index === state.count - 1;
    cards.forEach((card, index) => {
      if (index === state.index) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
    });
  }

  function scrollToState() {
    cards[state.index]?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'start',
    });
  }

  function move(delta) {
    state = moveGallery(state, delta);
    render();
    scrollToState();
  }

  function selectNearestCard() {
    frame = 0;
    const railLeft = rail.getBoundingClientRect().left;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - railLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    state = selectGalleryIndex(state, nearestIndex);
    render();
  }

  function onScroll() {
    if (frame) return;
    frame = window.requestAnimationFrame(selectNearestCard);
  }

  function onKeyDown(event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  }

  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  rail.addEventListener('scroll', onScroll, { passive: true });
  rail.addEventListener('keydown', onKeyDown);
  render();
  document.documentElement.classList.add('gallery-ready');

  return () => {
    if (frame) window.cancelAnimationFrame(frame);
    rail.removeEventListener('scroll', onScroll);
    rail.removeEventListener('keydown', onKeyDown);
  };
}
