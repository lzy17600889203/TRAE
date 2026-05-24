import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ProofService, Scene } from '../../services/proof.service';

@Component({
  selector: 'app-scene-panel',
  template: `
    <div class="scene-panel">
      <div class="panel-title">预设场景</div>
      <div class="scene-grid">
        <button *ngFor="let s of scenes" class="scene-btn"
                [class.active]="activeId === s.id"
                (click)="loadScene(s)">
          <div class="scene-name">{{ s.name }}</div>
          <div class="scene-en">{{ s.nameEn }}</div>
          <div class="scene-desc">{{ s.description }}</div>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .scene-panel { background: #141833; border: 1px solid #2a3056; border-radius: 8px; padding: 14px; }
    .panel-title { font-size: 13px; color: #8d97cc; margin-bottom: 12px; letter-spacing: 1px; }
    .scene-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .scene-btn { background: #1b2045; border: 1px solid #2a3056; border-radius: 6px; padding: 12px;
      text-align: left; cursor: pointer; color: #e8eaff; transition: all .2s; }
    .scene-btn:hover { background: #242a5c; border-color: #4a5490; transform: translateY(-1px); }
    .scene-btn.active { background: #2a3366; border-color: #7cc8ff; box-shadow: 0 0 12px rgba(124,200,255,0.25); }
    .scene-name { font-size: 15px; font-weight: 600; color: #c8e4ff; }
    .scene-en { font-size: 11px; color: #7d87b8; margin: 2px 0 6px; }
    .scene-desc { font-size: 12px; color: #9aa3c7; line-height: 1.5; }
  `]
})
export class ScenePanelComponent implements OnInit {
  scenes: Scene[] = [];
  activeId: string | null = null;

  @Output() sceneLoaded = new EventEmitter<any>();

  constructor(private proofService: ProofService) {}

  ngOnInit(): void {
    this.proofService.listScenes().subscribe(s => this.scenes = s);
  }

  loadScene(s: Scene): void {
    this.activeId = s.id;
    this.proofService.loadScene(s.id).subscribe(proof => {
      this.sceneLoaded.emit(proof);
    });
  }
}
