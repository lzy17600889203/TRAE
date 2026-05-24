import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Score, Issue } from './models';

@Component({
  selector: 'app-root',
  template: `
    <div class="app">
      <header class="app-header">
        <h1>严格对位五线谱编辑器</h1>
        <div class="score-title">
          <label>标题</label>
          <input [(ngModel)]="score.title" (ngModelChange)="onTitleChange()" />
          <button (click)="saveScore()" [disabled]="saving">保存到 SQLite</button>
          <span class="save-msg" *ngIf="saveMsg">{{ saveMsg }}</span>
        </div>
      </header>

      <preset-buttons (load)="onLoadPreset($event)"></preset-buttons>

      <div class="workspace">
        <staff-editor
          [score]="score"
          [issues]="issues"
          [playbackIndex]="playbackIndex"
          (noteAdded)="onNoteAdded($event)"
          (noteRemoved)="onNoteRemoved($event)">
        </staff-editor>

        <aside class="side-panel">
          <playback-controls
            [maxIndex]="maxIndex"
            [index]="playbackIndex"
            (indexChange)="playbackIndex = $event"
            (play)="onPlay($event)">
          </playback-controls>

          <issues-panel [issues]="issues" (goto)="onGotoIssue($event)"></issues-panel>

          <section class="editor-actions">
            <h3>手动编辑</h3>
            <p>在五线谱上点击对应位置即可添加音符，点击已有音符可删除。</p>
            <button (click)="analyze()" class="primary">运行规则引擎</button>
          </section>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .app { font-family: system-ui, "PingFang SC", "Microsoft YaHei", sans-serif; padding: 16px; color: #222; }
    .app-header { display: flex; align-items: baseline; gap: 24px; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    .app-header h1 { margin: 0; font-size: 20px; }
    .score-title { display: flex; gap: 8px; align-items: center; }
    .score-title input { padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; }
    .save-msg { color: #059669; font-size: 12px; }
    .workspace { display: grid; grid-template-columns: 1fr 340px; gap: 16px; }
    .side-panel { display: flex; flex-direction: column; gap: 12px; }
    .editor-actions { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; }
    .editor-actions h3 { margin: 0 0 8px 0; font-size: 14px; }
    .editor-actions p { margin: 0 0 8px 0; font-size: 12px; color: #4b5563; }
    button.primary { background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
    button.primary:hover { background: #1d4ed8; }
    button[disabled] { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class AppComponent implements OnInit {
  score: Score = this.emptyScore();
  issues: Issue[] = [];
  playbackIndex = -1;
  saving = false;
  saveMsg = '';
  private playTimer: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.score = this.emptyScore();
    this.analyze();
  }

  emptyScore(): Score {
    return {
      id: '',
      title: '未命名乐谱',
      key: { fifths: 0, mode: 'major' },
      time: { beats: 4, beatType: 4 },
      clefs: ['treble', 'bass'],
      roleOrder: [0, 1],
      voices: [
        { name: '高音声部', notes: [] },
        { name: '低音声部', notes: [] }
      ]
    };
  }

  get maxIndex() {
    return this.score.voices.reduce((m, v) => Math.max(m, v.notes.length - 1), -1);
  }

  onLoadPreset(presetId: string) {
    this.http.get<Score>(`/api/presets/${presetId}`).subscribe((s) => {
      this.score = s;
      this.issues = [];
      this.playbackIndex = -1;
      this.analyze();
    });
  }

  onNoteAdded(ev: { voice: number; note: any }) {
    this.analyze();
  }

  onNoteRemoved(ev: { voice: number; index: number }) {
    this.analyze();
  }

  onTitleChange() { /* no-op, ngModel handles binding */ }

  analyze() {
    this.http.post<{ issues: Issue[] }>('/api/analyze', this.score).subscribe((r) => {
      this.issues = r.issues || [];
    });
  }

  saveScore() {
    this.saving = true;
    this.saveMsg = '';
    this.http.post<{ id: string; issues: Issue[] }>('/api/scores', this.score).subscribe((r) => {
      this.saving = false;
      this.saveMsg = `已保存 (id=${r.id.slice(0, 8)}...)`;
      this.issues = r.issues || [];
      setTimeout(() => (this.saveMsg = ''), 3000);
    }, () => {
      this.saving = false;
      this.saveMsg = '保存失败';
    });
  }

  onGotoIssue(pos: { voice: number; index: number }) {
    this.playbackIndex = pos.index;
  }

  onPlay(start: boolean) {
    if (start) {
      if (this.playbackIndex < 0) this.playbackIndex = 0;
      this.playTimer = setInterval(() => {
        if (this.playbackIndex >= this.maxIndex) {
          clearInterval(this.playTimer);
          return;
        }
        this.playbackIndex++;
      }, 450);
    } else {
      clearInterval(this.playTimer);
    }
  }
}
