// Interactive 3D volume viewer for the AnaDiffusion generated parts + whole brain.
// Built on NiiVue (WebGL2), loaded lazily from a CDN only when the viewer nears the
// viewport. The <canvas> is created here in JS on purpose, so the static HTML stays
// canvas-free (progressive enhancement + test compatibility).
// Self-contained NiiVue UMD bundle, vendored locally → offline + one request (no CDN waterfall).
const NIIVUE_URL = new URL('./vendor/niivue.umd.js', import.meta.url).href;

function loadNiivue() {
  if (window.niivue?.Niivue) return Promise.resolve(window.niivue.Niivue);
  return new Promise((resolve, reject) => {
    let sc = document.querySelector('script[data-niivue]');
    if (!sc) {
      sc = document.createElement('script');
      sc.src = NIIVUE_URL; sc.async = true; sc.dataset.niivue = '1';
      document.head.appendChild(sc);
    }
    sc.addEventListener('load', () => resolve(window.niivue?.Niivue));
    sc.addEventListener('error', () => reject(new Error('Failed to load the local NiiVue bundle')));
  });
}

const BASE = 'volumes/';
const VOLUMES = {
  whole: { url: BASE + 'whole-sample-01.nii.gz', label: 'Whole brain' },
  lhemi: { url: BASE + 'lhemi-sample-01.nii.gz', label: 'Left hemisphere' },
  rhemi: { url: BASE + 'rhemi-sample-01.nii.gz', label: 'Right hemisphere' },
  cb:    { url: BASE + 'cb-sample-01.nii.gz', label: 'Cerebellum–brainstem complex' },
  assembly: { url: BASE + 'assembly-parts-sample-01.nii.gz', label: 'Colored assembly' },
};
const INTENSITY_WINDOW = Object.freeze({ cal_min: -1, cal_max: 1 });
const RGB_DATATYPES = new Set([128, 2304]); // NIfTI RGB24 and RGBA32

export async function initVolumeViewer(root = document) {
  const stage = root.querySelector('[data-volume-viewer]');
  if (!stage || stage.dataset.ready === '1') return;
  stage.dataset.ready = '1';
  const shell = stage.closest('.viewer-shell') ?? stage.parentElement;
  const statusEl = root.querySelector('[data-viewer-status]');
  const setStatus = (t) => { if (statusEl) statusEl.textContent = t; };

  const canvas = document.createElement('canvas');
  canvas.className = 'viewer-canvas';
  stage.appendChild(canvas);

  let nv;
  try {
    const Niivue = await loadNiivue();
    nv = new Niivue({
      backColor: [0.043, 0.031, 0.086, 1],
      crosshairWidth: 0,
      show3Dcrosshair: false,
      isOrientationTextVisible: false,
      multiplanarLayout: 2,
      multiplanarShowRender: 1,
      dragAndDropEnabled: true,
      isColorbar: false,
    });
    nv.onImageLoaded = (volume) => {
      if (RGB_DATATYPES.has(volume?.hdr?.datatypeCode)) return;
      volume.cal_min = INTENSITY_WINDOW.cal_min;
      volume.cal_max = INTENSITY_WINDOW.cal_max;
      nv.updateGLVolume();
    };
    await nv.attachToCanvas(canvas);
  } catch (err) {
    setStatus('The viewer needs a WebGL2 browser with internet access to load NiiVue. ' + (err?.message ?? ''));
    return;
  }

  async function load(which) {
    setStatus('Loading…');
    try {
      if (which === 'assemble') {
        await nv.loadVolumes([{ url: VOLUMES.assembly.url, opacity: 1 }]);
        setStatus('Assembled in world coordinates — left (lavender) + right (green) hemispheres + cerebellum–brainstem (butter).');
      } else {
        await nv.loadVolumes([{ url: VOLUMES[which].url, colormap: 'gray', opacity: 1, ...INTENSITY_WINDOW }]);
        setStatus(VOLUMES[which].label + ' · drag to rotate / move · scroll to zoom');
      }
    } catch (err) {
      setStatus('Could not fetch the volume — serve the page over http (not file://), or drop a .nii.gz onto the viewer. ' + (err?.message ?? ''));
    }
  }

  function activate(group, btn) {
    for (const b of shell.querySelectorAll(`[data-${group}]`)) b.classList.toggle('is-active', b === btn);
  }

  for (const btn of shell.querySelectorAll('[data-vol]')) {
    btn.addEventListener('click', () => { activate('vol', btn); load(btn.dataset.vol); });
  }

  nv.setSliceType(nv.sliceTypeMultiplanar);
  await load('whole');
}

// Lazy boot: only spin up NiiVue + fetch volumes once the viewer nears the viewport.
function bootVolumeViewer() {
  const stage = document.querySelector('[data-volume-viewer]');
  if (!stage) return;
  if (!('IntersectionObserver' in window)) { initVolumeViewer(document); return; }
  const io = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (entry.isIntersecting) { obs.disconnect(); initVolumeViewer(document); }
    }
  }, { rootMargin: '600px 0px' });
  io.observe(stage);
}

bootVolumeViewer();
