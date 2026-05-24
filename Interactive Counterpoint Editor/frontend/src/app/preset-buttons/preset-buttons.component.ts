import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'preset-buttons',
  template: `
    <div class="presets">
      <span class="label">预设场景：</span>
      <button *ngFor="let p of presets" (click)="load(p.id)" [class.active]="active === p.id">
        {{ p.title }}
      </button>
    </div>
  `,
  styles: [`
    .presets { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
    .label { font-size: 12px; color: #6b7280; }
    button {
      padding: 6px 14px;
      border: 1px solid #d1d5db;
      background: #fff;
      border-radius: 999px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    button:hover { border-color: #2563eb; color: #2563eb; }
    button.active { background: #2563eb; color: #fff; border-color: #2563eb; }
  `]
})
export class PresetButtonsComponent implements OnInit {
  @Output() load = new EventEmitter<string>();

  presets: { id: string; title: string }[] = [];
  active = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<{ presets: { id: string; title: string }[] }>('/api/presets').subscribe((r) => {
      this.presets = r.presets || [];
    });
  }

  load(id: string) {
    this.active = id;
    this.load.emit(id);
  }
}
