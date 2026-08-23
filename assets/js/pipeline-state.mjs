export const STAGE_IDS = Object.freeze(['parts', 'scaffold', 'inject', 'refine']);
export const PART_IDS = Object.freeze(['left', 'right', 'cb']);

const INITIAL_STATE = Object.freeze({
  stage: 'parts',
  visible: Object.freeze({ left: true, right: true, cb: true }),
  rotation: Object.freeze({ x: -0.12, y: 0.36 }),
  autoRotate: true,
});

const STAGE_TRANSFORMS = Object.freeze({
  parts: Object.freeze({
    left: Object.freeze({ offset: [-1.05, 0.08, 0], scale: 0.92, opacity: 0.9, pulse: false }),
    right: Object.freeze({ offset: [1.05, 0.08, 0], scale: 0.92, opacity: 0.9, pulse: false }),
    cb: Object.freeze({ offset: [0, -1.02, 0], scale: 0.92, opacity: 0.9, pulse: false }),
  }),
  scaffold: Object.freeze({
    left: Object.freeze({ offset: [-0.38, 0, 0], scale: 1, opacity: 0.9, pulse: false }),
    right: Object.freeze({ offset: [0.38, 0, 0], scale: 1, opacity: 0.9, pulse: false }),
    cb: Object.freeze({ offset: [0, -0.62, 0], scale: 1, opacity: 0.9, pulse: false }),
  }),
  inject: Object.freeze({
    left: Object.freeze({ offset: [-0.38, 0, 0], scale: 1, opacity: 0.96, pulse: true }),
    right: Object.freeze({ offset: [0.38, 0, 0], scale: 1, opacity: 0.96, pulse: true }),
    cb: Object.freeze({ offset: [0, -0.62, 0], scale: 1, opacity: 0.96, pulse: true }),
  }),
  refine: Object.freeze({
    left: Object.freeze({ offset: [-0.36, 0, 0], scale: 1.02, opacity: 0.92, pulse: false }),
    right: Object.freeze({ offset: [0.36, 0, 0], scale: 1.02, opacity: 0.92, pulse: false }),
    cb: Object.freeze({ offset: [0, -0.6, 0], scale: 1.02, opacity: 0.92, pulse: false }),
  }),
});

export function createInitialState() {
  return {
    stage: INITIAL_STATE.stage,
    visible: { ...INITIAL_STATE.visible },
    rotation: { ...INITIAL_STATE.rotation },
    autoRotate: INITIAL_STATE.autoRotate,
  };
}

export function getStageTransform(stage, part) {
  const safeStage = STAGE_IDS.includes(stage) ? stage : INITIAL_STATE.stage;
  const safePart = PART_IDS.includes(part) ? part : PART_IDS[0];
  const transform = STAGE_TRANSFORMS[safeStage][safePart];

  return { ...transform, offset: [...transform.offset] };
}

export function reduceExplorerState(state, action) {
  switch (action?.type) {
    case 'select-stage':
      if (!STAGE_IDS.includes(action.stage)) return state;
      return { ...state, stage: action.stage };

    case 'toggle-part':
      if (!PART_IDS.includes(action.part)) return state;
      return {
        ...state,
        visible: { ...state.visible, [action.part]: !state.visible[action.part] },
      };

    case 'rotate': {
      const dx = Number.isFinite(action.dx) ? action.dx : 0;
      const dy = Number.isFinite(action.dy) ? action.dy : 0;
      const x = Math.max(-1.3, Math.min(1.3, state.rotation.x + dy));
      return {
        ...state,
        rotation: {
          x: Number(x.toFixed(6)),
          y: Number((state.rotation.y + dx).toFixed(6)),
        },
        autoRotate: false,
      };
    }

    case 'set-auto-rotate':
      return { ...state, autoRotate: Boolean(action.value) };

    case 'reset':
      return createInitialState();

    default:
      return state;
  }
}
