export const PRESETS = {
  infeasible: {
    name: '可行域为空（无解）',
    objective: { variables: ['x1', 'x2'], coefficients: [3, 2] },
    direction: 'max',
    constraints: [
      { label: 'C1', terms: [{ name: 'x1', coefficient: 1 }, { name: 'x2', coefficient: 1 }], op: '<=', rhs: 1 },
      { label: 'C2', terms: [{ name: 'x1', coefficient: 1 }, { name: 'x2', coefficient: 1 }], op: '>=', rhs: 3 }
    ]
  },
  unbounded: {
    name: '目标函数无界',
    objective: { variables: ['x1', 'x2'], coefficients: [1, 1] },
    direction: 'max',
    constraints: [
      { label: 'C1', terms: [{ name: 'x1', coefficient: -1 }, { name: 'x2', coefficient: 1 }], op: '<=', rhs: 2 },
      { label: 'C2', terms: [{ name: 'x1', coefficient: 1 }, { name: 'x2', coefficient: 0 }], op: '>=', rhs: 1 }
    ]
  },
  degenerate: {
    name: '多重最优解（退化）',
    objective: { variables: ['x1', 'x2', 'x3'], coefficients: [2, 4, 0] },
    direction: 'max',
    constraints: [
      { label: 'C1', terms: [{ name: 'x1', coefficient: 1 }, { name: 'x2', coefficient: 2 }], op: '<=', rhs: 8 },
      { label: 'C2', terms: [{ name: 'x1', coefficient: 1 }, { name: 'x2', coefficient: 1 }], op: '<=', rhs: 6 },
      { label: 'C3', terms: [{ name: 'x1', coefficient: 1 }, { name: 'x2', coefficient: 0 }], op: '<=', rhs: 4 }
    ]
  },
  cycling: {
    name: 'Beale 循环退化场景',
    objective: { variables: ['x1', 'x2', 'x3', 'x4'], coefficients: [0.75, -20, 0.5, -6] },
    direction: 'max',
    constraints: [
      { label: 'C1', terms: [{ name: 'x1', coefficient: 0.25 }, { name: 'x2', coefficient: -8 }, { name: 'x3', coefficient: -1 }, { name: 'x4', coefficient: 9 }], op: '<=', rhs: 0 },
      { label: 'C2', terms: [{ name: 'x1', coefficient: 0.5 }, { name: 'x2', coefficient: -12 }, { name: 'x3', coefficient: -0.5 }, { name: 'x4', coefficient: 3 }], op: '<=', rhs: 0 },
      { label: 'C3', terms: [{ name: 'x1', coefficient: 0 }, { name: 'x2', coefficient: 0 }, { name: 'x3', coefficient: 1 }, { name: 'x4', coefficient: 0 }], op: '<=', rhs: 1 }
    ]
  }
};
