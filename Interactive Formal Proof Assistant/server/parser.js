// Parser for logic formulas
// Supports: ->, &, |, ~, forall, exists, (), variables, predicates
// Operator precedence (low->high): forall/exists, ->, |, &, ~

export function parse(input) {
  const src = (input || '').replace(/\s+/g, ' ').trim();
  const tokens = tokenize(src);
  const p = new Parser(tokens);
  const ast = p.parseFormula();
  if (p.pos < p.tokens.length) {
    throw new Error('Unexpected token: ' + p.tokens[p.pos].value);
  }
  return ast;
}

function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '-' && src[i + 1] === '>') { tokens.push({ type: 'op', value: '->' }); i += 2; continue; }
    if (ch === '<' && src[i + 1] === '-' && src[i + 2] === '>') { tokens.push({ type: 'op', value: '<->' }); i += 3; continue; }
    if (ch === '&' || ch === '∧') { tokens.push({ type: 'op', value: '&' }); i++; continue; }
    if (ch === '|' || ch === '∨') { tokens.push({ type: 'op', value: '|' }); i++; continue; }
    if (ch === '~' || ch === '¬') { tokens.push({ type: 'op', value: '~' }); i++; continue; }
    if (ch === '(') { tokens.push({ type: 'lp', value: '(' }); i++; continue; }
    if (ch === ')') { tokens.push({ type: 'rp', value: ')' }); i++; continue; }
    if (ch === ',') { tokens.push({ type: 'comma', value: ',' }); i++; continue; }
    if (ch === '.') { tokens.push({ type: 'dot', value: '.' }); i++; continue; }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j);
      if (word === 'forall' || word === '∀') tokens.push({ type: 'forall', value: 'forall' });
      else if (word === 'exists' || word === '∃') tokens.push({ type: 'exists', value: 'exists' });
      else if (word === 'true' || word === 'True') tokens.push({ type: 'bool', value: true });
      else if (word === 'false' || word === 'False') tokens.push({ type: 'bool', value: false });
      else tokens.push({ type: 'ident', value: word });
      i = j;
      continue;
    }
    throw new Error('Unknown character: ' + ch);
  }
  return tokens;
}

class Parser {
  constructor(tokens) { this.tokens = tokens; this.pos = 0; }
  peek() { return this.tokens[this.pos]; }
  eat(type, value) {
    const t = this.tokens[this.pos];
    if (!t) throw new Error('Unexpected end of input');
    if (t.type !== type || (value && t.value !== value)) {
      throw new Error(`Expected ${type}${value ? ' ' + value : ''}, got ${t.type} ${t.value}`);
    }
    this.pos++;
    return t;
  }
  tryEat(type, value) {
    const t = this.tokens[this.pos];
    if (t && t.type === type && (!value || t.value === value)) { this.pos++; return t; }
    return null;
  }
  parseFormula() { return this.parseIff(); }
  parseIff() {
    let left = this.parseImp();
    while (this.tryEat('op', '<->')) {
      const right = this.parseImp();
      left = { type: 'bin', op: '<->', left, right };
    }
    return left;
  }
  parseImp() {
    let left = this.parseOr();
    while (this.tryEat('op', '->')) {
      const right = this.parseImp();
      left = { type: 'bin', op: '->', left, right };
    }
    return left;
  }
  parseOr() {
    let left = this.parseAnd();
    while (this.tryEat('op', '|')) {
      const right = this.parseAnd();
      left = { type: 'bin', op: '|', left, right };
    }
    return left;
  }
  parseAnd() {
    let left = this.parseNot();
    while (this.tryEat('op', '&')) {
      const right = this.parseNot();
      left = { type: 'bin', op: '&', left, right };
    }
    return left;
  }
  parseNot() {
    if (this.tryEat('op', '~')) {
      const f = this.parseNot();
      return { type: 'not', child: f };
    }
    const t = this.peek();
    if (t && t.type === 'forall') { this.pos++; return this.parseQuant('forall'); }
    if (t && t.type === 'exists') { this.pos++; return this.parseQuant('exists'); }
    return this.parseAtom();
  }
  parseQuant(kind) {
    const vars = [];
    while (true) {
      const id = this.tryEat('ident');
      if (!id) break;
      vars.push(id.value);
    }
    if (vars.length === 0) throw new Error('Expected variable after ' + kind);
    this.tryEat('dot');
    const body = this.parseFormula();
    let result = body;
    for (let i = vars.length - 1; i >= 0; i--) {
      result = { type: 'quant', kind, var: vars[i], body: result };
    }
    return result;
  }
  parseAtom() {
    const t = this.peek();
    if (!t) throw new Error('Unexpected end of input');
    if (t.type === 'lp') {
      this.pos++;
      const f = this.parseFormula();
      this.eat('rp', ')');
      return f;
    }
    if (t.type === 'bool') { this.pos++; return { type: 'bool', value: t.value }; }
    if (t.type === 'ident') {
      this.pos++;
      const name = t.value;
      const n = this.peek();
      if (n && n.type === 'lp') {
        this.pos++;
        const args = [];
        if (!(this.peek() && this.peek().type === 'rp')) {
          args.push(this.parseFormula());
          while (this.tryEat('comma')) args.push(this.parseFormula());
        }
        this.eat('rp', ')');
        return { type: 'app', name, args };
      }
      return { type: 'var', name };
    }
    throw new Error('Unexpected token: ' + t.value);
  }
}

export function format(ast) {
  if (!ast) return '';
  switch (ast.type) {
    case 'var': return ast.name;
    case 'bool': return ast.value ? 'True' : 'False';
    case 'app': return ast.name + '(' + ast.args.map(format).join(', ') + ')';
    case 'not': return '~' + format(ast.child);
    case 'bin': {
      const l = ast.left.type === 'bin' && prec(ast.left.op) < prec(ast.op) ? '(' + format(ast.left) + ')' : format(ast.left);
      const r = ast.right.type === 'bin' && prec(ast.right.op) < prec(ast.op) ? '(' + format(ast.right) + ')' : format(ast.right);
      return l + ' ' + ast.op + ' ' + r;
    }
    case 'quant': {
      // collapse adjacent same-kind quantifiers
      const vars = [ast.var];
      let cur = ast.body;
      while (cur && cur.type === 'quant' && cur.kind === ast.kind) {
        vars.push(cur.var);
        cur = cur.body;
      }
      const sym = ast.kind === 'forall' ? '∀' : '∃';
      return sym + vars.join(' ') + '. ' + format(cur);
    }
  }
  return '?';
}

function prec(op) {
  if (op === '<->') return 1;
  if (op === '->') return 2;
  if (op === '|') return 3;
  if (op === '&') return 4;
  return 0;
}

export function freeVars(ast, bound = new Set(), acc = new Set()) {
  if (!ast) return acc;
  switch (ast.type) {
    case 'var': if (!bound.has(ast.name)) acc.add(ast.name); return acc;
    case 'bool': return acc;
    case 'app': ast.args.forEach(a => freeVars(a, bound, acc)); return acc;
    case 'not': freeVars(ast.child, bound, acc); return acc;
    case 'bin': freeVars(ast.left, bound, acc); freeVars(ast.right, bound, acc); return acc;
    case 'quant': {
      const nb = new Set(bound); nb.add(ast.var);
      freeVars(ast.body, nb, acc); return acc;
    }
  }
}

export function substitute(ast, subs) {
  if (!ast) return ast;
  switch (ast.type) {
    case 'var': return subs[ast.name] ? subs[ast.name] : ast;
    case 'bool': return ast;
    case 'app': return { ...ast, args: ast.args.map(a => substitute(a, subs)) };
    case 'not': return { ...ast, child: substitute(ast.child, subs) };
    case 'bin': return { ...ast, left: substitute(ast.left, subs), right: substitute(ast.right, subs) };
    case 'quant': {
      // avoid capture
      let body = ast.body;
      let v = ast.var;
      if (subs[v]) {
        const used = new Set();
        for (const k in subs) collectVars(subs[k], used);
        let nv = v;
        while (used.has(nv)) nv = nv + "'";
        const rename = { [v]: { type: 'var', name: nv } };
        body = substitute(body, rename);
        v = nv;
      }
      return { ...ast, var: v, body: substitute(body, subs) };
    }
  }
}

function collectVars(ast, acc) {
  if (!ast) return;
  if (ast.type === 'var') acc.add(ast.name);
  else if (ast.type === 'app') ast.args.forEach(a => collectVars(a, acc));
  else if (ast.type === 'not') collectVars(ast.child, acc);
  else if (ast.type === 'bin') { collectVars(ast.left, acc); collectVars(ast.right, acc); }
  else if (ast.type === 'quant') collectVars(ast.body, acc);
}

export function alphaEq(a, b, mapA = new Map(), mapB = new Map()) {
  if (!a || !b) return false;
  if (a.type !== b.type) return false;
  if (a.type === 'var') {
    const xa = mapA.get(a.name);
    const xb = mapB.get(b.name);
    if (xa === undefined && xb === undefined) return a.name === b.name;
    return xa !== undefined && xb !== undefined && xa === xb;
  }
  if (a.type === 'bool') return a.value === b.value;
  if (a.type === 'app') {
    if (a.name !== b.name || a.args.length !== b.args.length) return false;
    return a.args.every((x, i) => alphaEq(x, b.args[i], mapA, mapB));
  }
  if (a.type === 'not') return alphaEq(a.child, b.child, mapA, mapB);
  if (a.type === 'bin') {
    return a.op === b.op && alphaEq(a.left, b.left, mapA, mapB) && alphaEq(a.right, b.right, mapA, mapB);
  }
  if (a.type === 'quant') {
    if (a.kind !== b.kind) return false;
    const key = mapA.size + '_' + mapB.size;
    const na = new Map(mapA); na.set(a.var, key);
    const nb = new Map(mapB); nb.set(b.var, key);
    return alphaEq(a.body, b.body, na, nb);
  }
  return false;
}
