import type { Formula } from '../types/index.js';
import { parseDIMACS } from './parser.js';

export const PRESET_SCENARIOS = {
  unsatisfiable: {
    name: '不可满足矛盾子句场景',
    description: '经典自相矛盾实例：四个子句形成闭合矛盾环',
    dimacs: `p cnf 2 4
1 2 0
-1 2 0
1 -2 0
-1 -2 0`
  },
  explosion: {
    name: '大规模变量组合爆炸场景',
    description: '20+ 变量，指数级搜索空间，展示超时情况',
    dimacs: `p cnf 20 50
1 2 3 4 5 0
-1 6 7 8 0
2 -6 9 10 0
3 -7 -9 11 0
4 -8 -10 -11 12 0
5 -12 13 14 0
1 -13 -14 15 0
2 -15 16 17 0
3 -16 -17 18 0
4 -18 19 20 0
-1 -2 -3 0
-4 -5 -6 0
-7 -8 -9 0
-10 -11 -12 0
-13 -14 -15 0
-16 -17 -18 0
-19 -20 1 2 0
-3 -4 -5 6 7 0
-8 -9 -10 11 12 0
-13 -14 -15 16 17 0
-18 -19 -20 1 2 0
3 4 5 -6 -7 0
8 9 10 -11 -12 0
13 14 15 -16 -17 0
18 19 20 -1 -2 0
-3 -4 -5 -6 -7 0
-8 -9 -10 -11 -12 0
1 2 3 4 5 6 7 8 9 10 0
-1 -2 -3 -4 -5 -6 -7 -8 0
1 2 3 4 5 6 7 8 9 10 0
-1 -2 -3 -4 -5 -6 -7 -8 0
1 2 3 4 5 6 7 8 9 10 0
-1 -2 -3 -4 -5 -6 -7 -8 0
1 2 3 4 5 6 7 8 9 10 0
-1 -2 -3 -4 -5 -6 -7 -8 0
1 2 3 4 5 6 7 8 9 10 0
-1 -2 -3 -4 -5 -6 -7 -8 0
1 2 3 4 5 6 7 8 9 10 0
-1 -2 -3 -4 -5 -6 -7 -8 0
1 2 3 4 5 6 7 8 9 10 0
-1 -2 -3 -4 -5 -6 -7 -8 0
1 2 3 4 5 6 7 8 9 10 0
-1 -2 -3 -4 -5 -6 -7 -8 0
1 2 3 4 5 6 7 8 9 10 0
-1 -2 -3 -4 -5 -6 -7 -8 0
1 2 3 4 5 6 7 8 9 10 0
-1 -2 -3 -4 -5 -6 -7 -8 0
1 2 3 4 5 6 7 8 9 10 0`
  },
  unitPropagation: {
    name: '单元传播链式反应场景',
    description: '包含长链单元传播的实例，展示传播效率',
    dimacs: `p cnf 10 11
1 0
-1 2 0
-2 3 0
-3 4 0
-4 5 0
-5 6 0
-6 7 0
-7 8 0
-8 9 0
-9 10 0
-10 0`
  },
  pureLiteral: {
    name: '纯文字消除简化场景',
    description: '包含大量纯文字的实例，展示简化效果',
    dimacs: `p cnf 8 14
1 2 3 0
-1 4 0
1 -4 5 0
-1 6 0
2 7 0
-2 8 0
1 2 0
-1 -2 0
3 4 0
-3 -4 0
5 6 0
-5 -6 0
7 8 0
-7 -8 0`
  }
};

export function getPresetFormula(scenario: keyof typeof PRESET_SCENARIOS): Formula {
  const preset = PRESET_SCENARIOS[scenario];
  return parseDIMACS(preset.dimacs);
}

export function getAllPresets(): { id: string; name: string; description: string }[] {
  return Object.entries(PRESET_SCENARIOS).map(([id, data]) => ({
    id,
    name: data.name,
    description: data.description
  }));
}
