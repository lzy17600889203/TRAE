import type { ModelData, Point3D } from './types';

export function createCubeModel(): ModelData {
  const size = 2;
  const half = size / 2;
  const vertices: Point3D[] = [
    { x: -half, y: -half, z: -half },
    { x: half, y: -half, z: -half },
    { x: half, y: half, z: -half },
    { x: -half, y: half, z: -half },
    { x: -half, y: -half, z: half },
    { x: half, y: -half, z: half },
    { x: half, y: half, z: half },
    { x: -half, y: half, z: half },
  ];
  
  const triangles: number[][] = [
    [0, 1, 2], [0, 2, 3],
    [4, 6, 5], [4, 7, 6],
    [0, 4, 5], [0, 5, 1],
    [2, 6, 7], [2, 7, 3],
    [0, 3, 7], [0, 7, 4],
    [1, 5, 6], [1, 6, 2],
  ];

  return {
    type: 'cube',
    vertices,
    triangles,
    bounds: {
      min: { x: -half, y: -half, z: -half },
      max: { x: half, y: half, z: half },
    },
  };
}

export function createSphereModel(): ModelData {
  const radius = 1.2;
  const segments = 20;
  const rings = 20;
  const vertices: Point3D[] = [];
  const triangles: number[][] = [];

  for (let lat = 0; lat <= rings; lat++) {
    const theta = (lat * Math.PI) / rings;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= segments; lon++) {
      const phi = (lon * 2 * Math.PI) / segments;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      vertices.push({
        x: radius * cosPhi * sinTheta,
        y: radius * cosTheta,
        z: radius * sinPhi * sinTheta,
      });
    }
  }

  for (let lat = 0; lat < rings; lat++) {
    for (let lon = 0; lon < segments; lon++) {
      const first = lat * (segments + 1) + lon;
      const second = first + segments + 1;

      triangles.push([first, second, first + 1]);
      triangles.push([second, second + 1, first + 1]);
    }
  }

  return {
    type: 'sphere',
    vertices,
    triangles,
    bounds: {
      min: { x: -radius, y: -radius, z: -radius },
      max: { x: radius, y: radius, z: radius },
    },
  };
}

export function createCylinderModel(): ModelData {
  const radius = 1;
  const height = 2.5;
  const segments = 24;
  const vertices: Point3D[] = [];
  const triangles: number[][] = [];

  const bottomCenter = { x: 0, y: -height / 2, z: 0 };
  const topCenter = { x: 0, y: height / 2, z: 0 };

  vertices.push(bottomCenter, topCenter);

  for (let i = 0; i <= segments; i++) {
    const angle = (i * 2 * Math.PI) / segments;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    vertices.push({ x, y: -height / 2, z });
    vertices.push({ x, y: height / 2, z });
  }

  const bottomIdx = 0;
  const topIdx = 1;

  for (let i = 0; i < segments; i++) {
    const b1 = 2 + i * 2;
    const b2 = 2 + (i + 1) * 2;
    const t1 = b1 + 1;
    const t2 = b2 + 1;

    triangles.push([bottomIdx, b1, b2]);
    triangles.push([topIdx, t2, t1]);
    triangles.push([b1, t1, t2]);
    triangles.push([b1, t2, b2]);
  }

  return {
    type: 'cylinder',
    vertices,
    triangles,
    bounds: {
      min: { x: -radius, y: -height / 2, z: -radius },
      max: { x: radius, y: height / 2, z: radius },
    },
  };
}

export function createConeModel(): ModelData {
  const radius = 1.2;
  const height = 2.5;
  const segments = 24;
  const vertices: Point3D[] = [];
  const triangles: number[][] = [];

  const bottomCenter = { x: 0, y: -height / 2, z: 0 };
  const apex = { x: 0, y: height / 2, z: 0 };

  vertices.push(bottomCenter, apex);

  for (let i = 0; i <= segments; i++) {
    const angle = (i * 2 * Math.PI) / segments;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    vertices.push({ x, y: -height / 2, z });
  }

  for (let i = 0; i < segments; i++) {
    const p1 = 2 + i;
    const p2 = 2 + i + 1;
    
    triangles.push([0, p1, p2]);
    triangles.push([1, p2, p1]);
  }

  return {
    type: 'cone',
    vertices,
    triangles,
    bounds: {
      min: { x: -radius, y: -height / 2, z: -radius },
      max: { x: radius, y: height / 2, z: radius },
    },
  };
}

export function createTorusModel(): ModelData {
  const R = 1.0;
  const r = 0.4;
  const segmentsT = 32;
  const segmentsP = 16;
  const vertices: Point3D[] = [];
  const triangles: number[][] = [];

  for (let i = 0; i <= segmentsT; i++) {
    const u = (i / segmentsT) * Math.PI * 2;
    for (let j = 0; j <= segmentsP; j++) {
      const v = (j / segmentsP) * Math.PI * 2;
      const x = (R + r * Math.cos(v)) * Math.cos(u);
      const y = r * Math.sin(v);
      const z = (R + r * Math.cos(v)) * Math.sin(u);
      vertices.push({ x, y, z });
    }
  }

  for (let i = 0; i < segmentsT; i++) {
    for (let j = 0; j < segmentsP; j++) {
      const a = i * (segmentsP + 1) + j;
      const b = a + segmentsP + 1;
      triangles.push([a, b, a + 1]);
      triangles.push([b, b + 1, a + 1]);
    }
  }

  return {
    type: 'torus',
    vertices,
    triangles,
    bounds: {
      min: { x: -(R + r), y: -r, z: -(R + r) },
      max: { x: R + r, y: r, z: R + r },
    },
  };
}

export function createOverhangModel(): ModelData {
  const vertices: Point3D[] = [];
  const triangles: number[][] = [];

  const baseX = 0.8;
  const baseY = 1.0;
  const baseZ = 0.8;
  const overhangLength = 1.5;
  const overhangThickness = 0.3;

  const baseMin = { x: -baseX, y: -1.2, z: -baseZ };
  const baseMax = { x: baseX, y: -1.2 + baseY, z: baseZ };

  vertices.push(
    { x: baseMin.x, y: baseMin.y, z: baseMin.z },
    { x: baseMax.x, y: baseMin.y, z: baseMin.z },
    { x: baseMax.x, y: baseMax.y, z: baseMin.z },
    { x: baseMin.x, y: baseMax.y, z: baseMin.z },
    { x: baseMin.x, y: baseMin.y, z: baseMax.z },
    { x: baseMax.x, y: baseMin.y, z: baseMax.z },
    { x: baseMax.x, y: baseMax.y, z: baseMax.z },
    { x: baseMin.x, y: baseMax.y, z: baseMax.z }
  );

  const baseFaces = [
    [0, 1, 2], [0, 2, 3],
    [4, 6, 5], [4, 7, 6],
    [0, 4, 5], [0, 5, 1],
    [2, 6, 7], [2, 7, 3],
    [0, 3, 7], [0, 7, 4],
    [1, 5, 6], [1, 6, 2],
  ];
  triangles.push(...baseFaces);

  const ohY = baseMax.y;
  const ohStartX = -baseX + 0.2;
  const ohEndX = ohStartX + overhangLength;
  const ohWidth = 1.0;

  const ohVertices = [
    { x: ohStartX, y: ohY, z: -ohWidth / 2 },
    { x: ohEndX, y: ohY, z: -ohWidth / 2 },
    { x: ohEndX, y: ohY + overhangThickness, z: -ohWidth / 2 },
    { x: ohStartX, y: ohY + overhangThickness, z: -ohWidth / 2 },
    { x: ohStartX, y: ohY, z: ohWidth / 2 },
    { x: ohEndX, y: ohY, z: ohWidth / 2 },
    { x: ohEndX, y: ohY + overhangThickness, z: ohWidth / 2 },
    { x: ohStartX, y: ohY + overhangThickness, z: ohWidth / 2 },
  ];

  const baseIdx = vertices.length;
  vertices.push(...ohVertices);

  const ohFaces = [
    [baseIdx + 0, baseIdx + 1, baseIdx + 2],
    [baseIdx + 0, baseIdx + 2, baseIdx + 3],
    [baseIdx + 4, baseIdx + 6, baseIdx + 5],
    [baseIdx + 4, baseIdx + 7, baseIdx + 6],
    [baseIdx + 0, baseIdx + 4, baseIdx + 5],
    [baseIdx + 0, baseIdx + 5, baseIdx + 1],
    [baseIdx + 2, baseIdx + 6, baseIdx + 7],
    [baseIdx + 2, baseIdx + 7, baseIdx + 3],
    [baseIdx + 0, baseIdx + 3, baseIdx + 7],
    [baseIdx + 0, baseIdx + 7, baseIdx + 4],
    [baseIdx + 1, baseIdx + 5, baseIdx + 6],
    [baseIdx + 1, baseIdx + 6, baseIdx + 2],
  ];
  triangles.push(...ohFaces);

  return {
    type: 'overhang',
    vertices,
    triangles,
    bounds: {
      min: { x: ohStartX, y: baseMin.y, z: -ohWidth / 2 },
      max: { x: ohEndX, y: ohY + overhangThickness, z: ohWidth / 2 },
    },
  };
}

export function generateModel(type: string): ModelData {
  switch (type) {
    case 'cube':
      return createCubeModel();
    case 'sphere':
      return createSphereModel();
    case 'cylinder':
      return createCylinderModel();
    case 'cone':
      return createConeModel();
    case 'torus':
      return createTorusModel();
    case 'overhang':
      return createOverhangModel();
    default:
      return createCubeModel();
  }
}
