import {
  createInitialState,
  getStageTransform,
  reduceExplorerState,
} from './pipeline-state.mjs';
import {
  createBrainModel,
  projectPoint,
  rotatePoint,
  sortByDepth,
} from './anatomy-model.mjs';

const PART_COLORS = {
  left: [245, 102, 130],
  right: [89, 211, 217],
  cb: [242, 198, 82],
};

const STAGE_DESCRIPTIONS = {
  parts: 'Generate Parts: part-specific diffusion priors model local anatomical structure.',
  scaffold: 'Assemble Scaffold: generated parts move into their template-aligned whole-brain positions.',
  inject: 'Inject Latent: the encoded scaffold is injected at an intermediate denoising step.',
  refine: 'Refine Globally: the whole-brain denoiser repairs seams and synthesizes missing context.',
};

function addVectors(point, offset, scale) {
  return [
    point[0] * scale + offset[0],
    point[1] * scale + offset[1],
    point[2] * scale + offset[2],
  ];
}

function makePointColor(rgb, shade, alpha) {
  const channel = (value) => Math.round(Math.min(255, value * shade));
  return `rgba(${channel(rgb[0])}, ${channel(rgb[1])}, ${channel(rgb[2])}, ${alpha})`;
}

function drawStageAtmosphere(context, width, height, stage, time) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radial = context.createRadialGradient(centerX, centerY, 20, centerX, centerY, Math.min(width, height) * 0.52);
  radial.addColorStop(0, stage === 'refine' ? 'rgba(151, 164, 255, 0.16)' : 'rgba(117, 132, 203, 0.09)');
  radial.addColorStop(0.55, stage === 'inject' ? 'rgba(100, 221, 219, 0.08)' : 'rgba(67, 91, 145, 0.035)');
  radial.addColorStop(1, 'rgba(7, 12, 26, 0)');
  context.fillStyle = radial;
  context.fillRect(0, 0, width, height);

  if (stage === 'inject') {
    const progress = (time * 0.0002) % 1;
    const y = height * (0.2 + progress * 0.6);
    const beam = context.createLinearGradient(0, y - 24, 0, y + 24);
    beam.addColorStop(0, 'rgba(92, 220, 218, 0)');
    beam.addColorStop(0.5, 'rgba(138, 234, 235, 0.2)');
    beam.addColorStop(1, 'rgba(92, 220, 218, 0)');
    context.fillStyle = beam;
    context.fillRect(width * 0.16, y - 24, width * 0.68, 48);
  }
}

function drawRefinementHalo(context, width, height, state, time) {
  if (state.stage !== 'refine') return;
  const pulse = 1 + Math.sin(time * 0.0015) * 0.025;
  context.save();
  context.translate(width / 2, height / 2);
  context.scale(pulse, pulse);
  context.strokeStyle = 'rgba(204, 215, 255, 0.2)';
  context.lineWidth = 1.2;
  context.setLineDash([5, 8]);
  context.beginPath();
  context.ellipse(0, -height * 0.015, Math.min(width, height) * 0.205, Math.min(width, height) * 0.31, 0, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

export function initAnatomyExplorer(root = document) {
  const canvas = root.querySelector('#anatomy-canvas');
  const canvasWrap = root.querySelector('[data-canvas-wrap]');
  const status = root.querySelector('[data-explorer-status]');
  const stageButtons = [...root.querySelectorAll('[data-stage]')];
  const partButtons = [...root.querySelectorAll('[data-part]')];
  const resetButton = root.querySelector('[data-reset-view]');

  if (!canvas || !canvasWrap || !status) {
    throw new Error('Explorer markup is incomplete.');
  }

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas rendering is not available.');
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const density = window.innerWidth < 720 ? 260 : 520;
  const model = createBrainModel({ seed: 23, density });
  let state = createInitialState();
  let width = 1;
  let height = 1;
  let running = true;
  let pointer = null;
  let animationFrame = 0;
  let lastTime = performance.now();

  function resize() {
    const rectangle = canvasWrap.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rectangle.width));
    height = Math.max(1, Math.round(rectangle.height));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function updateControls() {
    for (const button of stageButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.stage === state.stage));
    }
    for (const button of partButtons) {
      button.setAttribute('aria-pressed', String(Boolean(state.visible[button.dataset.part])));
    }
    status.textContent = STAGE_DESCRIPTIONS[state.stage];
  }

  function dispatch(action) {
    state = reduceExplorerState(state, action);
    updateControls();
  }

  function projectModel(time) {
    const pulse = state.stage === 'inject' ? 1 + Math.sin(time * 0.004) * 0.045 : 1;
    const projected = [];

    for (const [part, points] of Object.entries(model)) {
      if (!state.visible[part]) continue;
      const transform = getStageTransform(state.stage, part);

      for (const point of points) {
        const transformed = addVectors(point.position, transform.offset, transform.scale * pulse);
        const rotated = rotatePoint(transformed, state.rotation);
        const position = projectPoint(rotated, width, height);
        projected.push({
          ...position,
          part,
          radius: point.radius * Math.min(width, height) * 0.14 * position.scale,
          alpha: point.alpha * transform.opacity,
          shade: point.shade * (0.78 + Math.max(-0.2, Math.min(0.2, -rotated[2] * 0.08))),
        });
      }
    }

    return sortByDepth(projected);
  }

  function draw(time) {
    context.clearRect(0, 0, width, height);
    drawStageAtmosphere(context, width, height, state.stage, time);
    drawRefinementHalo(context, width, height, state, time);
    const projected = projectModel(time);

    context.save();
    context.globalCompositeOperation = 'lighter';
    for (const point of projected) {
      const color = PART_COLORS[point.part];
      const radius = Math.max(1.1, point.radius);
      context.beginPath();
      context.fillStyle = makePointColor(color, point.shade, point.alpha);
      context.shadowColor = makePointColor(color, 1, point.alpha * 0.36);
      context.shadowBlur = state.stage === 'inject' ? radius * 4.5 : radius * 2.7;
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  function tick(time) {
    const delta = Math.min(50, time - lastTime);
    lastTime = time;
    if (running && state.autoRotate && !reducedMotion) {
      state = {
        ...state,
        rotation: { ...state.rotation, y: state.rotation.y + delta * 0.00016 },
      };
    }
    draw(time);
    animationFrame = window.requestAnimationFrame(tick);
  }

  function onPointerDown(event) {
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvasWrap.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = (event.clientX - pointer.x) * 0.008;
    const dy = (event.clientY - pointer.y) * 0.008;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    dispatch({ type: 'rotate', dx, dy });
  }

  function onPointerUp(event) {
    if (pointer?.id === event.pointerId) pointer = null;
  }

  function onKeyDown(event) {
    const deltas = {
      ArrowLeft: { dx: -0.12, dy: 0 },
      ArrowRight: { dx: 0.12, dy: 0 },
      ArrowUp: { dx: 0, dy: -0.1 },
      ArrowDown: { dx: 0, dy: 0.1 },
    };
    if (!deltas[event.key]) return;
    event.preventDefault();
    dispatch({ type: 'rotate', ...deltas[event.key] });
  }

  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(canvasWrap);
  if (!resizeObserver) window.addEventListener('resize', resize, { passive: true });

  const visibilityObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(([entry]) => { running = entry.isIntersecting; }, { threshold: 0.02 })
    : null;
  visibilityObserver?.observe(canvasWrap);

  for (const button of stageButtons) {
    button.addEventListener('click', () => dispatch({ type: 'select-stage', stage: button.dataset.stage }));
  }
  for (const button of partButtons) {
    button.addEventListener('click', () => dispatch({ type: 'toggle-part', part: button.dataset.part }));
  }
  resetButton?.addEventListener('click', () => dispatch({ type: 'reset' }));
  canvasWrap.addEventListener('pointerdown', onPointerDown);
  canvasWrap.addEventListener('pointermove', onPointerMove);
  canvasWrap.addEventListener('pointerup', onPointerUp);
  canvasWrap.addEventListener('pointercancel', onPointerUp);
  canvasWrap.addEventListener('keydown', onKeyDown);

  resize();
  updateControls();
  document.documentElement.classList.add('explorer-ready');
  animationFrame = window.requestAnimationFrame(tick);

  return () => {
    window.cancelAnimationFrame(animationFrame);
    resizeObserver?.disconnect();
    window.removeEventListener('resize', resize);
    visibilityObserver?.disconnect();
  };
}
