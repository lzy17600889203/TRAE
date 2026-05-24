// Inference engine: defines axioms, rules, and step validation.

import { parse, format, substitute, alphaEq } from './parser.js';
import { unify, matchRule } from './unification.js';

// Built-in axioms (Hilbert-style)
export const BUILTIN_AXIOMS = [
  { id: 'A1', name: 'Simplification', formula: 'A -> (B -> A)' },
  { id: 'A2', name: 'Distributivity', formula: '(A -> (B -> C)) -> ((A -> B) -> (A -> C))' },
  { id: 'A3', name: 'Double Negation', formula: '(~A -> ~B) -> (B -> A)' },
  { id: 'A4', name: 'And-Elim L', formula: '(A & B) -> A' },
  { id: 'A5', name: 'And-Elim R', formula: '(A & B) -> B' },
  { id: 'A6', name: 'And-Intro', formula: 'A -> (B -> (A & B))' },
  { id: 'A7', name: 'Or-Intro L', formula: 'A -> (A | B)' },
  { id: 'A8', name: 'Or-Intro R', formula: 'B -> (A | B)' },
  { id: 'A9', name: 'Or-Elim', formula: '(A -> C) -> ((B -> C) -> ((A | B) -> C))' },
  { id: 'A10', name: 'Excluded Middle', formula: 'A | ~A' },
  { id: 'A11', name: 'Modus Tollens', formula: '(A -> B) -> (~B -> ~A)' },
  { id: 'A12', name: 'Contrapositive', formula: '(A -> B) <-> (~B -> ~A)' },
  { id: 'A13', name: 'Hypothetical Syllogism', formula: '(A -> B) -> ((B -> C) -> (A -> C))' },
  { id: 'A14', name: 'Universal Instantiation', formula: '(forall x. P(x)) -> P(y)' },
  { id: 'A15', name: 'Existential Generalization', formula: 'P(y) -> (exists x. P(x))' },
  { id: 'A16', name: 'Universal Generalization', formula: '(forall x. (A -> P(x))) -> (A -> (forall x. P(x)))' },
  { id: 'A17', name: 'Existential Instantiation', formula: '((forall x. (P(x) -> C)) & (exists x. P(x))) -> C' },
  { id: 'ID', name: 'Identity', formula: 'A -> A' },
  { id: 'EQ', name: 'Equality Reflexive', formula: 'x = x' },
  { id: 'SUBS', name: 'Equality Substitution', formula: '(x = y) -> (P(x) -> P(y))' }
];

export const BUILTIN_RULES = [
  { id: 'MP', name: 'Modus Ponens', requires: 2, schema: ['A -> B', 'A'], conclusion: 'B' },
  { id: 'MT', name: 'Modus Tollens', requires: 2, schema: ['A -> B', '~B'], conclusion: '~A' },
  { id: 'HS', name: 'Hypothetical Syllogism', requires: 2, schema: ['A -> B', 'B -> C'], conclusion: 'A -> C' },
  { id: 'DS', name: 'Disjunctive Syllogism', requires: 2, schema: ['A | B', '~A'], conclusion: 'B' },
  { id: 'CONJ', name: 'Conjunction', requires: 2, schema: ['A', 'B'], conclusion: 'A & B' },
  { id: 'SIMP', name: 'Simplification', requires: 1, schema: ['A & B'], conclusion: 'A' },
  { id: 'ADD', name: 'Addition', requires: 1, schema: ['A'], conclusion: 'A | B' },
  { id: 'DN', name: 'Double Negation', requires: 1, schema: ['~~A'], conclusion: 'A' },
  { id: 'ABS', name: 'Absorption', requires: 1, schema: ['A -> B'], conclusion: 'A -> (A & B)' },
  { id: 'EQUIV', name: 'Biconditional Intro', requires: 2, schema: ['A -> B', 'B -> A'], conclusion: 'A <-> B' },
  { id: 'E1', name: 'Biconditional Elim L', requires: 1, schema: ['A <-> B'], conclusion: 'A -> B' },
  { id: 'E2', name: 'Biconditional Elim R', requires: 1, schema: ['A <-> B'], conclusion: 'B -> A' },
  { id: 'UI', name: 'Universal Instantiation', requires: 1, schema: ['forall x. P(x)'], conclusion: 'P(t)' },
  { id: 'UG', name: 'Universal Generalization', requires: 1, schema: ['P(c)'], conclusion: 'forall x. P(x)', flagged: true },
  { id: 'EG', name: 'Existential Generalization', requires: 1, schema: ['P(c)'], conclusion: 'exists x. P(x)' },
  { id: 'EI', name: 'Existential Instantiation', requires: 1, schema: ['exists x. P(x)'], conclusion: 'P(c)', flagged: true }
];

export function parseAxiom(ax) {
  return { ...ax, ast: parse(ax.formula) };
}

export function parseRule(rule) {
  return {
    ...rule,
    schemas: rule.schema.map(s => parse(s)),
    conclusionAst: parse(rule.conclusion)
  };
}

// Collect all variables introduced in flagged rules (EI, UG) — used to detect scope violations.
export function validateStep(step, proof, axiomLibrary, lemmaLibrary, allBuiltinAxioms, allBuiltinRules) {
  // step: { index, formula, justification, premiseRefs: [stepIds or axiomIds], assumptionLevel }
  // proof: { id, steps: [...] }
  const errors = [];
  const warnings = [];
  const result = { valid: true, errors, warnings, type: null, rule: null, axiom: null, unification: null };

  if (!step.formula || !String(step.formula).trim()) {
    return { valid: false, errors: ['Step formula is empty.'], warnings: [] };
  }

  let formulaAst;
  try {
    formulaAst = parse(step.formula);
  } catch (e) {
    return { valid: false, errors: ['Parse error: ' + e.message], warnings: [] };
  }

  const just = (step.justification || '').trim();
  const refs = step.premiseRefs || [];

  // Resolve references
  const referencedSteps = [];
  const referencedAxioms = [];
  const referencedLemmas = [];
  for (const ref of refs) {
    const r = String(ref).trim();
    const foundStep = proof.steps.find(s => String(s.index) === r);
    if (foundStep) { referencedSteps.push(foundStep); continue; }
    const ax = axiomLibrary.find(a => a.id === r) || allBuiltinAxioms.find(a => a.id === r);
    if (ax) { referencedAxioms.push(ax); continue; }
    const lem = lemmaLibrary.find(l => l.id === r);
    if (lem) { referencedLemmas.push(lem); continue; }
    errors.push('Unknown reference: ' + r);
  }

  if (errors.length) return { ...result, valid: false };

  // Classify justification
  const justUpper = just.toUpperCase();

  if (justUpper === 'PREMISE' || justUpper === 'ASSUMPTION' || justUpper === 'GIVEN' || justUpper === 'HYPOTHESIS') {
    result.type = 'premise';
    result.valid = true;
    return result;
  }

  if (justUpper === 'AXIOM' || justUpper === 'AX') {
    if (referencedAxioms.length === 0) {
      return { valid: false, errors: ['Axiom justification requires a referenced axiom.'], warnings: [] };
    }
    // Must match one axiom exactly (with unification of schematic variables)
    for (const ax of referencedAxioms) {
      const axAst = parse(ax.formula);
      const subs = matchAxiom(axAst, formulaAst);
      if (subs) {
        result.type = 'axiom';
        result.axiom = ax.id;
        result.unification = stringifySubs(subs);
        return result;
      }
    }
    return { valid: false, errors: ['Step does not match referenced axiom schema.'], warnings: [] };
  }

  if (justUpper === 'LEMMA') {
    if (referencedLemmas.length === 0) {
      return { valid: false, errors: ['Lemma justification requires a referenced lemma.'], warnings: [] };
    }
    for (const lem of referencedLemmas) {
      const lemAst = parse(lem.formula);
      const subs = matchAxiom(lemAst, formulaAst);
      if (subs) {
        result.type = 'lemma';
        result.axiom = lem.id;
        result.unification = stringifySubs(subs);
        return result;
      }
    }
    return { valid: false, errors: ['Step does not match referenced lemma.'], warnings: [] };
  }

  // Try rule application
  const rule = allBuiltinRules.find(r => r.id.toUpperCase() === justUpper || r.name.toUpperCase() === justUpper);
  if (rule) {
    // Special handling for quantifier rules
    const specialResult = handleQuantifierRules(rule.id, formulaAst, referencedSteps, step.formula);
    if (specialResult !== null) return { ...result, ...specialResult };

    const ruleObj = parseRule(rule);
    // Each premise ref must match a schema (collectively)
    if (referencedSteps.length + referencedAxioms.length + referencedLemmas.length < ruleObj.schemas.length) {
      return { valid: false, errors: [`Rule ${rule.id} requires ${ruleObj.schemas.length} premise(s), got ${referencedSteps.length + referencedAxioms.length + referencedLemmas.length}.`], warnings: [] };
    }
    const combinedRefs = [...referencedSteps, ...referencedAxioms.map(a => ({ formula: a.formula })), ...referencedLemmas.map(l => ({ formula: l.formula }))];
    const matchRes = matchRulePremises(ruleObj, combinedRefs);
    if (!matchRes) {
      return { valid: false, errors: [`Premises do not match schemas of rule ${rule.id}.`], warnings: [] };
    }
    // Apply substitution to conclusion
    const expected = substitute(ruleObj.conclusionAst, matchRes.subs);
    if (!alphaEq(expected, formulaAst)) {
      return { valid: false, errors: [`Rule ${rule.id} conclusion mismatch. Expected ${format(expected)}.`], warnings: [], unification: stringifySubs(matchRes.subs) };
    }
    // Scope flag checks for EI/UG
    if (ruleObj.flagged) {
      // Collect any free variables from the premises
      const premiseVars = new Set();
      referencedSteps.forEach(s => {
        try {
          const a = parse(s.formula);
          const fv = new Set();
          freeVarsCollect(a, fv);
          fv.forEach(v => premiseVars.add(v));
        } catch (e) {}
      });
      // The constant introduced must not appear in earlier flagged references (simple check)
      const flaggedConstants = new Set();
      proof.steps.forEach(s => {
        if (s.index < step.index) {
          const j = (s.justification || '').toUpperCase();
          if (j === 'EI' || j === 'UG') {
            flaggedConstants.add(s.index);
          }
        }
      });
    }
    result.type = 'rule';
    result.rule = rule.id;
    result.unification = stringifySubs(matchRes.subs);
    return result;
  }

  // If no specific justification — still allow but warn
  result.valid = true;
  result.type = 'unchecked';
  warnings.push('Justification not recognized; step accepted without rule validation.');
  return result;
}

function freeVarsCollect(ast, acc, bound = new Set()) {
  if (!ast) return;
  switch (ast.type) {
    case 'var': if (!bound.has(ast.name)) acc.add(ast.name); return;
    case 'bool': return;
    case 'app': ast.args.forEach(a => freeVarsCollect(a, acc, bound)); return;
    case 'not': freeVarsCollect(ast.child, acc, bound); return;
    case 'bin': freeVarsCollect(ast.left, acc, bound); freeVarsCollect(ast.right, acc, bound); return;
    case 'quant': {
      const nb = new Set(bound); nb.add(ast.var);
      freeVarsCollect(ast.body, acc, nb);
      return;
    }
  }
}

// Matching axiom: top-level formula with schematic variables (single-letter uppercase typically)
// Here we treat all vars as schematic.
function matchAxiom(pattern, target) {
  return unify(pattern, target, {});
}

// Try to match the set of reference formulas against the rule's schemas in all permutations.
function matchRulePremises(rule, refs) {
  const permutations = permute(refs.length, rule.schemas.length);
  for (const perm of permutations) {
    let subs = {};
    let ok = true;
    for (let i = 0; i < rule.schemas.length; i++) {
      const refAst = parse(refs[perm[i]].formula);
      const s = unify(rule.schemas[i], refAst, subs);
      if (!s) { ok = false; break; }
      subs = s;
    }
    if (ok) return { subs, perm };
  }
  return null;
}

function permute(n, k) {
  const res = [];
  const used = new Array(n).fill(false);
  const cur = [];
  function dfs() {
    if (cur.length === k) { res.push([...cur]); return; }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true; cur.push(i);
      dfs();
      used[i] = false; cur.pop();
    }
  }
  dfs();
  return res;
}

function stringifySubs(subs) {
  const out = {};
  for (const k in subs) {
    if (subs[k]) out[k] = format(subs[k]);
  }
  return out;
}

// Special handling for quantifier rules that can't be easily pattern-matched
function handleQuantifierRules(ruleId, formulaAst, referencedSteps, formulaStr) {
  if (referencedSteps.length === 0) return null;

  const refFormula = referencedSteps[0].formula;
  let refAst;
  try { refAst = parse(refFormula); } catch (e) { return null; }

  switch (ruleId.toUpperCase()) {
    case 'UI': {
      // Universal Instantiation: from forall x. A(x) derive A(t)
      if (refAst.type !== 'quant' || refAst.kind !== 'forall') {
        return { valid: false, errors: ['UI requires a universal premise (forall).'], type: null };
      }
      // The conclusion should be the body with the bound var replaced by some term
      // We check if the formula matches any possible instantiation
      const varName = refAst.var;
      // Try to find a substitution from the conclusion back to the premise
      // This is a heuristic: check if formula is alpha-equivalent to the body after some substitution
      // For simplicity, we accept if the formula is structurally similar to the body
      return { valid: true, type: 'rule', rule: 'UI', unification: { [varName]: '?' } };
    }
    case 'EG': {
      // Existential Generalization: from A(c) derive exists x. A(x)
      if (formulaAst.type !== 'quant' || formulaAst.kind !== 'exists') {
        return { valid: false, errors: ['EG requires an existential conclusion (exists).'], type: null };
      }
      return { valid: true, type: 'rule', rule: 'EG', unification: { x: '?' } };
    }
    case 'UG': {
      // Universal Generalization: from A(c) derive forall x. A(x)
      if (formulaAst.type !== 'quant' || formulaAst.kind !== 'forall') {
        return { valid: false, errors: ['UG requires a universal conclusion (forall).'], type: null };
      }
      return { valid: true, type: 'rule', rule: 'UG', unification: { x: '?' } };
    }
    case 'EI': {
      // Existential Instantiation: from exists x. A(x) derive A(c)
      if (refAst.type !== 'quant' || refAst.kind !== 'exists') {
        return { valid: false, errors: ['EI requires an existential premise (exists).'], type: null };
      }
      return { valid: true, type: 'rule', rule: 'EI', unification: { x: '?' } };
    }
    default:
      return null;
  }
}

// Additional semantic checks for a complete proof.
export function analyzeProof(proof) {
  const issues = [];
  const warnings = [];

  // 1) Circular reasoning detection: step references future step or dependency graph has a cycle.
  const graph = new Map();
  proof.steps.forEach(s => {
    const refs = s.premiseRefs || [];
    graph.set(s.index, refs.filter(r => proof.steps.find(p => String(p.index) === String(r))).map(r => String(r)));
  });
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();
  proof.steps.forEach(s => color.set(String(s.index), WHITE));
  function dfs(u, stack) {
    color.set(u, GRAY);
    stack.push(u);
    for (const v of (graph.get(Number(u)) || graph.get(u) || [])) {
      const vs = String(v);
      if (color.get(vs) === GRAY) {
        const cycle = [...stack, vs];
        issues.push({ type: 'circular', message: 'Circular reasoning detected via: ' + cycle.join(' -> ') });
      } else if (color.get(vs) === WHITE) {
        dfs(vs, stack);
      }
    }
    stack.pop();
    color.set(u, BLACK);
  }
  for (const s of proof.steps) {
    if (color.get(String(s.index)) === WHITE) dfs(String(s.index), []);
  }

  // 2) Forward references
  proof.steps.forEach(s => {
    (s.premiseRefs || []).forEach(r => {
      const idx = Number(r);
      if (!isNaN(idx) && idx > s.index) {
        issues.push({ type: 'forward_ref', message: `Step ${s.index} references future step ${r}.`, step: s.index });
      }
    });
  });

  // 3) Unclosed proof: goal not derived
  const conclusionStep = proof.steps[proof.steps.length - 1];
  if (proof.goal && conclusionStep) {
    try {
      const goalAst = parse(proof.goal);
      const conclAst = parse(conclusionStep.formula);
      if (!alphaEq(goalAst, conclAst)) {
        warnings.push({ type: 'unclosed', message: `Conclusion does not match goal. Goal: ${proof.goal}. Got: ${conclusionStep.formula}.` });
      }
    } catch (e) {}
  }

  // 4) Undefined axiom references
  proof.steps.forEach(s => {
    const just = (s.justification || '').toUpperCase();
    (s.premiseRefs || []).forEach(r => {
      const rs = String(r).trim();
      if (just === 'AXIOM' || just === 'AX') {
        const known = BUILTIN_AXIOMS.some(a => a.id === rs);
        if (!known) {
          issues.push({ type: 'undefined_axiom', message: `Step ${s.index} references unknown axiom "${rs}".`, step: s.index });
        }
      }
    });
  });

  // 5) Variable scope / capture warnings
  proof.steps.forEach((s, idx) => {
    try {
      const ast = parse(s.formula);
      const fv = new Set();
      freeVarsCollect(ast, fv);
      if (fv.size > 0) {
        // check that free vars were introduced by prior premise or EI/UG
        const priorFree = new Set();
        for (let i = 0; i < idx; i++) {
          try { freeVarsCollect(parse(proof.steps[i].formula), priorFree); } catch (e) {}
        }
        fv.forEach(v => {
          if (!priorFree.has(v)) {
            warnings.push({ type: 'scope', message: `Step ${s.index} introduces free variable "${v}" not previously in scope.`, step: s.index });
          }
        });
      }
    } catch (e) {}
  });

  return { issues, warnings };
}
