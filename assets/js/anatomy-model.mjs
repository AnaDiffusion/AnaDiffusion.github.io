const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function makeHemisphere(count, side, random) {
  const sign = side === 'left' ? -1 : 1;

  return Array.from({ length: count }, (_, index) => {
    const vertical = 1 - (2 * (index + 0.5)) / count;
    const ring = Math.sqrt(Math.max(0, 1 - vertical * vertical));
    const angle = index * GOLDEN_ANGLE + (random() - 0.5) * 0.12;
    const fold = 1 - 0.075 * Math.abs(Math.sin(angle * 5.2 + vertical * 7.5));
    const jitter = 0.97 + random() * 0.06;
    const outer = Math.abs(Math.cos(angle)) * ring;
    const depth = Math.sin(angle) * ring;

    return {
      position: [
        sign * (0.12 + outer * 0.86) * fold * jitter,
        vertical * 1.08 * jitter,
        depth * 0.88 * fold * jitter,
      ],
      radius: 0.017 + random() * 0.018,
      alpha: 0.54 + random() * 0.42,
      shade: 0.74 + random() * 0.26,
    };
  });
}

function makeCerebellarBrainstem(count, random) {
  const cerebellumCount = Math.max(1, Math.round(count * 0.78));
  const points = Array.from({ length: cerebellumCount }, (_, index) => {
    const vertical = 1 - (2 * (index + 0.5)) / cerebellumCount;
    const ring = Math.sqrt(Math.max(0, 1 - vertical * vertical));
    const angle = index * GOLDEN_ANGLE + (random() - 0.5) * 0.18;
    const fold = 1 - 0.11 * Math.abs(Math.sin(angle * 7 + vertical * 9));
    const jitter = 0.96 + random() * 0.08;

    return {
      position: [
        Math.cos(angle) * ring * 0.78 * fold * jitter,
        -0.24 + vertical * 0.5 * jitter,
        Math.sin(angle) * ring * 0.58 * fold * jitter,
      ],
      radius: 0.015 + random() * 0.015,
      alpha: 0.56 + random() * 0.4,
      shade: 0.72 + random() * 0.28,
    };
  });

  const stemCount = count - cerebellumCount;
  for (let index = 0; index < stemCount; index += 1) {
    const progress = stemCount === 1 ? 0 : index / (stemCount - 1);
    const angle = index * GOLDEN_ANGLE;
    const width = 0.18 * (1 - progress * 0.48);
    points.push({
      position: [
        Math.cos(angle) * width * (0.75 + random() * 0.25),
        -0.56 - progress * 0.72,
        Math.sin(angle) * width * (0.75 + random() * 0.25),
      ],
      radius: 0.016 + random() * 0.013,
      alpha: 0.58 + random() * 0.38,
      shade: 0.72 + random() * 0.28,
    });
  }

  return points;
}

export function createBrainModel({ seed = 23, density = 520 } = {}) {
  const safeDensity = Math.max(12, Math.round(density));
  const random = mulberry32(seed);

  return {
    left: makeHemisphere(safeDensity, 'left', random),
    right: makeHemisphere(safeDensity, 'right', random),
    cb: makeCerebellarBrainstem(Math.round(safeDensity * 0.6), random),
  };
}

export function rotatePoint([x, y, z], rotation) {
  const cosY = Math.cos(rotation.y);
  const sinY = Math.sin(rotation.y);
  const rotatedX = x * cosY + z * sinY;
  const rotatedZ = -x * sinY + z * cosY;
  const cosX = Math.cos(rotation.x);
  const sinX = Math.sin(rotation.x);

  return [
    rotatedX,
    y * cosX - rotatedZ * sinX,
    y * sinX + rotatedZ * cosX,
  ];
}

export function projectPoint([x, y, z], width, height, cameraDistance = 5) {
  const safeDepth = Math.max(1.2, cameraDistance + z);
  const scale = cameraDistance / safeDepth;
  const unit = Math.min(width, height) * 0.245;

  return {
    x: width / 2 + x * unit * scale,
    y: height / 2 - y * unit * scale,
    scale,
    depth: -z,
  };
}

export function sortByDepth(points) {
  return [...points].sort((a, b) => a.depth - b.depth);
}
