import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tape-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tape-wrap" [title]="label">
      <div class="tape-track">
        <div
          class="tape-fill"
          [ngClass]="{ 'over-budget': isOver }"
          [style.width.%]="displayPercent"
          [style.background]="fillGradient"
        >
          <div class="tape-ticks" *ngIf="displayPercent > 5"></div>
        </div>
      </div>
      <div class="tape-meta">
        <span class="tape-label">{{ label }}</span>
        <span class="tape-value" [ngClass]="{ 'shake-once': shake, 'over-budget': isOver }">
          {{ displayPercent.toFixed(1) }}%
        </span>
      </div>
    </div>
  `,
  styles: [
    `
      .tape-wrap {
        width: 100%;
      }
      .tape-track {
        position: relative;
        height: 18px;
        background: repeating-linear-gradient(
          90deg,
          #e5e7eb 0px,
          #e5e7eb 9px,
          #d1d5db 9px,
          #d1d5db 10px
        );
        border: 1px solid #d1d5db;
        border-radius: 4px;
        overflow: hidden;
      }
      .tape-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--tape-yellow) 0%, #f59e0b 100%);
        transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        animation: tapeSlide 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
      }
      .tape-fill.over-budget {
        background: linear-gradient(90deg, #fca5a5 0%, var(--color-danger) 100%);
        animation: tapeSlide 0.9s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .tape-ticks {
        position: absolute;
        inset: 0;
        background-image: repeating-linear-gradient(
          90deg,
          rgba(0, 0, 0, 0.25) 0px,
          rgba(0, 0, 0, 0.25) 1px,
          transparent 1px,
          transparent 12px
        );
        pointer-events: none;
      }
      .tape-meta {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-top: 4px;
        font-size: 12px;
        color: var(--color-muted);
      }
      .tape-label {
        font-weight: 500;
      }
      .tape-value {
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        color: var(--color-text);
      }
      .shake-once {
        animation: shake 0.5s ease-in-out;
      }
    `
  ]
})
export class TapeBarComponent implements OnInit, OnChanges {
  @Input() planned: number = 0;
  @Input() actual: number = 0;
  @Input() label: string = '进度';

  displayPercent = 0;
  isOver = false;
  fillGradient = '';
  shake = false;

  ngOnInit() {
    this.recalc();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['planned'] || changes['actual']) {
      this.recalc();
      if (this.isOver) {
        this.shake = false;
        setTimeout(() => (this.shake = true), 10);
      }
    }
  }

  recalc() {
    const safePlanned = this.normalize(this.planned);
    const safeActual = this.normalize(this.actual);
    if (safePlanned <= 0) {
      this.displayPercent = 0;
      this.isOver = false;
      return;
    }
    const ratio = safeActual / safePlanned;
    this.displayPercent = Math.min(140, Math.round(ratio * 1000) / 10);
    this.isOver = ratio > 1;
    if (this.isOver) {
      this.fillGradient =
        'linear-gradient(90deg, #fca5a5 0%, var(--color-danger) 100%)';
    } else {
      this.fillGradient =
        'linear-gradient(90deg, var(--tape-yellow) 0%, #f59e0b 100%)';
    }
  }

  private normalize(v: any): number {
    const n = Number(v);
    if (!isFinite(n) || isNaN(n)) return 0;
    return n;
  }
}
