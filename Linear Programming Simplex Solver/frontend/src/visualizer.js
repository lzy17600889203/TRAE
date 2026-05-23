import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function createVisualizer(container, model) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();

  const is3D = (model.objective.variables || []).length >= 3;
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  const aspect = container.clientWidth / container.clientHeight;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  camera.position.set(is3D ? 15 : 0, is3D ? 12 : 0, is3D ? 18 : 25);
  camera.lookAt(0, 0, 0);

  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  const light = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(light);
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(10, 20, 10);
  scene.add(dir);

  const grid = new THREE.GridHelper(40, 20, 0x2a3866, 0x1a2447);
  grid.position.y = is3D ? 0 : -10;
  scene.add(grid);

  const axes = new THREE.AxesHelper(8);
  scene.add(axes);

  const group = new THREE.Group();
  scene.add(group);

  const context = {
    renderer,
    scene,
    camera,
    controls,
    container,
    is3D,
    group,
    running: true,
    vertices: [],
    polyhedron: null,
    isoline: null,
    currentPoint: null,
    feasibleSamples: [],
    normals: [],
    range: 10
  };

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  function animate() {
    if (!context.running) return;
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  return { context, dispose };

  function dispose() {
    context.running = false;
    window.removeEventListener('resize', resize);
    controls.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }
}

export function clearGroup(ctx) {
  while (ctx.group.children.length) {
    const c = ctx.group.children.pop();
    if (c.geometry) c.geometry.dispose?.();
    if (c.material) {
      if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose?.());
      else c.material.dispose?.();
    }
  }
  ctx.vertices = [];
  ctx.polyhedron = null;
  ctx.isoline = null;
  ctx.currentPoint = null;
}

export function drawFeasibleRegion(ctx, feasibility, model) {
  clearGroup(ctx);
  if (!feasibility) return;
  const { samples, normals, n } = feasibility;
  ctx.normals = normals;
  ctx.feasibleSamples = samples;

  const maxR = 15;
  const range = maxR;

  if (n <= 2) {
    drawFeasible2D(ctx, normals, samples, range, model);
  } else if (n === 3) {
    drawFeasible3D(ctx, normals, samples, range);
  }
}

function drawFeasible2D(ctx, normals, samples, range, model) {
  const points = samples.map((s) => new THREE.Vector3(s[0], s[1] || 0, 0));
  ctx.vertices = points;

  if (points.length > 2) {
    const hull = convexHull2D(points);
    const shape = new THREE.Shape();
    shape.moveTo(hull[0].x, hull[0].y);
    for (let i = 1; i < hull.length; i++) shape.lineTo(hull[i].x, hull[i].y);
    shape.lineTo(hull[0].x, hull[0].y);
    const geo = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x55e6c1,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -0.01;
    ctx.group.add(mesh);

    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x55e6c1, linewidth: 2 })
    );
    line.rotation.x = -Math.PI / 2;
    line.position.y = 0.01;
    ctx.group.add(line);
  }

  for (const v of points) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x55e6c1 })
    );
    dot.position.set(v.x, 0, v.y);
    ctx.group.add(dot);
  }

  for (const c of normals) {
    drawConstraint2D(ctx, c, range);
  }

  drawIsoline2D(ctx, model, range);
}

function drawConstraint2D(ctx, c, range) {
  const [a, b] = c.coef;
  const rhs = c.rhs;
  const points = [];
  if (Math.abs(b) > 1e-6) {
    for (let x = 0; x <= range; x += range / 20) {
      const y = (rhs - a * x) / b;
      if (y >= 0 && y <= range * 1.5) points.push(new THREE.Vector3(x, 0, y));
    }
  } else if (Math.abs(a) > 1e-6) {
    const x = rhs / a;
    if (x >= 0 && x <= range) {
      points.push(new THREE.Vector3(x, 0, 0));
      points.push(new THREE.Vector3(x, 0, range));
    }
  }
  if (points.length >= 2) {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xffb86b });
    ctx.group.add(new THREE.Line(geo, mat));
  }
}

function drawIsoline2D(ctx, model, range) {
  const coef = model.objective.coefficients;
  const [a, b] = coef;
  const dir = model.direction === 'max' ? 1 : -1;

  const slider = { t: 0 };
  ctx.isoline = {
    update(dt) {
      slider.t = (slider.t + dt * 0.5) % 1;
    },
    getLine() {
      const z = slider.t * (a * range + b * range) * dir * 1.5;
      const pts = [];
      if (Math.abs(b) > 1e-6) {
        for (let x = 0; x <= range; x += range / 30) {
          const y = (z - a * x) / b;
          if (y >= -range && y <= range * 2) pts.push(new THREE.Vector3(x, 0, y));
        }
      }
      return pts;
    }
  };
}

function drawFeasible3D(ctx, normals, samples, range) {
  const pts = samples.map((s) => new THREE.Vector3(s[0], s[1], s[2]));
  ctx.vertices = pts;

  if (pts.length > 3) {
    const hull = convexHull3D(pts);
    if (hull && hull.length) {
      const positions = [];
      const colors = [];
      const color = new THREE.Color(0x55e6c1);
      for (const face of hull) {
        positions.push(face[0].x, face[0].y, face[0].z);
        positions.push(face[1].x, face[1].y, face[1].z);
        positions.push(face[2].x, face[2].y, face[2].z);
        for (let i = 0; i < 3; i++) colors.push(color.r, color.g, color.b);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      const mat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      ctx.group.add(mesh);
      ctx.polyhedron = mesh;

      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x55e6c1, transparent: true, opacity: 0.9 })
      );
      ctx.group.add(line);
    }
  }

  for (const v of pts) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x55e6c1 })
    );
    dot.position.copy(v);
    ctx.group.add(dot);
  }
}

function convexHull2D(points) {
  const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}

function convexHull3D(points) {
  if (points.length < 4) return [];
  const faces = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        const a = points[i], b = points[j], c = points[k];
        const ab = new THREE.Vector3().subVectors(b, a);
        const ac = new THREE.Vector3().subVectors(c, a);
        const normal = new THREE.Vector3().crossVectors(ab, ac);
        if (normal.lengthSq() < 1e-6) continue;
        normal.normalize();
        const d = normal.dot(a);
        let side = 0;
        let allOn = true;
        for (let p = 0; p < n; p++) {
          if (p === i || p === j || p === k) continue;
          const v = normal.dot(points[p]) - d;
          if (Math.abs(v) > 1e-4) {
            allOn = false;
            const s = v > 0 ? 1 : -1;
            if (side === 0) side = s;
            else if (side !== s) { side = 2; break; }
          }
        }
        if (side !== 2) faces.push([a, b, c]);
      }
    }
  }
  return faces;
}

export function setCurrentPoint(ctx, pt, status) {
  if (ctx.currentPoint) {
    ctx.group.remove(ctx.currentPoint);
    if (ctx.currentPoint.geometry) ctx.currentPoint.geometry.dispose();
    if (ctx.currentPoint.material) ctx.currentPoint.material.dispose();
  }
  if (!pt) return;
  const color = status === 'optimal' ? 0x55e6c1 : status === 'unbounded' ? 0xffb86b : 0x55e6c1;
  const geo = new THREE.SphereGeometry(0.35, 20, 20);
  const mat = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pt[0] || 0, ctx.is3D ? pt[1] || 0 : 0, ctx.is3D ? pt[2] || 0 : pt[1] || 0);
  ctx.group.add(mesh);

  ctx.currentPoint = {
    mesh,
    scale: 1,
    update(dt) {
      this.scale = 1 + Math.sin(performance.now() * 0.005) * 0.2;
      mesh.scale.setScalar(this.scale);
    }
  };
}

export function animatePulse(ctx, pt) {
  const color = 0x55e6c1;
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.5, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    if (ctx.is3D) {
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(pt[0] || 0, pt[1] || 0, pt[2] || 0);
    } else {
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(pt[0] || 0, 0.02, pt[1] || 0);
    }
    ring.userData = { life: 0, offset: i * 0.4 };
    ctx.group.add(ring);
    rings.push(ring);
  }
  return {
    update(dt) {
      for (const r of rings) {
        r.userData.life += dt;
        const t = (r.userData.life + r.userData.offset) % 1.5;
        const s = 1 + t * 4;
        r.scale.setScalar(s);
        r.material.opacity = Math.max(0, 0.8 - t * 0.5);
      }
    }
  };
}
