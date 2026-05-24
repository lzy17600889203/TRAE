import { Component, Input, Output, EventEmitter, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { Score, Note, Issue } from '../models';

const STAFF_SPACING = 12;
const NOTE_WIDTH = 48;
const NOTE_X_PAD = 24;

// diatonic step -> half-steps above C
const DIATONIC_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// diatonic pitch index: 0 = C4, incremented per diatonic step (octave*7 + step)
function diatonicIndex(n: { step: string; octave: number }) {
  return n.octave * 7 + DIATONIC_ORDER.indexOf(n.step);
}

// Returns y offset (px) from the top staff line (treble, F5 top line).
function yForNote(n: Note, clef: string) {
  // For treble clef: top line = F5 = diatonic index 5*7+3 = 38.
  // For bass clef: top line = A3 = diatonic index 3*7+5 = 26.
  const topIndex = clef === 'bass' ? 3 * 7 + DIATONIC_ORDER.indexOf('A') : 5 * 7 + DIATONIC_ORDER.indexOf('F');
  const idx = diatonicIndex(n);
  return (topIndex - idx) * (STAFF_SPACING / 2);
}

interface NoteView {
  x: number;
  y: number;
  note: Note;
  index: number;
  voice: number;
  errored: boolean;
  warned: boolean;
  justAdded: boolean;
  playback: boolean;
}

@Component({
  selector: 'staff-editor',
  template: `
    <div class="staff-editor" #container>
      <div class="toolbar">
        <label>时值</label>
        <select [(ngModel)]="selectedDuration">
          <option value="whole">全音符</option>
          <option value="half">二分</option>
          <option value="quarter" selected>四分</option>
          <option value="eighth">八分</option>
          <option value="16th">十六分</option>
        </select>
        <label>升降</label>
        <select [(ngModel)]="selectedAlter">
          <option value="">自然</option>
          <option value="#">升</option>
          <option value="b">降</option>
          <option value="n">还原</option>
        </select>
        <label>声部</label>
        <select [(ngModel)]="selectedVoice">
          <option *ngFor="let v of score.voices; let i = index" [value]="i">{{ v.name }}</option>
        </select>
        <span class="hint">点击五线谱加音，点击音符删除</span>
      </div>

      <div class="score-area" #scoreArea>
        <svg [attr.viewBox]="viewBox" class="staff-svg" preserveAspectRatio="xMinYMin meet">
          <!-- System background -->
          <rect x="0" y="0" [attr.width]="width" [attr.height]="height" fill="#ffffff" />

          <g *ngFor="let s of staffSystems; trackBy:trackBySystem">
            <!-- Staff lines -->
            <g *ngFor="let line of s.lines">
              <line [attr.x1]="line.x1" [attr.y1]="line.y" [attr.x2]="line.x2" [attr.y2]="line.y" stroke="#111" stroke-width="1" />
            </g>
            <!-- Clef -->
            <text [attr.x]="s.clefX" [attr.y]="s.clefY" font-size="46" font-family="serif">
              {{ s.clef === 'bass' ? '𝄢' : '𝄞' }}
            </text>
            <!-- Key signature -->
            <text [attr.x]="s.keyX" [attr.y]="s.keyY" font-size="24" font-family="serif">
              {{ keySignatureText }}
            </text>
            <!-- Time signature -->
            <text [attr.x]="s.timeX" [attr.y]="s.timeY" font-size="22" font-family="serif">
              {{ score.time.beats }}/{{ score.time.beatType }}
            </text>
            <!-- Bar lines -->
            <line *ngFor="let b of s.bars" [attr.x1]="b" [attr.y1]="s.topY" [attr.x2]="b" [attr.y2]="s.bottomY" stroke="#111" stroke-width="1" />
          </g>

          <!-- Ties / slurs (stretching animations) -->
          <g *ngFor="let tie of ties">
            <path class="tie-path" [attr.d]="tie.path" [class.animated]="tie.animated" />
          </g>

          <!-- Notes -->
          <g *ngFor="let nv of noteViews">
            <!-- Ledger lines -->
            <g *ngIf="nv.ledgerLines.length">
              <line *ngFor="let ly of nv.ledgerLines"
                [attr.x1]="nv.x - 9" [attr.y1]="ly"
                [attr.x2]="nv.x + 9" [attr.y2]="ly"
                stroke="#111" stroke-width="1" />
            </g>

            <!-- Alter text -->
            <text *ngIf="nv.note.alter"
              [attr.x]="nv.x - 18" [attr.y]="nv.y + 5"
              font-size="20" font-family="serif"
              [class.alter-wrong]="nv.alterWrong">{{ alterGlyph(nv.note.alter) }}</text>

            <!-- Note head -->
            <ellipse
              [attr.cx]="nv.x"
              [attr.cy]="nv.y"
              rx="7" ry="5"
              [class.note-head]="true"
              [class.note-head-whole]="nv.note.duration === 'whole'"
              [class.errored-note]="nv.errored"
              [class.warned-note]="nv.warned && !nv.errored"
              [class.just-added]="nv.justAdded"
              [class.playback-note]="nv.playback"
              (click)="onNoteClick(nv)"
              transform="rotate(-20 {{nv.x}} {{nv.y}})" />

            <!-- Stem -->
            <line *ngIf="nv.note.duration !== 'whole'"
              [attr.x1]="nv.x + 6" [attr.y1]="nv.y"
              [attr.x2]="nv.x + 6" [attr.y2]="nv.stemY"
              stroke="#111" stroke-width="1.5" />
          </g>

          <!-- Playback cursor -->
          <line *ngIf="playbackIndex >= 0 && playbackCursors.length"
            [attr.x1]="playbackCursors[0]" [attr.y1]="systemsTopY"
            [attr.x2]="playbackCursors[0]" [attr.y2]="systemsBottomY"
            stroke="#2563eb" stroke-width="2" class="playback-cursor"
            [style.transition]="'x1 0.45s cubic-bezier(0.4,0,0.2,1), x2 0.45s cubic-bezier(0.4,0,0.2,1)'" />
        </svg>

        <!-- Click overlay for adding notes -->
        <div class="click-layer" (click)="onAddClick($event)"></div>
      </div>

      <!-- Harmonic resolution gradient overlay -->
      <div class="resolution-glow" [class.active]="resolutionActive"></div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .staff-editor { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; position: relative; overflow: hidden; }
    .toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; font-size: 12px; }
    .toolbar select { padding: 3px 6px; border: 1px solid #d1d5db; border-radius: 4px; }
    .hint { color: #6b7280; margin-left: 8px; }
    .score-area { position: relative; overflow-x: auto; overflow-y: hidden; border: 1px solid #f3f4f6; }
    .staff-svg { display: block; width: 100%; height: 100%; min-height: 360px; }
    .click-layer { position: absolute; inset: 0; cursor: crosshair; }
    .note-head { fill: #111; transition: fill 0.4s ease; }
    .note-head-whole { fill: #ffffff; stroke: #111; stroke-width: 1.5; }
    .errored-note { fill: #dc2626; animation: shake 0.6s ease-in-out infinite; }
    .warned-note { fill: #d97706; }
    .just-added { animation: dropIn 0.55s cubic-bezier(0.2, 1.2, 0.5, 1) both; }
    .playback-note { fill: #2563eb !important; animation: playbackPulse 0.45s ease-in-out infinite alternate; }
    .playback-cursor { transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1); }
    .tie-path { fill: none; stroke: #111; stroke-width: 2; stroke-dasharray: 400; stroke-dashoffset: 400; }
    .tie-path.animated { animation: drawTie 0.9s ease forwards; }
    .alter-wrong { fill: #dc2626; animation: shake 0.6s ease-in-out infinite; }
    .resolution-glow { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at center, rgba(16,185,129,0) 0%, rgba(16,185,129,0) 70%); transition: background 0.9s ease; }
    .resolution-glow.active { background: radial-gradient(ellipse at center, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0) 70%); }
    @keyframes dropIn {
      0% { transform: translateY(-60px) scale(0.6); opacity: 0; }
      60% { transform: translateY(6px) scale(1.15); opacity: 1; }
      75% { transform: translateY(-3px) scale(0.95); }
      90% { transform: translateY(2px) scale(1.05); }
      100% { transform: translateY(0) scale(1); }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0) rotate(-20deg); }
      20% { transform: translateX(-3px) rotate(-20deg); }
      40% { transform: translateX(3px) rotate(-20deg); }
      60% { transform: translateX(-2px) rotate(-20deg); }
      80% { transform: translateX(2px) rotate(-20deg); }
    }
    @keyframes playbackPulse {
      0% { filter: brightness(1); }
      100% { filter: brightness(1.6) drop-shadow(0 0 6px #60a5fa); }
    }
    @keyframes drawTie {
      to { stroke-dashoffset: 0; }
    }
  `]
})
export class StaffEditorComponent implements AfterViewInit, OnChanges {
  @Input() score: Score;
  @Input() issues: Issue[] = [];
  @Input() playbackIndex = -1;
  @Output() noteAdded = new EventEmitter<{ voice: number; note: Note }>();
  @Output() noteRemoved = new EventEmitter<{ voice: number; index: number }>();

  selectedDuration: Note['duration'] = 'quarter';
  selectedAlter: '' | '#' | 'b' | 'n' = '';
  selectedVoice = 0;

  width = 1200;
  height = 420;
  viewBox = '0 0 1200 420';

  staffSystems: any[] = [];
  noteViews: NoteView[] = [];
  ties: any[] = [];
  playbackCursors: number[] = [];
  systemsTopY = 0;
  systemsBottomY = 0;
  resolutionActive = false;

  private justAddedKey: string | null = null;
  private lastPlaybackIndex = -1;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.rebuild();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['playbackIndex']) {
      const oldVal = this.lastPlaybackIndex;
      const newVal = this.playbackIndex;
      if (oldVal !== -1 && newVal !== -1 && newVal !== oldVal) {
        // trigger resolution glow when moving forward
        if (newVal > oldVal) {
          this.resolutionActive = true;
          setTimeout(() => (this.resolutionActive = false), 900);
        }
      }
      this.lastPlaybackIndex = newVal;
    }
    this.rebuild();
  }

  get keySignatureText() {
    const fifths = this.score.key.fifths;
    if (fifths === 0) return '';
    if (fifths > 0) return '♯'.repeat(fifths);
    return '♭'.repeat(-fifths);
  }

  trackBySystem(_i: number, s: any) { return s.id; }

  alterGlyph(a: string) {
    switch (a) {
      case '#': return '♯';
      case '##': return '𝄪';
      case 'b': return '♭';
      case 'bb': return '𝄫';
      case 'n': return '♮';
      default: return '';
    }
  }

  private rebuild() {
    if (!this.score) return;
    const voices = this.score.voices;
    const maxLen = voices.reduce((m, v) => Math.max(m, v.notes.length), 0);
    const sysCount = Math.max(1, Math.ceil(maxLen / 12));
    const notesPerSys = Math.max(8, Math.ceil(maxLen / sysCount));
    const systemHeight = 280;
    const systems = [];

    for (let s = 0; s < sysCount; s++) {
      const topY = 40 + s * systemHeight;
      systems.push({
        id: s,
        topY,
        bottomY: topY + systemHeight - 60,
        clef: this.score.clefs[0] || 'treble',
        clefX: 40,
        clefY: topY + 55,
        keyX: 88,
        keyY: topY + 48,
        timeX: 130,
        timeY: topY + 48,
        lines: this.buildStaffLines(topY),
        bars: this.buildBars(topY, notesPerSys),
        startNoteIdx: s * notesPerSys,
        endNoteIdx: Math.min(maxLen, (s + 1) * notesPerSys) - 1,
        startX: 170,
        endX: this.width - 40,
        notesPerSys
      });
    }
    this.staffSystems = systems;
    this.systemsTopY = systems[0].topY;
    this.systemsBottomY = systems[systems.length - 1].bottomY;

    // Build note views
    const views: NoteView[] = [];
    const errorSet = new Set<string>();
    const warnSet = new Set<string>();
    (this.issues || []).forEach((iss) => {
      iss.positions.forEach((p) => {
        const key = `${p.voice}-${p.index}`;
        if (iss.severity === 'error') errorSet.add(key);
        else warnSet.add(key);
      });
    });

    voices.forEach((v, vi) => {
      v.notes.forEach((n, i) => {
        const sys = systems.find((s) => i >= s.startNoteIdx && i <= s.endNoteIdx);
        if (!sys) return;
        const localIdx = i - sys.startNoteIdx;
        const x = sys.startX + localIdx * NOTE_WIDTH + NOTE_X_PAD;
        const y = sys.topY + 30 + yForNote(n, sys.clef);
        const key = `${vi}-${i}`;
        const stemDir = y < sys.topY + 40 ? 1 : -1;
        const stemY = y + stemDir * 34;
        views.push({
          x, y, note: n, index: i, voice: vi,
          errored: errorSet.has(key),
          warned: warnSet.has(key),
          justAdded: this.justAddedKey === key,
          playback: this.playbackIndex === i,
          ledgerLines: this.ledgerLinesFor(y, sys.topY + 30),
          stemY,
          alterWrong: this.isAlterDisplayWrong(n, i)
        } as any);
      });
    });
    this.noteViews = views;

    // Build ties: connect consecutive notes in same voice
    this.ties = [];
    voices.forEach((v, vi) => {
      for (let i = 1; i < v.notes.length; i++) {
        const a = views.find((x) => x.voice === vi && x.index === i - 1);
        const b = views.find((x) => x.voice === vi && x.index === i);
        if (!a || !b) continue;
        if (Math.abs(b.x - a.x) > 400) continue; // different systems
        const y = (a.y + b.y) / 2 - 10;
        const path = `M ${a.x + 6} ${a.y} Q ${(a.x + b.x) / 2} ${y - 12} ${b.x - 6} ${b.y}`;
        this.ties.push({ path, animated: true, key: `${vi}-${i - 1}-${i}` });
      }
    });

    // Playback cursor x
    if (this.playbackIndex >= 0) {
      this.playbackCursors = systems
        .filter((s) => this.playbackIndex >= s.startNoteIdx && this.playbackIndex <= s.endNoteIdx)
        .map((s) => s.startX + (this.playbackIndex - s.startNoteIdx) * NOTE_WIDTH + NOTE_X_PAD);
    } else {
      this.playbackCursors = [];
    }
  }

  private buildStaffLines(topY: number) {
    const lines = [];
    for (let i = 0; i < 5; i++) {
      lines.push({
        x1: 40, x2: this.width - 20,
        y: topY + i * STAFF_SPACING
      });
    }
    return lines;
  }

  private buildBars(topY: number, notesPerSys: number) {
    const bars: number[] = [];
    const startX = 170;
    for (let i = 1; i <= Math.floor(notesPerSys / 4); i++) {
      bars.push(startX + i * 4 * NOTE_WIDTH);
    }
    bars.push(this.width - 20);
    return bars;
  }

  private ledgerLinesFor(y: number, topLineY: number) {
    const lines: number[] = [];
    // Above staff: each ledger at topLineY - spacing*n (where n = 1,2,...)
    let check = topLineY - STAFF_SPACING;
    while (y < check + 2) {
      if (Math.abs(y - check) < 3) lines.push(check);
      check -= STAFF_SPACING;
      if (check < topLineY - 200) break;
    }
    // Below staff: bottom line = topLineY + 4*spacing
    const bottom = topLineY + 4 * STAFF_SPACING;
    check = bottom + STAFF_SPACING;
    while (y > check - 2) {
      if (Math.abs(y - check) < 3) lines.push(check);
      check += STAFF_SPACING;
      if (check > bottom + 200) break;
    }
    return lines;
  }

  // Known issue: accidentals are always rendered when note.alter is non-empty,
  // even when the key signature already provides that alteration. This simulates
  // the "调号变更后的临时升降号显示错误" the user wants to observe.
  private isAlterDisplayWrong(n: Note, i: number): boolean {
    if (!n.alter) return false;
    const kc = this.score.keyChangeAt;
    if (kc && i >= kc.index) {
      // After key change, old accidentals may no longer be needed but still rendered.
      return true;
    }
    const fifths = this.score.key.fifths;
    // Sharps in key signature: F, C, G, D, A, E, B
    const sharps = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
    const flats = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
    if (n.alter === '#' && fifths > 0 && sharps.slice(0, fifths).includes(n.step)) return true;
    if (n.alter === 'b' && fifths < 0 && flats.slice(0, -fifths).includes(n.step)) return true;
    return false;
  }

  onNoteClick(nv: NoteView) {
    const v = this.score.voices[nv.voice];
    v.notes.splice(nv.index, 1);
    this.noteRemoved.emit({ voice: nv.voice, index: nv.index });
    this.rebuild();
  }

  onAddClick(event: MouseEvent) {
    const svg = this.el.nativeElement.querySelector('svg');
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const loc = pt.matrixTransform(ctm.inverse());

    // Determine the system from y
    const sys = this.staffSystems.find((s) => loc.y >= s.topY && loc.y <= s.bottomY + 30);
    if (!sys) return;

    const localIdx = Math.max(0, Math.floor((loc.x - sys.startX - NOTE_X_PAD + NOTE_WIDTH / 2) / NOTE_WIDTH));
    const voice = this.selectedVoice;
    const clef = this.score.clefs[voice] || sys.clef;

    // Compute diatonic step at this y
    const topIndex = clef === 'bass' ? 3 * 7 + DIATONIC_ORDER.indexOf('A') : 5 * 7 + DIATONIC_ORDER.indexOf('F');
    const topLineY = sys.topY; // y of top line (F5)
    const staffTopY = topLineY;
    const idx = topIndex - Math.round((loc.y - (staffTopY + 30)) / (STAFF_SPACING / 2));
    const octave = Math.floor(idx / 7);
    const step = DIATONIC_ORDER[((idx % 7) + 7) % 7] as Note['step'];

    const note: Note = {
      step,
      octave,
      alter: this.selectedAlter,
      duration: this.selectedDuration
    };
    const v = this.score.voices[voice];
    while (v.notes.length <= localIdx) v.notes.push(null as any);
    v.notes[localIdx] = note;

    this.justAddedKey = `${voice}-${localIdx}`;
    this.noteAdded.emit({ voice, note });
    setTimeout(() => {
      this.justAddedKey = null;
      this.rebuild();
    }, 600);
    this.rebuild();
  }
}
