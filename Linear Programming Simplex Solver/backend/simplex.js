const EPS = 1e-9;

export function buildStandardForm(model) {
  const objective = model.objective;
  const direction = model.direction || 'max';
  const constraints = model.constraints || [];

  const variables =
    objective.variables ||
    Array.from({ length: (objective.coefficients || []).length }, (_, i) => `x${i + 1}`);
  const n = variables.length;
  const c = objective.coefficients.slice();

  const rows = [];
  for (const con of constraints) {
    const rowCoef = new Array(n).fill(0);
    for (const term of con.terms || []) {
      const idx = variables.indexOf(term.name);
      if (idx >= 0) rowCoef[idx] = term.coefficient;
    }
    rows.push({
      coefficients: rowCoef.slice(),
      op: con.op || '<=',
      rhs: con.rhs ?? 0,
      label: con.label || ''
    });
  }

  const slackVars = [];
  const m = rows.length;
  for (let i = 0; i < m; i++) {
    const name = `s${i + 1}`;
    slackVars.push(name);
    if (rows[i].op === '<=') {
      rows[i].coefficients.push(1);
    } else if (rows[i].op === '>=') {
      rows[i].coefficients.push(-1);
    } else if (rows[i].op === '=') {
      rows[i].coefficients.push(0);
    }
  }

  const totalVars = n + m;
  const cExtended = c.concat(new Array(m).fill(0));

  if (direction === 'min') {
    for (let i = 0; i < cExtended.length; i++) cExtended[i] = -cExtended[i];
  }

  const basis = [];
  for (let i = 0; i < m; i++) {
    basis.push(n + i);
  }

  const tableau = [];
  for (let i = 0; i < m; i++) {
    const row = rows[i].coefficients.concat([rows[i].rhs]);
    while (row.length < totalVars + 1) row.splice(row.length - 1, 0, 0);
    tableau.push(row);
  }

  const objRow = cExtended.map((v) => -v).concat([0]);
  while (objRow.length < totalVars + 1) objRow.splice(objRow.length - 1, 0, 0);

  return {
    variables,
    slackVars,
    totalVars,
    originalN: n,
    m,
    direction,
    c: cExtended,
    tableau,
    objRow,
    basis,
    rowsMeta: rows.map((r) => ({ op: r.op, rhs: r.rhs, label: r.label }))
  };
}

export function solveSimplex(std) {
  const { m, totalVars, rowsMeta } = std;
  const nCols = totalVars + 1;

  const tableau = std.tableau.map((r) => r.slice());
  const objRow = std.objRow.slice();
  const basis = std.basis.slice();

  const history = [];
  const seenBases = new Set();

  history.push({
    step: 0,
    tableau: cloneTableau(tableau, objRow),
    basis: basis.slice(),
    entering: null,
    leaving: null,
    pivot_row: null,
    pivot_col: null,
    notes: '初始单纯形表（引入松弛变量）',
    z: objRow[objRow.length - 1]
  });

  let step = 0;
  const MAX_ITER = 50;
  const CYCLE_LIMIT = 6;

  while (step < MAX_ITER) {
    let entering = -1;
    let mostNeg = 0;
    for (let j = 0; j < totalVars; j++) {
      if (objRow[j] < mostNeg - EPS) {
        mostNeg = objRow[j];
        entering = j;
      }
    }
    if (entering === -1) {
      history.push({
        step: step + 1,
        tableau: cloneTableau(tableau, objRow),
        basis: basis.slice(),
        entering: null,
        leaving: null,
        pivot_row: null,
        pivot_col: null,
        notes: '最优解已找到',
        status: 'optimal',
        z: objRow[objRow.length - 1]
      });
      return { history, status: 'optimal', final: extractSolution(std, tableau, objRow, basis) };
    }

    let pivotRow = -1;
    let minRatio = Infinity;
    let hasDegenerate = false;
    for (let i = 0; i < m; i++) {
      const a = tableau[i][entering];
      const b = tableau[i][nCols - 1];
      if (a > EPS) {
        const ratio = b / a;
        if (ratio < minRatio - EPS) {
          minRatio = ratio;
          pivotRow = i;
          hasDegenerate = false;
        } else if (Math.abs(ratio - minRatio) <= EPS) {
          hasDegenerate = true;
        }
      }
    }

    if (pivotRow === -1) {
      history.push({
        step: step + 1,
        tableau: cloneTableau(tableau, objRow),
        basis: basis.slice(),
        entering,
        leaving: null,
        pivot_row: null,
        pivot_col: entering,
        notes: '目标函数无界：进基列全部非正',
        status: 'unbounded',
        z: objRow[objRow.length - 1]
      });
      return { history, status: 'unbounded' };
    }

    if (hasDegenerate) {
      history[history.length - 1].notes = (history[history.length - 1].notes || '') + '；出现退化现象';
    }

    const pivot = tableau[pivotRow][entering];
    const leavingVar = basis[pivotRow];

    for (let j = 0; j < nCols; j++) {
      tableau[pivotRow][j] = tableau[pivotRow][j] / pivot;
    }
    for (let i = 0; i < m; i++) {
      if (i !== pivotRow) {
        const factor = tableau[i][entering];
        if (Math.abs(factor) > EPS) {
          for (let j = 0; j < nCols; j++) {
            tableau[i][j] -= factor * tableau[pivotRow][j];
          }
        }
      }
    }
    const factorObj = objRow[entering];
    if (Math.abs(factorObj) > EPS) {
      for (let j = 0; j < nCols; j++) {
        objRow[j] -= factorObj * tableau[pivotRow][j];
      }
    }

    basis[pivotRow] = entering;

    step++;
    const notes =
      `第 ${step} 次迭代：进基 x${entering + 1}, 出基 ${leavingVar + 1 > std.originalN ? 's' + (leavingVar - std.originalN + 1) : 'x' + (leavingVar + 1)}`;

    history.push({
      step,
      tableau: cloneTableau(tableau, objRow),
      basis: basis.slice(),
      entering,
      leaving: leavingVar,
      pivot_row: pivotRow,
      pivot_col: entering,
      notes,
      z: objRow[objRow.length - 1]
    });

    const basisKey = basis.slice().sort((a, b) => a - b).join(',');
    if (seenBases.has(basisKey)) {
      history[history.length - 1].notes = notes + '；基重复，检测到循环';
      history.push({
        step: step + 1,
        tableau: cloneTableau(tableau, objRow),
        basis: basis.slice(),
        entering: null,
        leaving: null,
        pivot_row: null,
        pivot_col: null,
        notes: '检测到循环迭代不收敛（退化导致基重复）',
        status: 'cycling',
        z: objRow[objRow.length - 1]
      });
      return { history, status: 'cycling', final: extractSolution(std, tableau, objRow, basis) };
    }
    seenBases.add(basisKey);
  }

  return { history, status: 'max_iter', final: extractSolution(std, tableau, objRow, basis) };
}

export function detectInfeasible(std) {
  const { m, totalVars, rowsMeta } = std;
  for (let i = 0; i < m; i++) {
    const b = std.tableau[i][totalVars];
    if (b < -EPS) return true;
  }
  return false;
}

function cloneTableau(tableau, objRow) {
  return tableau.map((r) => r.slice()).concat([objRow.slice()]);
}

function extractSolution(std, tableau, objRow, basis) {
  const n = std.originalN;
  const m = std.m;
  const nCols = std.totalVars + 1;
  const x = new Array(n).fill(0);
  for (let i = 0; i < m; i++) {
    const b = basis[i];
    if (b < n) {
      x[b] = tableau[i][nCols - 1];
    }
  }
  const z = std.direction === 'max' ? objRow[nCols - 1] : -objRow[nCols - 1];
  return { x, z };
}

export function phaseOneCheck(model) {
  const constraints = model.constraints || [];
  for (const con of constraints) {
    if (con.op === '>=' && con.rhs > 0) return 'need_phase1';
    if (con.op === '=' && con.rhs > 0) return 'need_phase1';
  }
  return 'ok';
}

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
    const steps = 6;
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
    if (c.op === '<=' && val > c.rhs + 1e-6) return false;
    if (c.op === '>=' && val < c.rhs - 1e-6) return false;
    if (c.op === '=' && Math.abs(val - c.rhs) > 1e-6) return false;
  }
  for (const x of pt) if (x < -1e-6) return false;
  return true;
}
