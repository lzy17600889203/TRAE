import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'playback-controls',
  template: `
    <section class="panel">
      <header>
        <h3>播放控制</h3>
      </header>
      <div class="controls">
        <button (click)="togglePlay()">{{ playing ? '⏸ 暂停' : '▶ 播放' }}</button>
        <button (click)="seek(-1)">◀</button>
        <button (click)="seek(1)">▶</button>
        <button (click)="reset()">■ 重置</button>
      </div>
      <div class="slider">
        <input type="range" min="-1" [max]="maxIndex" [value]="index" (input)="onSlider($any(($event as Event).target).value)" />
        <span class="idx">{{ index < 0 ? '-' : index + 1 }} / {{ maxIndex + 1 }}</span>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; }
    header h3 { margin: 0 0 8px 0; font-size: 14px; }
    .controls { display: flex; gap: 6px; flex-wrap: wrap; }
    .controls button {
      padding: 4px 10px; border: 1px solid #d1d5db; background: #fff; border-radius: 4px;
      font-size: 12px; cursor: pointer;
    }
    .controls button:hover { border-color: #2563eb; color: #2563eb; }
    .slider { margin-top: 10px; display: flex; gap: 10px; align-items: center; font-size: 12px; color: #4b5563; }
    .slider input[type="range"] { flex: 1; }
  `]
})
export class PlaybackControlsComponent {
  @Input() maxIndex = 0;
  @Input() index = -1;
  @Output() indexChange = new EventEmitter<number>();
  @Output() play = new EventEmitter<boolean>();

  playing = false;

  togglePlay() {
    this.playing = !this.playing;
    this.play.emit(this.playing);
  }

  seek(delta: number) {
    const next = Math.min(Math.max(-1, this.index + delta), this.maxIndex);
    this.index = next;
    this.indexChange.emit(next);
  }

  reset() {
    this.playing = false;
    this.play.emit(false);
    this.index = -1;
    this.indexChange.emit(-1);
  }

  onSlider(v: string) {
    const n = parseInt(v, 10);
    this.index = n;
    this.indexChange.emit(n);
  }
}
