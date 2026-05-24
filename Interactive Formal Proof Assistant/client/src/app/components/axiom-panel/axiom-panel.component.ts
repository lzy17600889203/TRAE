import { Component, OnInit } from '@angular/core';
import { ProofService, Axiom, Rule } from '../../services/proof.service';

@Component({
  selector: 'app-axiom-panel',
  template: `
    <div class="axiom-panel">
      <div class="tabs">
        <button [class.active]="tab === 'axioms'" (click)="tab='axioms'">公理库</button>
        <button [class.active]="tab === 'rules'" (click)="tab='rules'">推理规则</button>
      </div>
      <div class="list" *ngIf="tab === 'axioms'">
        <div class="item" *ngFor="let a of axioms" (click)="copyId(a.id)">
          <div class="item-id">{{ a.id }}</div>
          <div class="item-name">{{ a.name }}</div>
          <div class="item-formula">
            <app-logic-renderer [formula]="a.formula"></app-logic-renderer>
          </div>
          <div class="item-tag" *ngIf="a.builtin">内置</div>
        </div>
      </div>
      <div class="list" *ngIf="tab === 'rules'">
        <div class="item rule" *ngFor="let r of rules">
          <div class="item-id">{{ r.id }}</div>
          <div class="item-name">{{ r.name }}</div>
          <div class="item-schemas">
            <div *ngFor="let s of r.schema"><app-logic-renderer [formula]="s"></app-logic-renderer></div>
            <div class="conclusion">⊢ <app-logic-renderer [formula]="r.conclusion"></app-logic-renderer></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .axiom-panel { background: #141833; border: 1px solid #2a3056; border-radius: 8px; padding: 12px; max-height: 480px; overflow-y: auto; }
    .tabs { display: flex; gap: 4px; margin-bottom: 10px; }
    .tabs button { flex: 1; padding: 6px 10px; background: #1b2045; border: 1px solid #2a3056; color: #9aa3c7;
      border-radius: 4px; cursor: pointer; font-size: 13px; }
    .tabs button.active { background: #2a3366; color: #e8eaff; border-color: #7cc8ff; }
    .list { display: flex; flex-direction: column; gap: 8px; }
    .item { background: #1b2045; border: 1px solid #2a3056; border-radius: 4px; padding: 8px 10px; cursor: pointer;
      position: relative; transition: background .15s; }
    .item:hover { background: #242a5c; }
    .item-id { font-size: 11px; color: #7cc8ff; font-family: monospace; }
    .item-name { font-size: 13px; color: #c8e4ff; margin: 2px 0; }
    .item-formula { font-size: 13px; color: #9aa3c7; }
    .item-tag { position: absolute; top: 6px; right: 8px; font-size: 10px; color: #ffb380;
      border: 1px solid #ffb38040; padding: 1px 4px; border-radius: 3px; }
    .item-schemas { font-size: 12px; color: #9aa3c7; display: flex; flex-direction: column; gap: 2px; margin-top: 4px; }
    .conclusion { margin-top: 4px; padding-top: 4px; border-top: 1px dashed #2a3056; color: #7dffae; }
  `]
})
export class AxiomPanelComponent implements OnInit {
  axioms: Axiom[] = [];
  rules: Rule[] = [];
  tab: 'axioms' | 'rules' = 'axioms';

  constructor(private proofService: ProofService) {}

  ngOnInit(): void {
    this.proofService.listAxioms().subscribe(a => this.axioms = a);
    this.proofService.listRules().subscribe(r => this.rules = r);
  }

  copyId(id: string): void {
    try {
      navigator.clipboard.writeText(id);
    } catch (e) {}
  }
}
