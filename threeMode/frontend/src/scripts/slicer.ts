import type {
  ModelData,
  Point3D,
  Point2D,
  SliceLayer,
  PrintPath,
  PrintParameters,
  SliceResult,
  PrintError,
} from './types';

function dist2D(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dz = a.y - b.y;
  return Math.sqrt(dx * dx + dz * dz);
}

function dist3D(a: Point3D, b: Point3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function intersectTriangleWithPlane(
  v0: Point3D,
  v1: Point3D,
  v2: Point3D,
  planeY: number,
  epsilon: number = 1e-6
): Point2D[] {
  const points: Point2D[] = [];
  const vertices = [v0, v1, v2, v0];

  for (let i = 0; i < 3; i++) {
    const a = vertices[i];
    const b = vertices[i + 1];

    const ya = a.y;
    const yb = b.y;

    if (Math.abs(ya - planeY) < epsilon) {
      points.push({ x: a.x, y: a.z });
      continue;
    }

    if (Math.abs(yb - planeY) < epsilon) {
      points.push({ x: b.x, y: b.z });
      continue;
    }

    if ((ya - planeY) * (yb - planeY) < 0) {
      const t = (planeY - ya) / (yb - ya);
      const x = a.x + t * (b.x - a.x);
      const z = a.z + t * (b.z - a.z);
      points.push({ x, y: z });
    }
  }

  return points;
}

function createContours(points: Point2D[], epsilon: number = 1e-4): Point2D[][] {
  const contours: Point2D[][] = [];
  const used = new Set<number>();
  const n = points.length;

  if (n < 2) return contours;

  for (let startIdx = 0; startIdx < n; startIdx++) {
    if (used.has(startIdx)) continue;

    const contour: Point2D[] = [points[startIdx]];
    used.add(startIdx);
    let currentIdx = startIdx;

    while (true) {
      let closestIdx = -1;
      let closestDist = Infinity;

      for (let i = 0; i < n; i++) {
        if (used.has(i)) continue;
        const d = dist2D(points[currentIdx], points[i]);
        if (d < closestDist) {
          closestDist = d;
          closestIdx = i;
        }
      }

      if (closestIdx === -1 || closestDist > 0.5) break;

      contour.push(points[closestIdx]);
      used.add(closestIdx);
      currentIdx = closestIdx;

      if (contour.length > 1) {
        const first = contour[0];
        const last = contour[contour.length - 1];
        if (dist2D(first, last) < epsilon) {
          contour.pop();
          break;
        }
      }
    }

    if (contour.length >= 3) {
      contours.push(contour);
    }
  }

  return contours;
}

function isPointInPolygon(p: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    if ((yi > p.y) !== (yj > p.y)) {
      const xIntersect = ((p.y - yi) * (xj - xi)) / (yj - yi) + xi;
      if (p.x < xIntersect) inside = !inside;
    }
  }

  return inside;
}

function generateLineInfill(
  contours: Point2D[][],
  density: number,
  angle: number = 45
): Point2D[][] {
  if (density <= 0 || contours.length === 0) return [];

  const lines: Point2D[][] = [];
  const spacing = 0.1 / (density / 100);
  
  const allPoints = contours.flat();
  const minX = Math.min(...allPoints.map((p) => p.x)) - 0.1;
  const maxX = Math.max(...allPoints.map((p) => p.x)) + 0.1;
  const minY = Math.min(...allPoints.map((p) => p.y)) - 0.1;
  const maxY = Math.max(...allPoints.map((p) => p.y)) + 0.1;

  const rad = (angle * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  const outerContour = contours[0];

  const step = spacing;
  const diag = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  for (let i = -Math.ceil(diag / step); i <= Math.ceil(diag / step); i++) {
    const offset = i * step;

    const lineStart: Point2D = {
      x: centerX + offset * cosA - diag * sinA,
      y: centerY + offset * sinA + diag * cosA,
    };
    const lineEnd: Point2D = {
      x: centerX + offset * cosA + diag * sinA,
      y: centerY + offset * sinA - diag * cosA,
    };

    const intersections: Point2D[] = [];
    const n = outerContour.length;

    for (let j = 0; j < n; j++) {
      const p1 = outerContour[j];
      const p2 = outerContour[(j + 1) % n];

      const x1 = lineStart.x;
      const y1 = lineStart.y;
      const x2 = lineEnd.x;
      const y2 = lineEnd.y;
      const x3 = p1.x;
      const y3 = p1.y;
      const x4 = p2.x;
      const y4 = p2.y;

      const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      if (Math.abs(denom) < 1e-10) continue;

      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
      const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        const px = x1 + t * (x2 - x1);
        const py = y1 + t * (y2 - y1);
        intersections.push({ x: px, y: py });
      }
    }

    if (intersections.length >= 2) {
      intersections.sort((a, b) => {
        const da = (a.x - lineStart.x) * sinA - (a.y - lineStart.y) * cosA;
        const db = (b.x - lineStart.x) * sinA - (b.y - lineStart.y) * cosA;
        return da - db;
      });

      for (let k = 0; k < intersections.length - 1; k += 2) {
        if (k + 1 < intersections.length) {
          const mid: Point2D = {
            x: (intersections[k].x + intersections[k + 1].x) / 2,
            y: (intersections[k].y + intersections[k + 1].y) / 2,
          };

          if (isPointInPolygon(mid, outerContour)) {
            lines.push([intersections[k], intersections[k + 1]]);
          }
        }
      }
    }
  }

  return lines;
}

function generateGridInfill(
  contours: Point2D[][],
  density: number
): Point2D[][] {
  const lines1 = generateLineInfill(contours, density, 0);
  const lines2 = generateLineInfill(contours, density, 90);
  return [...lines1, ...lines2];
}

function generateSupportContours(
  contours: Point2D[][],
  style: string
): Point2D[][] {
  if (style === 'none' || contours.length === 0) return [];

  const supports: Point2D[][] = [];
  const outerContour = contours[0];

  if (style === 'grid') {
    const gridSize = 0.15;
    const allPoints = outerContour;
    const minX = Math.min(...allPoints.map((p) => p.x));
    const maxX = Math.max(...allPoints.map((p) => p.x));
    const minY = Math.min(...allPoints.map((p) => p.y));
    const maxY = Math.max(...allPoints.map((p) => p.y));

    for (let x = minX; x <= maxX; x += gridSize) {
      const line: Point2D[] = [];
      for (let y = minY; y <= maxY; y += 0.05) {
        if (isPointInPolygon({ x, y }, outerContour)) {
          line.push({ x, y });
        }
      }
      if (line.length >= 2) {
        supports.push(line);
      }
    }

    for (let y = minY; y <= maxY; y += gridSize) {
      const line: Point2D[] = [];
      for (let x = minX; x <= maxX; x += 0.05) {
        if (isPointInPolygon({ x, y }, outerContour)) {
          line.push({ x, y });
        }
      }
      if (line.length >= 2) {
        supports.push(line);
      }
    }
  } else if (style === 'tree') {
    const center: Point2D = {
      x: outerContour.reduce((s, p) => s + p.x, 0) / outerContour.length,
      y: outerContour.reduce((s, p) => s + p.y, 0) / outerContour.length,
    };

    const numBranches = 8;
    for (let i = 0; i < numBranches; i++) {
      const angle = (i / numBranches) * Math.PI * 2;
      const line: Point2D[] = [center];

      for (let t = 0; t <= 1; t += 0.1) {
        const p: Point2D = {
          x: center.x + Math.cos(angle) * t * 2,
          y: center.y + Math.sin(angle) * t * 2,
        };
        if (isPointInPolygon(p, outerContour)) {
          line.push(p);
        }
      }

      if (line.length >= 2) {
        supports.push(line);
      }
    }
  } else if (style === 'line') {
    supports.push(...generateLineInfill(contours, 30, 45));
  }

  return supports;
}

function generatePrintPaths(
  contours: Point2D[][],
  infill: Point2D[][],
  supports: Point2D[][],
  z: number,
  layerIndex: number
): PrintPath[] {
  const paths: PrintPath[] = [];

  for (const contour of contours) {
    if (contour.length < 3) continue;

    const points3D: Point3D[] = [];
    for (const p of contour) {
      points3D.push({ x: p.x, y: z, z: p.y });
    }
    points3D.push(points3D[0]);

    paths.push({
      type: 'perimeter',
      points: points3D,
      layerIndex,
    });
  }

  for (const line of infill) {
    if (line.length < 2) continue;

    const points3D: Point3D[] = line.map((p) => ({
      x: p.x,
      y: z,
      z: p.y,
    }));

    paths.push({
      type: 'infill',
      points: points3D,
      layerIndex,
    });
  }

  for (const line of supports) {
    if (line.length < 2) continue;

    const points3D: Point3D[] = line.map((p) => ({
      x: p.x,
      y: z,
      z: p.y,
    }));

    paths.push({
      type: 'support',
      points: points3D,
      layerIndex,
    });
  }

  return paths;
}

function addTravelMoves(paths: PrintPath[]): PrintPath[] {
  if (paths.length === 0) return paths;

  const result: PrintPath[] = [];
  let lastPoint: Point3D | null = null;

  for (const path of paths) {
    if (lastPoint && path.points.length > 0) {
      const firstPoint = path.points[0];
      if (dist3D(lastPoint, firstPoint) > 0.01) {
        result.push({
          type: 'travel',
          points: [lastPoint, firstPoint],
          layerIndex: path.layerIndex,
        });
      }
    }

    result.push(path);

    if (path.points.length > 0) {
      lastPoint = path.points[path.points.length - 1];
    }
  }

  return result;
}

function addPrintErrors(
  paths: PrintPath[],
  layerIndex: number,
  parameters: PrintParameters,
  errors: PrintError[]
): PrintPath[] {
  if (!parameters.enableErrors) return paths;

  const result: PrintPath[] = [];
  const speedMultiplier = parameters.printSpeed / 100;
  const errorProbability = Math.min(0.3, speedMultiplier * 0.15);

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];

    if (
      path.type === 'perimeter' ||
      path.type === 'infill'
    ) {
      if (Math.random() < errorProbability && path.points.length >= 4) {
        const errorType = Math.random();

        if (errorType < 0.4 && parameters.printSpeed > 150) {
          const jitteredPoints: Point3D[] = [];
          for (let pi = 0; pi < path.points.length; pi++) {
            const p = path.points[pi];
            const jitter = (Math.random() - 0.5) * 0.1 * speedMultiplier;
            jitteredPoints.push({
              x: p.x + jitter,
              y: p.y,
              z: p.z + jitter,
            });
          }
          result.push({
            ...path,
            points: jitteredPoints,
            isError: true,
            errorType: 'path_crossing',
          });

          errors.push({
            id: `error-${layerIndex}-${i}`,
            type: 'path_crossing',
            layerIndex,
            severity: 'warning',
            description: '路径抖动 - 打印速度过高',
            location: path.points[Math.floor(path.points.length / 2)],
          });
          continue;
        }

        if (errorType < 0.7) {
          const midIdx = Math.floor(path.points.length / 2);
          const misalignedPoints: Point3D[] = [];
          for (let pi = 0; pi < path.points.length; pi++) {
            const p = path.points[pi];
            if (pi >= midIdx) {
              misalignedPoints.push({
                x: p.x + 0.05,
                y: p.y - 0.02,
                z: p.z,
              });
            } else {
              misalignedPoints.push(p);
            }
          }
          result.push({
            ...path,
            points: misalignedPoints,
            isError: true,
            errorType: 'layer_misalignment',
          });

          errors.push({
            id: `error-${layerIndex}-${i}`,
            type: 'layer_misalignment',
            layerIndex,
            severity: 'error',
            description: '层间错位 - 路径对齐失败',
            location: path.points[midIdx],
          });
          continue;
        }
      }
    }

    result.push(path);
  }

  return result;
}

function checkLongTravel(paths: PrintPath[]): PrintError[] {
  const errors: PrintError[] = [];

  for (const path of paths) {
    if (path.type === 'travel' && path.points.length >= 2) {
      const d = dist3D(path.points[0], path.points[path.points.length - 1]);
      if (d > 3.0) {
        errors.push({
          id: `travel-${path.layerIndex}-${Math.random()}`,
          type: 'long_travel',
          layerIndex: path.layerIndex,
          severity: 'warning',
          description: `长距离空驶: ${d.toFixed(2)} mm`,
          location: path.points[0],
        });
      }
    }
  }

  return errors;
}

export function sliceModel(
  model: ModelData,
  parameters: PrintParameters
): SliceResult {
  const layers: SliceLayer[] = [];
  const errors: PrintError[] = [];
  let totalGcodeLines = 0;
  let totalTravelDistance = 0;

  const minY = model.bounds.min.y;
  const maxY = model.bounds.max.y;
  const height = maxY - minY;
  const numLayers = Math.ceil(height / parameters.layerHeight);

  const modelCenterX = (model.bounds.min.x + model.bounds.max.x) / 2;
  const modelCenterY = (model.bounds.min.z + model.bounds.max.z) / 2;

  const isOverhangModel = model.type === 'overhang';
  const hasSupport = parameters.supportStyle !== 'none';

  for (let layerIdx = 0; layerIdx < numLayers; layerIdx++) {
    const z = minY + layerIdx * parameters.layerHeight + parameters.layerHeight / 2;

    const slicePoints: Point2D[] = [];

    for (const tri of model.triangles) {
      const v0 = model.vertices[tri[0]];
      const v1 = model.vertices[tri[1]];
      const v2 = model.vertices[tri[2]];

      const intersections = intersectTriangleWithPlane(v0, v1, v2, z);
      slicePoints.push(...intersections);
    }

    const contours = createContours(slicePoints);

    let infill: Point2D[][] = [];
    if (parameters.infillDensity > 0 && contours.length > 0) {
      const angle = layerIdx % 2 === 0 ? 45 : -45;
      infill = generateLineInfill(contours, parameters.infillDensity, angle);
    }

    let supportContours: Point2D[][] = [];
    if (hasSupport && contours.length > 0) {
      supportContours = generateSupportContours(contours, parameters.supportStyle);
    }

    let paths = generatePrintPaths(
      contours,
      infill,
      supportContours,
      z,
      layerIdx
    );

    paths = addTravelMoves(paths);
    paths = addPrintErrors(paths, layerIdx, parameters, errors);

    for (const path of paths) {
      if (path.points.length >= 2) {
        totalGcodeLines++;
        if (path.type === 'travel') {
          totalTravelDistance += dist3D(
            path.points[0],
            path.points[path.points.length - 1]
          );
        }
      }
    }

    errors.push(...checkLongTravel(paths));

    if (
      isOverhangModel &&
      !hasSupport &&
      z > -0.5 &&
      parameters.enableErrors
    ) {
      errors.push({
        id: `overhang-${layerIdx}`,
        type: 'overhang_collapse',
        layerIndex: layerIdx,
        severity: 'error',
        description: '悬臂结构缺少支撑，可能发生塌陷',
        location: { x: modelCenterX + 0.5, y: z, z: modelCenterY },
      });

      for (const path of paths) {
        if (
          path.type === 'perimeter' &&
          path.points.length > 2 &&
          z > -0.3
        ) {
          path.isError = true;
          path.errorType = 'overhang_collapse';
        }
      }
    }

    layers.push({
      layerIndex: layerIdx,
      z,
      contours,
      infillPattern: infill,
      supportContours,
      paths,
    });
  }

  return {
    model,
    parameters,
    layers,
    totalGcodeLines,
    totalTravelDistance: totalTravelDistance * 10,
    errors,
    hasSupport,
  };
}
