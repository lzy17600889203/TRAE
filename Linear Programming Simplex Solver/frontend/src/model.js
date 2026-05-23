export const DEFAULT_MODEL = {
  name: '示例模型',
  objective: {
    variables: ['x1', 'x2'],
    coefficients: [3, 5]
  },
  direction: 'max',
  constraints: [
    {
      label: 'C1',
      terms: [
        { name: 'x1', coefficient: 1 },
        { name: 'x2', coefficient: 0 }
      ],
      op: '<=',
      rhs: 4
    },
    {
      label: 'C2',
      terms: [
        { name: 'x1', coefficient: 0 },
        { name: 'x2', coefficient: 2 }
      ],
      op: '<=',
      rhs: 12
    },
    {
      label: 'C3',
      terms: [
        { name: 'x1', coefficient: 3 },
        { name: 'x2', coefficient: 2 }
      ],
      op: '<=',
      rhs: 18
    }
  ]
};

export function cloneModel(m) {
  return JSON.parse(JSON.stringify(m));
}

export function formatNum(n, digits = 4) {
  if (n === null || n === undefined || isNaN(n)) return '-';
  if (Math.abs(n) < 1e-9) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e6 || abs < 1e-4) return n.toExponential(2);
  const s = n.toFixed(digits);
  return s.replace(/\.?0+$/, '');
}
