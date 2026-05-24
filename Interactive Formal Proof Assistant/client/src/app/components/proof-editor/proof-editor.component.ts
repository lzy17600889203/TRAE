import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ProofService, Proof, ProofStep, StepValidation, ProofAnalysis
} from '../../services/proof.service';
import { AnimationService } from '../../services/animation.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-proof-editor',
  template: `
    <div class="editor-layout">
      <aside class="side-left">
        <app-scene-panel (sceneLoaded)="onSceneLoaded($event)"></app-scene-panel>
        <div class="proof-meta">
          <label>证明名称</label>
          <input type="text" [(ngModel)]="proofName" (ngModelChange)="saveMeta()">
          <label>目标 (Goal)</label>
          <input type="text" [(ngModel)]="proofGoal" (ngModelChange)="saveMeta()" placeholder="例如: Mortal(Socrates)">
          <label>描述</label>
          <textarea rows="2" [(ngModel)]="proofDesc" (ngModelChange)="saveMeta()"></textarea>
          <button class="primary" (click)="newProof()">新建证明</button>
        </div>
      </aside>

      <section class="editor-main">
        <div class="toolbar">
          <button class="primary" (click)="addStep()">+ 添加步骤</button>
          <button (click)="validateAll()">校验全证明</button>
          <button (click)="replayAnimations()">重放动画</button>
          <span class="spacer"></span>
          <span class="status" [class.valid]="analysisStatus.valid" [class.invalid]="!analysisStatus.valid">
            {{ analysisStatus.valid ? '✅ 推导合法' : '⚠ 存在问题' }}
          </span>
          <span class="conn-status" [class.connected]="backendConnected" [class.disconnected]="!backendConnected">
            {{ backendConnected ? '🔗 后端已连接' : '⛔ 后端未连接' }}
          </span>
        </div>

        <div class="analysis-issues" *ngIf="analysis.issues && analysis.issues.length">
          <div class="issue error" *ngFor="let i of analysis.issues">
            <span class="issue-type">{{ i.type }}</span>
            <span class="issue-msg">{{ i.message }}</span>
          </div>
        </div>
        <div class="analysis-warns" *ngIf="analysis.warnings && analysis.warnings.length">
          <div class="issue warn" *ngFor="let w of analysis.warnings">
            <span class="issue-type">{{ w.type }}</span>
            <span class="issue-msg">{{ w.message }}</span>
          </div>
        </div>

        <div class="steps-list" #stepsList>
          <div *ngFor="let step of steps; let idx = index"
               class="step-row"
               #stepRow
               [class.invalid]="validations[idx] && !validations[idx].valid"
               [class.valid]="validations[idx] && validations[idx].valid">
            <div class="step-idx">{{ step.index }}</div>
            <div class="step-formula">
              <input type="text" [(ngModel)]="step.formula"
                     (ngModelChange)="onStepChange(idx)"
                     (focus)="onStepFocus(idx)"
                     [placeholder]="'逻辑命题，如: P -> (Q -> P)'">
              <div class="formula-preview" *ngIf="step.formula">
                <app-logic-renderer [formula]="step.formula"></app-logic-renderer>
              </div>
            </div>
            <div class="step-just">
              <input type="text" [(ngModel)]="step.justification"
                     (ngModelChange)="onStepChange(idx)"
                     list="just-list"
                     placeholder="理由: MP, A1, Premise, UI...">
              <datalist id="just-list">
                <option *ngFor="let r of knownJustifications" [value]="r"></option>
              </datalist>
            </div>
            <div class="step-refs">
              <input type="text" [(ngModel)]="refsString[idx]"
                     (ngModelChange)="onRefsChange(idx)"
                     placeholder="引用: 1,2,A1">
            </div>
            <div class="step-status">
              <span class="check-mark" *ngIf="validations[idx] && validations[idx].valid" #checkMark>✓</span>
              <span class="error-mark" *ngIf="validations[idx] && !validations[idx].valid">✗</span>
            </div>
            <button class="del-btn" (click)="removeStep(idx)">×</button>
            <div class="step-detail" *ngIf="validations[idx] && (validations[idx].errors.length || validations[idx].warnings.length || validations[idx].unification)">
              <div class="unification" *ngIf="validations[idx].unification">
                合一: <span *ngFor="let kv of (validations[idx].unification | keyvalue)">{{kv.key}} → {{kv.value}} </span>
              </div>
              <div class="err-item" *ngFor="let e of validations[idx].errors">• {{e}}</div>
              <div class="warn-item" *ngFor="let w of validations[idx].warnings">• {{w}}</div>
            </div>
          </div>
        </div>

        <app-proof-tree [steps]="steps"></app-proof-tree>
      </section>

      <aside class="side-right">
        <app-axiom-panel></app-axiom-panel>
      </aside>
    </div>
  `,
  styles: [`
    .editor-layout { display: grid; grid-template-columns: 300px 1fr 300px; gap: 16px; }
    .side-left, .side-right { display: flex; flex-direction: column; gap: 12px; }

    .proof-meta { background: #141833; border: 1px solid #2a3056; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
    .proof-meta label { font-size: 11px; color: #8d97cc; letter-spacing: 1px; }
    .proof-meta input, .proof-meta textarea {
      background: #0f1220; border: 1px solid #2a3056; border-radius: 4px; color: #e8eaff;
      padding: 6px 8px; font-size: 13px; font-family: 'Cambria Math', monospace;
    }
    .proof-meta input:focus, .proof-meta textarea:focus { outline: none; border-color: #7cc8ff; }
    .primary { background: linear-gradient(90deg, #4a5bcc, #7cc8ff); color: #0f1220; border: none; border-radius: 4px;
      padding: 8px 14px; font-weight: 600; cursor: pointer; margin-top: 6px; }
    .primary:hover { filter: brightness(1.1); }

    .editor-main { background: #141833; border: 1px solid #2a3056; border-radius: 8px; padding: 16px; min-height: 600px; }

    .toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; }
    .toolbar button { background: #1b2045; border: 1px solid #2a3056; color: #e8eaff; border-radius: 4px;
      padding: 6px 12px; cursor: pointer; font-size: 13px; }
    .toolbar button:hover { background: #242a5c; }
    .toolbar button.primary { background: linear-gradient(90deg, #4a5bcc, #7cc8ff); color: #0f1220; border: none; font-weight: 600; }
    .spacer { flex: 1; }
    .status { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .status.valid { background: rgba(125,255,174,0.15); color: #7dffae; }
    .status.invalid { background: rgba(255,100,100,0.15); color: #ff9a9a; }
    .conn-status { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-left: 8px; }
    .conn-status.connected { background: rgba(125,255,174,0.12); color: #7dffae; }
    .conn-status.disconnected { background: rgba(255,100,100,0.12); color: #ff9a9a; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    .analysis-issues, .analysis-warns { margin-bottom: 10px; display: flex; flex-direction: column; gap: 4px; }
    .issue { padding: 6px 10px; border-radius: 4px; font-size: 12px; }
    .issue.error { background: rgba(255,64,64,0.12); border-left: 3px solid #ff6464; color: #ffb3b3; }
    .issue.warn { background: rgba(255,200,64,0.10); border-left: 3px solid #ffc840; color: #ffe6a0; }
    .issue-type { font-weight: 600; margin-right: 8px; text-transform: uppercase; font-size: 11px; }

    .steps-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .step-row { display: grid; grid-template-columns: 40px 1fr 160px 140px 32px 32px; gap: 8px;
      align-items: center; background: #1b2045; border: 1px solid #2a3056; border-radius: 4px;
      padding: 6px 10px; position: relative; transition: border-color .2s, background .2s; }
    .step-row.valid { border-left: 3px solid #7dffae; }
    .step-row.invalid { border-left: 3px solid #ff6464; animation: shake 0.35s; }
    .step-idx { color: #7cc8ff; font-weight: bold; text-align: center; font-family: monospace; }
    .step-formula, .step-just, .step-refs { display: flex; flex-direction: column; }
    .step-formula input, .step-just input, .step-refs input {
      background: #0f1220; border: 1px solid #2a3056; border-radius: 3px; color: #e8eaff;
      padding: 5px 8px; font-size: 13px; font-family: 'Cambria Math', monospace;
    }
    .step-formula input:focus, .step-just input:focus, .step-refs input:focus { outline: none; border-color: #7cc8ff; }
    .formula-preview { font-size: 12px; color: #9aa3c7; margin-top: 2px; }
    .step-status { text-align: center; font-size: 16px; font-weight: bold; }
    .check-mark { color: #7dffae; display: inline-block; }
    .error-mark { color: #ff6464; }
    .del-btn { background: transparent; border: none; color: #ff6464; cursor: pointer; font-size: 18px; padding: 0; }
    .del-btn:hover { color: #ffa0a0; }
    .step-detail { grid-column: 1 / -1; padding: 6px 0 0; font-size: 11px; color: #9aa3c7; border-top: 1px dashed #2a3056; margin-top: 4px; }
    .unification { color: #6de0ff; margin-bottom: 2px; }
    .err-item { color: #ff9a9a; }
    .warn-item { color: #ffd064; }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
  `]
})
export class ProofEditorComponent implements OnInit {
  proof: Proof | null = null;
  proofId: number | null = null;
  proofName = '';
  proofGoal = '';
  proofDesc = '';
  steps: ProofStep[] = [];
  refsString: string[] = [];
  validations: (StepValidation | null)[] = [];
  analysis: ProofAnalysis = { issues: [], warnings: [] };
  analysisStatus = { valid: true };
  backendConnected = true;
  knownJustifications: string[] = [];

  @ViewChildren('stepRow') stepRows!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('stepsList') stepsListRef!: ElementRef<HTMLElement>;

  private typingTimers: any[] = [];

  constructor(
    private proofService: ProofService,
    private route: ActivatedRoute,
    private router: Router,
    private anim: AnimationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.proofService.listRules()
      .pipe(catchError(() => {
        this.backendConnected = false;
        return of([]);
      }))
      .subscribe(rs => {
        this.knownJustifications = [
          'Premise', 'Assumption', 'Given', 'Hypothesis', 'Axiom', 'Lemma',
          ...rs.map(r => r.id), ...rs.map(r => r.name)
        ];
      });

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.proofId = Number(id);
        this.proofService.getProof(this.proofId)
          .pipe(catchError(err => {
            this.backendConnected = false;
            console.warn('Failed to load proof', err);
            return of(null);
          }))
          .subscribe(p => {
            if (p) {
              this.backendConnected = true;
              this.setProof(p);
            }
          });
      } else {
        this.proofService.listProofs()
          .pipe(catchError(err => {
            this.backendConnected = false;
            console.warn('Failed to list proofs', err);
            return of([]);
          }))
          .subscribe(list => {
            if (list && list.length > 0) {
              this.backendConnected = true;
              this.proofId = list[0].id;
              this.proofService.getProof(this.proofId!).subscribe(p => {
                if (p) this.setProof(p);
              });
            } else {
              this.newProof();
            }
          });
      }
    });
  }

  setProof(p: Proof): void {
    this.proof = p;
    this.proofId = p.id;
    this.proofName = p.name;
    this.proofGoal = p.goal || '';
    this.proofDesc = p.description || '';
    this.steps = [...(p.steps || [])];
    this.refsString = this.steps.map(s => (s.premiseRefs || []).join(','));
    this.validations = this.steps.map(() => null);
    this.analysis = { issues: [], warnings: [] };
    this.analysisStatus = { valid: true };
    setTimeout(() => this.replayAnimations(), 100);
  }

  newProof(): void {
    this.proofService.createProof({ name: '新证明', goal: '', description: '' }).subscribe(p => {
      this.router.navigate(['/proof', p.id]);
    });
  }

  saveMeta(): void {
    if (!this.proofId) return;
    this.proofService.updateProof(this.proofId, {
      name: this.proofName, goal: this.proofGoal, description: this.proofDesc
    })
      .pipe(catchError(() => {
        this.backendConnected = false;
        return of(null);
      }))
      .subscribe();
  }

  addStep(): void {
    const idx = this.steps.length + 1;
    const step: ProofStep = { index: idx, formula: '', justification: '', premiseRefs: [] };
    this.steps = [...this.steps, step];
    this.refsString = [...this.refsString, ''];
    this.validations = [...this.validations, null];
    this.saveSteps();
    this.cdr.detectChanges();
    setTimeout(() => {
      const last = this.stepRows?.last;
      if (last) {
        this.anim.fadeIn(last.nativeElement);
        this.anim.slideLevel(last.nativeElement, 0);
      }
    }, 50);
  }

  removeStep(idx: number): void {
    this.steps = this.steps.filter((_, i) => i !== idx);
    this.refsString = this.refsString.filter((_, i) => i !== idx);
    this.validations = this.validations.filter((_, i) => i !== idx);
    this.steps.forEach((s, i) => s.index = i + 1);
    this.saveSteps();
  }

  onStepChange(idx: number): void {
    this.validateStep(idx);
    this.saveSteps();
  }

  onStepFocus(idx: number): void {
    const row = this.stepRows?.toArray()[idx];
    if (row) this.anim.fadeIn(row.nativeElement);
  }

  onRefsChange(idx: number): void {
    const raw = this.refsString[idx] || '';
    const refs = raw.split(',').map(s => s.trim()).filter(Boolean);
    this.steps[idx].premiseRefs = refs;
    this.validateStep(idx);
    this.saveSteps();
  }

  private validateStep(idx: number): void {
    const step = this.steps[idx];
    if (!step.formula) { this.validations[idx] = null; return; }
    const proofCopy = { ...(this.proof || {}), steps: this.steps };
    this.proofService.validateStep(step, proofCopy as Proof, true)
      .pipe(catchError(err => {
        this.backendConnected = false;
        console.warn('Validation failed, backend unavailable', err);
        return of({ step: { valid: false, errors: ['后端连接失败，暂无法校验'], warnings: [], type: null, rule: null, axiom: null, unification: null }, analysis: null });
      }))
      .subscribe(res => {
        this.backendConnected = true;
        this.validations[idx] = res.step;
        if (res.analysis) {
          this.analysis = res.analysis;
          this.analysisStatus.valid = (res.analysis.issues?.length || 0) === 0;
        }
        this.cdr.detectChanges();
        setTimeout(() => this.applyStepAnimations(idx), 50);
      });
  }

  validateAll(): void {
    const proofCopy = { ...(this.proof || {}), steps: this.steps } as Proof;
    this.proofService.validateProof(proofCopy)
      .pipe(catchError(err => {
        this.backendConnected = false;
        console.warn('Validate all failed', err);
        return of({ steps: [], analysis: { issues: [], warnings: [] } });
      }))
      .subscribe(res => {
        this.backendConnected = true;
        this.validations = res.steps;
        this.analysis = res.analysis;
        this.analysisStatus.valid = (res.analysis.issues?.length || 0) === 0;
        this.cdr.detectChanges();
        setTimeout(() => this.replayAnimations(), 50);
      });
  }

  private applyStepAnimations(idx: number): void {
    const row = this.stepRows?.toArray()[idx];
    if (!row) return;
    const el = row.nativeElement;
    const v = this.validations[idx];
    if (!v) return;
    if (v.valid) {
      this.anim.popCheck(el.querySelector('.check-mark') as HTMLElement);
    } else {
      this.anim.flashError(el);
    }
  }

  replayAnimations(): void {
    const rows = this.stepRows?.toArray();
    if (!rows) return;
    rows.forEach((row, i) => {
      setTimeout(() => {
        const el = row.nativeElement;
        this.anim.fadeIn(el);
        this.anim.slideLevel(el, this.getStepLevel(i));
        const v = this.validations[i];
        if (v?.valid) {
          this.anim.popCheck(el.querySelector('.check-mark') as HTMLElement);
        } else if (v) {
          this.anim.flashError(el);
        }
      }, i * 120);
    });
  }

  private getStepLevel(idx: number): number {
    const step = this.steps[idx];
    if (!step || !step.premiseRefs || step.premiseRefs.length === 0) return 0;
    let maxLvl = 0;
    for (const r of step.premiseRefs) {
      const n = Number(r);
      if (!isNaN(n)) {
        const refIdx = this.steps.findIndex(s => s.index === n);
        if (refIdx >= 0) {
          const lvl = this.getStepLevel(refIdx) + 1;
          if (lvl > maxLvl) maxLvl = lvl;
        }
      }
    }
    return maxLvl;
  }

  private saveSteps(): void {
    if (!this.proofId) return;
    this.proofService.saveSteps(this.proofId, this.steps)
      .pipe(catchError(err => {
        this.backendConnected = false;
        console.warn('Backend unavailable, steps saved locally only', err);
        return of(null);
      }))
      .subscribe(() => {
        this.backendConnected = true;
      });
  }

  onSceneLoaded(proof: Proof): void {
    this.router.navigate(['/proof', proof.id]).then(() => {
      this.setProof(proof);
      setTimeout(() => this.validateAll(), 300);
    });
  }
}
