// First-order pattern unification for logic terms
// Returns a substitution map or null on failure
// Terms: { type: 'var'|'app'|'not'|'bin'|'quant'|'bool', ... }

import { alphaEq, substitute, freeVars } from './parser.js';

export function unify(pattern, target, subs = {}) {
  // returns substitution object or null
  if (!pattern || !target) return null;
  // apply existing subst to pattern first
  pattern = applySubs(pattern, subs);
  target = applySubs(target, subs);

  if (pattern.type === 'var') {
    if (target.type === 'var' && pattern.name === target.name) return subs;
    // occurs check
    if (occursIn(pattern.name, target)) return null;
    return { ...subs, [pattern.name]: target };
  }
  if (target.type === 'var') {
    // flexible: allow pattern to match target var by binding pattern
    // but we require pattern be more specific; treat as binding target->pattern if unbound
    return null;
  }
  if (pattern.type === 'bool' && target.type === 'bool') {
    return pattern.value === target.value ? subs : null;
  }
  if (pattern.type === 'app' && target.type === 'app') {
    if (pattern.name !== target.name || pattern.args.length !== target.args.length) return null;
    let s = subs;
    for (let i = 0; i < pattern.args.length; i++) {
      s = unify(pattern.args[i], target.args[i], s);
      if (!s) return null;
    }
    return s;
  }
  if (pattern.type === 'not' && target.type === 'not') {
    return unify(pattern.child, target.child, subs);
  }
  if (pattern.type === 'bin' && target.type === 'bin') {
    if (pattern.op !== target.op) return null;
    const s1 = unify(pattern.left, target.left, subs);
    if (!s1) return null;
    return unify(pattern.right, target.right, s1);
  }
  if (pattern.type === 'quant' && target.type === 'quant') {
    if (pattern.kind !== target.kind) return null;
    // rename pattern's bound var to target's (or a fresh), unify bodies
    const fresh = freshVar(pattern, target);
    const renameP = { [pattern.var]: { type: 'var', name: fresh } };
    const renameT = { [target.var]: { type: 'var', name: fresh } };
    const pb = substitute(pattern.body, renameP);
    const tb = substitute(target.body, renameT);
    return unify(pb, tb, subs);
  }
  return null;
}

function freshVar(a, b) {
  const used = new Set();
  collectAllVars(a, used);
  collectAllVars(b, used);
  let v = '_u';
  let i = 0;
  while (used.has(v)) { v = '_u' + (++i); }
  return v;
}

function collectAllVars(ast, acc) {
  if (!ast) return;
  if (ast.type === 'var') acc.add(ast.name);
  else if (ast.type === 'app') ast.args.forEach(a => collectAllVars(a, acc));
  else if (ast.type === 'not') collectAllVars(ast.child, acc);
  else if (ast.type === 'bin') { collectAllVars(ast.left, acc); collectAllVars(ast.right, acc); }
  else if (ast.type === 'quant') collectAllVars(ast.body, acc);
}

function occursIn(name, term) {
  if (!term) return false;
  if (term.type === 'var') return term.name === name;
  if (term.type === 'app') return term.args.some(a => occursIn(name, a));
  if (term.type === 'not') return occursIn(name, term.child);
  if (term.type === 'bin') return occursIn(name, term.left) || occursIn(name, term.right);
  if (term.type === 'quant') return occursIn(name, term.body);
  return false;
}

function applySubs(term, subs) {
  // full substitution application with idempotence
  let changed = true;
  let cur = term;
  let iterations = 0;
  while (changed && iterations < 20) {
    changed = false;
    iterations++;
    const nxt = substitute(cur, subs);
    if (!alphaEq(cur, nxt)) { changed = true; cur = nxt; }
  }
  return cur;
}

// Match a rule's schema against a step: rule has pattern; step has target.
export function matchRule(pattern, target) {
  return unify(pattern, target, {});
}

export { applySubs };
