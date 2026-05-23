const EPS = 1e-6;

export function analyzeFeasibility(model) {
  const vars =
    model.objective.variables ||
    Array.from({ length: (model.objective.coefficients || []).length }, (_, i) => `x${i + 1}`);
  const n = vars.length;
  const constraints = model.constraints || [];

  const normals = [];
  for (const con of constraints) {
    const coef = new Array(n).fill(0);
    for (const t of con.terms || []) {
      const idx = vars.indexOf(t.name);
      if (idx >= 0) coef[idx] = t.coefficient;
    }
    normals.push({ coef, op: con.op || '<=', rhs: con.rhs ?? 0, label: con.label || '' });
  }

  if (n <= 3) {
    const samples = [];
    const range = 10;
    const steps = 7;
    for (let i = 0; i <= steps; i++) {
      for (let j = 0; j <= (n >= 2 ? steps : 0); j++) {
        for (let k = 0; k <= (n >= 3 ? steps : 0); k++) {
          const pt = [
            (i / steps) * range,
            n >= 2 ? (j / steps) * range : 0,
            n >= 3 ? (k / steps) * range : 0
          ].slice(0, n);
          if (isFeasible(pt, normals)) samples.push(pt);
        }
      }
    }
    return { feasible: samples.length > 0, samples, normals, n };
  }
  return { feasible: null, samples: [], normals, n };
}

function isFeasible(pt, normals) {
  for (const c of normals) {
    let val = 0;
    for (let i = 0; i < pt.length; i++) val += c.coef[i] * pt[i];
    if (c.op === '<=' && val > c.rhs + EPS) return false;
    if (c.op === '>=' && val < c.rhs - EPS) return false;
    if (c.op === '=' && Math.abs(val - c.rhs) > EPS) return false;
  }
  for (const x of pt) if (x < -EPS) return false;
  return true;
}
