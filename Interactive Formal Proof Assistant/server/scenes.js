// Preset scenes: four preset scenarios as requested.

export const PRESET_SCENES = [
  {
    id: 'syllogism',
    name: '经典三段论场景',
    nameEn: 'Classic Syllogism',
    description: '所有人都会死；苏格拉底是人；因此苏格拉底会死。',
    goal: 'Mortal(Socrates)',
    steps: [
      { index: 1, formula: 'forall x. (Human(x) -> Mortal(x))', justification: 'Premise', premiseRefs: [] },
      { index: 2, formula: 'Human(Socrates)', justification: 'Premise', premiseRefs: [] },
      { index: 3, formula: 'Human(Socrates) -> Mortal(Socrates)', justification: 'UI', premiseRefs: ['1'] },
      { index: 4, formula: 'Mortal(Socrates)', justification: 'MP', premiseRefs: ['3', '2'] }
    ],
    expected: { conclusion: 'Mortal(Socrates)', status: 'valid', error: null }
  },
  {
    id: 'induction',
    name: '数学归纳法场景',
    nameEn: 'Mathematical Induction',
    description: '通过基础步骤 P(0) 和归纳步 P(n)->P(n+1) 证明 forall n. P(n)。',
    goal: 'forall n. P(n)',
    steps: [
      { index: 1, formula: 'P(0)', justification: 'Premise', premiseRefs: [] },
      { index: 2, formula: 'forall k. (P(k) -> P(S(k)))', justification: 'Premise', premiseRefs: [] },
      { index: 3, formula: 'P(0) -> P(S(0))', justification: 'UI', premiseRefs: ['2'] },
      { index: 4, formula: 'P(S(0))', justification: 'MP', premiseRefs: ['3', '1'] },
      { index: 5, formula: 'forall n. P(n)', justification: 'UG', premiseRefs: ['4'] }
    ],
    expected: { conclusion: 'forall n. P(n)', status: 'valid', error: null }
  },
  {
    id: 'circular',
    name: '循环论证场景',
    nameEn: 'Circular Reasoning',
    description: 'P 因为 Q；Q 因为 P。循环引用导致逻辑悖论。',
    goal: 'P',
    steps: [
      { index: 1, formula: 'Q -> P', justification: 'Premise', premiseRefs: [] },
      { index: 2, formula: 'P -> Q', justification: 'Premise', premiseRefs: [] },
      { index: 3, formula: 'P', justification: 'MP', premiseRefs: ['1', '4'] },
      { index: 4, formula: 'Q', justification: 'MP', premiseRefs: ['2', '3'] }
    ],
    expected: { conclusion: 'P', status: 'invalid', error: 'circular' }
  },
  {
    id: 'unclosed',
    name: '未闭合证明场景',
    nameEn: 'Unclosed Proof',
    description: '目标与结论不符，证明未闭合。',
    goal: 'R',
    steps: [
      { index: 1, formula: 'P -> Q', justification: 'Premise', premiseRefs: [] },
      { index: 2, formula: 'Q -> R', justification: 'Premise', premiseRefs: [] },
      { index: 3, formula: 'P', justification: 'Premise', premiseRefs: [] },
      { index: 4, formula: 'Q', justification: 'MP', premiseRefs: ['1', '3'] }
    ],
    expected: { conclusion: 'Q', status: 'unclosed', error: 'goal_mismatch' }
  }
];
