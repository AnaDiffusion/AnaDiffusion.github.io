import { initSampleGallery } from './sample-gallery.mjs';

document.documentElement.classList.add('js');

const header = document.querySelector('[data-site-header]');
const navToggle = document.querySelector('[data-nav-toggle]');
const siteNav = document.querySelector('[data-site-nav]');
const copyButton = document.querySelector('[data-copy-bibtex]');
const copyStatus = document.querySelector('[data-copy-status]');
const bibtex = document.querySelector('#bibtex-code');

function updateHeader() {
  header?.classList.toggle('is-scrolled', window.scrollY > 18);
}

function closeNavigation() {
  navToggle?.setAttribute('aria-expanded', 'false');
  siteNav?.classList.remove('is-open');
}

async function copyBibtex() {
  const text = bibtex?.textContent?.trim();
  if (!text || !copyStatus) return;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(bibtex);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      selection.removeAllRanges();
    }
    copyStatus.textContent = 'Citation copied to your clipboard.';
    copyButton.textContent = 'Copied';
    window.setTimeout(() => {
      copyStatus.textContent = '';
      copyButton.textContent = 'Copy citation';
    }, 2400);
  } catch {
    copyStatus.textContent = 'Copy was unavailable. Select the citation text manually.';
  }
}

function initTitleAssembly(root) {
  const title = root.querySelector('[data-assemble-title]');
  if (!title) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const layers = title.querySelectorAll('.assemble-whole, .assemble-part, .assemble-seam, .assemble-cb');
  title.setAttribute('title', 'Replay the part-to-whole assembly');
  title.addEventListener('click', () => {
    for (const layer of layers) {
      layer.style.animation = 'none';
      void layer.offsetWidth;
      layer.style.animation = '';
    }
  });
}

function initAbstractMotion(root) {
  const video = root.querySelector('[data-abstract-motion]');
  if (!video) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const fallback = root.querySelector('[data-abstract-motion-fallback]');
  const usesWebKitMedia = /AppleWebKit/i.test(navigator.userAgent)
    && !/(Chrome|Chromium|Edg|OPR)/i.test(navigator.userAgent);
  if (fallback && usesWebKitMedia) {
    fallback.src = fallback.dataset.src;
    video.pause();
    video.hidden = true;
    fallback.hidden = false;
    return;
  }

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

navToggle?.addEventListener('click', () => {
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!expanded));
  siteNav?.classList.toggle('is-open', !expanded);
});

for (const link of siteNav?.querySelectorAll('a') ?? []) {
  link.addEventListener('click', closeNavigation);
}

window.addEventListener('scroll', updateHeader, { passive: true });
window.addEventListener('resize', () => {
  if (window.innerWidth > 820) closeNavigation();
}, { passive: true });
copyButton?.addEventListener('click', copyBibtex);
updateHeader();

try {
  initSampleGallery(document);
} catch (error) {
  console.warn('AnaDiffusion sample gallery fallback active.', error);
}

try {
  initTitleAssembly(document);
} catch (error) {
  console.warn('AnaDiffusion title assembly fallback active.', error);
}

try {
  initAbstractMotion(document);
} catch (error) {
  console.warn('AnaDiffusion Abstract motion fallback active.', error);
}
