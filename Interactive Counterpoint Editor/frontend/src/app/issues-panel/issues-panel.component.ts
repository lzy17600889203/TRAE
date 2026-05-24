import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Issue } from '../models';

@Component({
  selector: 'issues-panel',
  template: `
    <section class="panel">
      <header>
        <h3>规则引擎报告</h3>
        <span class="count" [class.has-errors]="errorCount > 0">{{ issues.length }} 条</span>
      </header>
      <ul class="list">
        <li *ngFor="let iss of issues" [class.error]="iss.severity === 'error'" [class.warning]="iss.severity === 'warning'">
          <div class="title">
            <span class="badge">{{ iss.severity === 'error' ? '错误' : '警告' }}</span>
            <span class="rule">{{ ruleLabel(iss.rule) }}</span>
          </div>
          <p class="msg">{{ iss.message }}</p>
          <ul class="sugg" *ngIf="iss.suggestions?.length">
            <li *ngFor="let s of iss.suggestions">· {{ s }}</li>
          </ul>
          <button class="goto" (click)="onGoto(iss)">定位</button>
        </li>
        <li *ngIf="issues.length === 0" class="empty">暂无违规。继续创作吧。</li>
      </ul>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; }
    header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
    header h3 { margin: 0; font-size: 14px; }
    .count { font-size: 12px; color: #6b7280; }
    .count.has-errors { color: #dc2626; }
    .list { list-style: none; margin: 0; padding: 8px; max-height: 300px; overflow-y: auto; }
    .list li { padding: 8px; border-radius: 4px; margin-bottom: 6px; border: 1px solid transparent; }
    .list li.error { background: #fef2f2; border-color: #fecaca; }
    .list li.warning { background: #fffbeb; border-color: #fde68a; }
    .title { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .badge { font-size: 11px; padding: 1px 6px; border-radius: 999px; background: #111; color: #fff; }
    li.error .badge { background: #dc2626; }
    li.warning .badge { background: #d97706; }
    .rule { font-weight: 600; font-size: 12px; }
    .msg { margin: 0; font-size: 12px; color: #374151; }
    .sugg { margin: 4px 0 0 0; padding-left: 0; list-style: none; font-size: 11px; color: #4b5563; }
    .goto { margin-top: 6px; font-size: 11px; background: #e5e7eb; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer; }
    .empty { color: #9ca3af; font-size: 12px; text-align: center; padding: 16px; }
  `]
})
export class IssuesPanelComponent {
  @Input() issues: Issue[] = [];
  @Output() goto = new EventEmitter<{ voice: number; index: number }>();

  get errorCount() {
    return this.issues.filter((i) => i.severity === 'error').length;
  }

  ruleLabel(rule: string) {
    switch (rule) {
      case 'parallel-perfect': return '平行纯五/八度';
      case 'hidden-perfect': return '隐伏纯五/八度';
      case 'voice-crossing': return '声部交叉';
      case 'augmented-melodic': return '增音程未解决';
      default: return rule;
    }
  }

  onGoto(iss: Issue) {
    if (iss.positions?.length) this.goto.emit(iss.positions[0]);
  }
}
