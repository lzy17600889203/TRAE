import { Component, Input } from '@angular/core';
import { ProofStep } from '../../services/proof.service';

interface TreeNode {
  step: ProofStep;
  children: TreeNode[];
  level: number;
}

@Component({
  selector: 'app-proof-tree',
  template: `
    <div class="proof-tree" *ngIf="nodes.length">
      <div class="tree-title">证明树</div>
      <div class="tree-container">
        <div *ngFor="let node of nodes" class="tree-node"
             [style.marginLeft.px]="node.level * 24"
             [attr.data-level]="node.level">
          <div class="node-connector" *ngIf="node.level > 0"></div>
          <span class="node-idx">{{ node.step.index }}</span>
          <app-logic-renderer [formula]="node.step.formula"></app-logic-renderer>
          <span class="node-just">{{ node.step.justification }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .proof-tree { background: #141833; border: 1px solid #2a3056; border-radius: 8px; padding: 12px; margin-top: 14px; }
    .tree-title { font-size: 13px; color: #8d97cc; margin-bottom: 10px; letter-spacing: 1px; }
    .tree-container { position: relative; }
    .tree-node { display: flex; align-items: center; padding: 6px 0; border-bottom: 1px dashed #22284d; position: relative; }
    .tree-node:last-child { border-bottom: none; }
    .node-connector { position: absolute; left: -24px; top: 50%; width: 24px; border-top: 1px dotted #4a5490; }
    .node-idx { color: #7cc8ff; font-weight: bold; margin-right: 10px; min-width: 28px; }
    .node-just { margin-left: auto; font-size: 12px; color: #ffb380; font-family: monospace; }
  `]
})
export class ProofTreeComponent {
  @Input() steps: ProofStep[] = [];

  get nodes(): TreeNode[] {
    if (!this.steps) return [];
    const byIdx = new Map<number, ProofStep>();
    this.steps.forEach(s => byIdx.set(Number(s.index), s));

    // Build dependency graph: a child depends on its premise refs.
    // Level 0 = no references. Level = max(ref's level) + 1
    const levels = new Map<number, number>();
    function compute(s: ProofStep): number {
      const key = Number(s.index);
      if (levels.has(key)) return levels.get(key)!;
      const refs = (s.premiseRefs || []).map(r => Number(r)).filter(r => byIdx.has(r));
      if (refs.length === 0) { levels.set(key, 0); return 0; }
      let max = -1;
      for (const r of refs) {
        const rs = compute(byIdx.get(r)!);
        if (rs > max) max = rs;
      }
      const l = max + 1;
      levels.set(key, l);
      return l;
    }
    this.steps.forEach(s => compute(s));
    return this.steps.map(s => ({
      step: s,
      children: [],
      level: levels.get(Number(s.index)) || 0
    }));
  }
}
