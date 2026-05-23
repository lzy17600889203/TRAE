import type { Clause, Formula, Literal } from '../types/index.js';

export function parseDIMACS(input: string): Formula {
  const lines = input.trim().split('\n');
  let variableCount = 0;
  let clauseCount = 0;
  const clauseStrings: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('c')) continue;
    
    if (trimmed.startsWith('p')) {
      const parts = trimmed.split(/\s+/);
      variableCount = parseInt(parts[2]);
      clauseCount = parseInt(parts[3]);
    } else if (trimmed.startsWith('%') || trimmed.startsWith('0')) {
      break;
    } else {
      const literals = trimmed.split(/\s+/).filter(l => l !== '' && l !== '0');
      if (literals.length > 0) {
        clauseStrings.push(trimmed);
      }
    }
  }

  const clauses: Clause[] = [];
  let clauseId = 1;

  for (const clauseStr of clauseStrings) {
    const literals = clauseStr.split(/\s+/)
      .filter(l => l !== '' && l !== '0')
      .map(l => parseInt(l));
    
    if (literals.length > 0) {
      clauses.push({
        id: clauseId++,
        literals,
        isLearned: false,
        activity: 0,
        lbd: literals.length
      });
    }
  }

  return {
    dimacs: input,
    variableCount,
    clauseCount: clauses.length,
    clauses
  };
}

export function parseCNF(input: string): Formula {
  const lines = input.trim().split('\n');
  const clauses: Clause[] = [];
  let maxVar = 0;
  let clauseId = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

    const literals = trimmed
      .split(/[\s,]+/)
      .filter(l => l.length > 0)
      .map(l => {
        let lit = 0;
        if (l.startsWith('-') || l.startsWith('!') || l.startsWith('~')) {
          const varStr = l.slice(1).replace(/^[xX]/, '');
          lit = -parseInt(varStr);
        } else {
          const varStr = l.replace(/^[xX]/, '');
          lit = parseInt(varStr);
        }
        if (Math.abs(lit) > maxVar) {
          maxVar = Math.abs(lit);
        }
        return lit;
      })
      .filter(l => !isNaN(l) && l !== 0);

    if (literals.length > 0) {
      clauses.push({
        id: clauseId++,
        literals,
        isLearned: false,
        activity: 0,
        lbd: literals.length
      });
    }
  }

  const dimacs = generateDIMACS(maxVar, clauses);

  return {
    dimacs,
    variableCount: maxVar,
    clauseCount: clauses.length,
    clauses
  };
}

export function generateDIMACS(varCount: number, clauses: Clause[]): string {
  const lines: string[] = [];
  lines.push(`p cnf ${varCount} ${clauses.length}`);
  
  for (const clause of clauses) {
    const clauseStr = clause.literals.join(' ') + ' 0';
    lines.push(clauseStr);
  }
  
  return lines.join('\n');
}

export function literalToString(lit: Literal): string {
  if (lit > 0) {
    return `x${lit}`;
  } else {
    return `¬x${Math.abs(lit)}`;
  }
}

export function clauseToString(clause: Clause): string {
  return clause.literals.map(l => literalToString(l)).join(' ∨ ');
}

export function clauseToCNFString(clause: Clause): string {
  return clause.literals.map(l => {
    if (l > 0) return `x${l}`;
    return `-x${Math.abs(l)}`;
  }).join(' ');
}
