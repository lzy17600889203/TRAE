import { Injectable } from '@angular/core';

// Render a logic formula string into HTML with colored logic symbols.
@Injectable({ providedIn: 'root' })
export class LogicRenderService {

  symbolMap: { [k: string]: string } = {
    '<->': '<span class="sym equiv">↔</span>',
    '->': '<span class="sym impl">→</span>',
    '&': '<span class="sym and">∧</span>',
    '|': '<span class="sym or">∨</span>',
    '~': '<span class="sym not">¬</span>',
    'forall': '<span class="sym quant">∀</span>',
    'exists': '<span class="sym quant">∃</span>',
    'True': '<span class="sym bool-t">⊤</span>',
    'False': '<span class="sym bool-f">⊥</span>'
  };

  render(formula: string): string {
    if (!formula) return '';
    let s = formula;
    // Order matters: longer first
    s = s.replace(/<->/g, '\u0000EQ\u0000');
    s = s.replace(/->/g, '\u0000IM\u0000');
    s = s.replace(/forall/g, '\u0000FA\u0000');
    s = s.replace(/exists/g, '\u0000EX\u0000');
    s = s.replace(/True/g, '\u0000TR\u0000');
    s = s.replace(/False/g, '\u0000FL\u0000');
    s = s.replace(/&/g, '<span class="sym and">∧</span>');
    s = s.replace(/\|/g, '<span class="sym or">∨</span>');
    s = s.replace(/~/g, '<span class="sym not">¬</span>');
    s = s.replace(/\u0000EQ\u0000/g, '<span class="sym equiv">↔</span>');
    s = s.replace(/\u0000IM\u0000/g, '<span class="sym impl">→</span>');
    s = s.replace(/\u0000FA\u0000/g, '<span class="sym quant">∀</span>');
    s = s.replace(/\u0000EX\u0000/g, '<span class="sym quant">∃</span>');
    s = s.replace(/\u0000TR\u0000/g, '<span class="sym bool-t">⊤</span>');
    s = s.replace(/\u0000FL\u0000/g, '<span class="sym bool-f">⊥</span>');
    // Highlight variables (standalone identifiers)
    s = s.replace(/\b([A-Z][A-Za-z0-9_]*)\b/g, '<span class="var pred">$1</span>');
    s = s.replace(/\b([a-z][a-z0-9_]*)\b/g, '<span class="var term">$1</span>');
    return s;
  }
}
