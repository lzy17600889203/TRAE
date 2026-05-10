import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PlantGeneParameters,
  EnvironmentConfig,
  AnimationConfig,
  Preset,
  PlantStructure,
} from './types';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="control-panel">
      <header class="panel-header">
        <h1>🌱 植物生长模拟</h1>
        <p class="subtitle">L-System 分形系统</p>
      </header>

      <div class="preset-section">
        <h3>快速预设</h3>
        <div class="preset-grid">
          <button
            *ngFor="let preset of presets"
            [class.active]="currentPresetId === preset.id"
            class="preset-btn"
            (click)="applyPreset.emit(preset.id)"
          >
            {{ preset.name }}
          </button>
        </div>
      </div>

      <div class="section">
        <h3>基因参数</h3>
        <div class="control-group">
          <label>
            迭代次数: {{ genes.iterations }}
            <input
              type="range"
              min="1"
              max="15"
              [(ngModel)]="genes.iterations"
              (ngModelChange)="genesChange.emit(genes)"
            />
          </label>
        </div>
        <div class="control-group">
          <label>
            枝条角度: {{ genes.branchAngle }}°
            <input
              type="range"
              min="5"
              max="90"
              [(ngModel)]="genes.branchAngle"
              (ngModelChange)="genesChange.emit(genes)"
            />
          </label>
        </div>
        <div class="control-group">
          <label>
            光照吸引: {{ (genes.lightAttraction * 100).toFixed(0) }}%
            <input
              type="range"
              min="0"
              max="100"
              [(ngModel)]="lightAttractionPercent"
              (ngModelChange)="updateLightAttraction($event)"
            />
          </label>
        </div>
        <div class="control-group">
          <label>
            养分供给: {{ (genes.nutrientSupply * 100).toFixed(0) }}%
            <input
              type="range"
              min="0"
              max="100"
              [(ngModel)]="nutrientPercent"
              (ngModelChange)="updateNutrient($event)"
            />
          </label>
        </div>
        <div class="control-group">
          <label>
            基础长度: {{ genes.baseLength.toFixed(1) }}
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              [(ngModel)]="genes.baseLength"
              (ngModelChange)="genesChange.emit(genes)"
            />
          </label>
        </div>
        <div class="control-group">
          <label>
            最大层级: {{ genes.maxLevel }}
            <input
              type="range"
              min="1"
              max="20"
              [(ngModel)]="genes.maxLevel"
              (ngModelChange)="genesChange.emit(genes)"
            />
          </label>
        </div>
        <div class="control-group">
          <label>
            叶片密度: {{ (genes.leafDensity * 100).toFixed(0) }}%
            <input
              type="range"
              min="0"
              max="100"
              [(ngModel)]="leafDensityPercent"
              (ngModelChange)="updateLeafDensity($event)"
            />
          </label>
        </div>
        <div class="control-group">
          <label>
            花朵几率: {{ (genes.flowerChance * 100).toFixed(0) }}%
            <input
              type="range"
              min="0"
              max="100"
              [(ngModel)]="flowerChancePercent"
              (ngModelChange)="updateFlowerChance($event)"
            />
          </label>
        </div>
      </div>

      <div class="section">
        <h3>环境参数</h3>
        <div class="control-group">
          <label>
            重力强度: {{ environment.gravityStrength.toFixed(2) }}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              [(ngModel)]="environment.gravityStrength"
              (ngModelChange)="environmentChange.emit(environment)"
            />
          </label>
        </div>
        <div class="control-group">
          <label>
            温度: {{ environment.temperature.toFixed(0) }}°C
            <input
              type="range"
              min="0"
              max="40"
              [(ngModel)]="environment.temperature"
              (ngModelChange)="environmentChange.emit(environment)"
            />
          </label>
        </div>
      </div>

      <div class="section">
        <h3>动画速度</h3>
        <div class="control-group">
          <label>
            枝条生长: {{ animation.branchGrowthSpeed.toFixed(1) }}x
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              [(ngModel)]="animation.branchGrowthSpeed"
              (ngModelChange)="animationChange.emit(animation)"
            />
          </label>
        </div>
        <div class="control-group">
          <label>
            叶片展开: {{ animation.leafUnfurlSpeed.toFixed(1) }}x
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              [(ngModel)]="animation.leafUnfurlSpeed"
              (ngModelChange)="animationChange.emit(animation)"
            />
          </label>
        </div>
        <div class="control-group">
          <label>
            光合作用: {{ animation.photosynthesisSpeed.toFixed(1) }}x
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              [(ngModel)]="animation.photosynthesisSpeed"
              (ngModelChange)="animationChange.emit(animation)"
            />
          </label>
        </div>
        <div class="control-group">
          <label>
            花朵绽放: {{ animation.flowerBloomSpeed.toFixed(1) }}x
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              [(ngModel)]="animation.flowerBloomSpeed"
              (ngModelChange)="animationChange.emit(animation)"
            />
          </label>
        </div>
        <div class="control-group">
          <label>
            病变扩散: {{ animation.diseaseSpreadSpeed.toFixed(1) }}x
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              [(ngModel)]="animation.diseaseSpreadSpeed"
              (ngModelChange)="animationChange.emit(animation)"
            />
          </label>
        </div>
      </div>

      <div class="action-section">
        <button class="primary-btn" (click)="generate.emit()" [disabled]="isLoading">
          {{ isLoading ? '生成中...' : '🔄 重新生成' }}
        </button>
        <div class="control-btns">
          <button class="control-btn" (click)="play.emit()" [disabled]="!plantStructure">
            ▶ 播放
          </button>
          <button class="control-btn" (click)="pause.emit()">
            ⏸ 暂停
          </button>
          <button class="control-btn" (click)="reset.emit()">
            🔁 重置
          </button>
        </div>
      </div>

      <div class="stats-section" *ngIf="plantStructure">
        <h3>植物统计</h3>
        <div class="stats-grid">
          <div class="stat">
            <span class="value">{{ plantStructure.metadata.totalBranches }}</span>
            <span class="label">总枝条数</span>
          </div>
          <div class="stat">
            <span class="value">{{ plantStructure.metadata.maxLevel }}</span>
            <span class="label">最大层级</span>
          </div>
          <div class="stat">
            <span class="value">{{ plantStructure.leaves.length }}</span>
            <span class="label">叶片数</span>
          </div>
          <div class="stat">
            <span class="value">{{ plantStructure.flowers.length }}</span>
            <span class="label">花朵数</span>
          </div>
          <div class="stat">
            <span class="value">{{ plantStructure.diseaseSpots.length }}</span>
            <span class="label">病变数</span>
          </div>
        </div>
      </div>

      <div class="warning-section" *ngIf="showWarnings">
        <h3>⚠️ 边界情况模拟</h3>
        <div class="warning-grid">
          <button class="warning-btn" (click)="triggerOverlap.emit()">
            枝条穿插重叠
          </button>
          <button class="warning-btn" (click)="triggerLeafFlip.emit()">
            叶片翻转错误
          </button>
          <button class="warning-btn" (click)="triggerOverflow.emit()">
            生长点溢出
          </button>
          <button class="warning-btn danger" (click)="triggerDeepIteration.emit()">
            深度迭代崩溃
          </button>
        </div>
      </div>

      <div class="error-message" *ngIf="error">
        ❌ {{ error }}
      </div>
    </div>
  `,
  styles: [
    `
      .control-panel {
        width: 340px;
        height: 100vh;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(10px);
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        padding: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .panel-header {
        margin-bottom: 8px;
      }

      .panel-header h1 {
        font-size: 22px;
        margin: 0;
        background: linear-gradient(135deg, #4ade80, #22c55e);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .subtitle {
        margin: 4px 0 0;
        font-size: 12px;
        color: #94a3b8;
      }

      .section {
        background: rgba(30, 41, 59, 0.8);
        border-radius: 12px;
        padding: 16px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .section h3,
      .preset-section h3,
      .stats-section h3,
      .warning-section h3 {
        margin: 0 0 12px;
        font-size: 14px;
        font-weight: 600;
        color: #e2e8f0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .control-group {
        margin-bottom: 12px;
      }

      .control-group:last-child {
        margin-bottom: 0;
      }

      .control-group label {
        display: block;
        font-size: 12px;
        color: #cbd5e1;
        margin-bottom: 6px;
        cursor: pointer;
      }

      .control-group input[type="range"] {
        width: 100%;
        height: 6px;
        background: #334155;
        border-radius: 3px;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
        cursor: pointer;
      }

      .control-group input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: linear-gradient(135deg, #4ade80, #22c55e);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(74, 222, 128, 0.3);
      }

      .control-group input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: linear-gradient(135deg, #4ade80, #22c55e);
        border-radius: 50%;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 8px rgba(74, 222, 128, 0.3);
      }

      .preset-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      .preset-btn {
        padding: 10px 8px;
        background: rgba(71, 85, 105, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #e2e8f0;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }

      .preset-btn:hover {
        background: rgba(74, 222, 128, 0.2);
        border-color: rgba(74, 222, 128, 0.3);
      }

      .preset-btn.active {
        background: rgba(74, 222, 128, 0.3);
        border-color: #4ade80;
        color: #4ade80;
      }

      .action-section {
        margin-top: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .primary-btn {
        padding: 14px 20px;
        background: linear-gradient(135deg, #4ade80, #22c55e);
        border: none;
        border-radius: 10px;
        color: #0f172a;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        text-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      .primary-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(74, 222, 128, 0.4);
      }

      .primary-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .control-btns {
        display: flex;
        gap: 8px;
      }

      .control-btn {
        flex: 1;
        padding: 10px;
        background: rgba(71, 85, 105, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #e2e8f0;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .control-btn:hover:not(:disabled) {
        background: rgba(100, 116, 139, 0.5);
      }

      .control-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }

      .stat {
        background: rgba(71, 85, 105, 0.3);
        padding: 10px 8px;
        border-radius: 8px;
        text-align: center;
      }

      .stat .value {
        display: block;
        font-size: 18px;
        font-weight: 700;
        color: #4ade80;
      }

      .stat .label {
        display: block;
        font-size: 10px;
        color: #94a3b8;
        margin-top: 2px;
      }

      .warning-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      .warning-btn {
        padding: 10px 8px;
        background: rgba(251, 191, 36, 0.15);
        border: 1px solid rgba(251, 191, 36, 0.3);
        border-radius: 8px;
        color: #fbbf24;
        font-size: 10px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .warning-btn:hover {
        background: rgba(251, 191, 36, 0.25);
      }

      .warning-btn.danger {
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.3);
        color: #f87171;
      }

      .warning-btn.danger:hover {
        background: rgba(239, 68, 68, 0.25);
      }

      .error-message {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 8px;
        padding: 12px;
        color: #f87171;
        font-size: 12px;
      }

      .control-panel::-webkit-scrollbar {
        width: 6px;
      }

      .control-panel::-webkit-scrollbar-track {
        background: transparent;
      }

      .control-panel::-webkit-scrollbar-thumb {
        background: rgba(100, 116, 139, 0.5);
        border-radius: 3px;
      }
    `,
  ],
})
export class ControlPanelComponent implements OnInit {
  @Input() genes!: PlantGeneParameters;
  @Input() environment!: EnvironmentConfig;
  @Input() animation!: AnimationConfig;
  @Input() presets: Preset[] = [];
  @Input() currentPresetId: string | null = null;
  @Input() plantStructure: PlantStructure | null = null;
  @Input() isLoading = false;
  @Input() error: string | null = null;
  @Input() showWarnings = true;

  @Output() genesChange = new EventEmitter<PlantGeneParameters>();
  @Output() environmentChange = new EventEmitter<EnvironmentConfig>();
  @Output() animationChange = new EventEmitter<AnimationConfig>();
  @Output() applyPreset = new EventEmitter<string>();
  @Output() generate = new EventEmitter<void>();
  @Output() play = new EventEmitter<void>();
  @Output() pause = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() triggerOverlap = new EventEmitter<void>();
  @Output() triggerLeafFlip = new EventEmitter<void>();
  @Output() triggerOverflow = new EventEmitter<void>();
  @Output() triggerDeepIteration = new EventEmitter<void>();

  get lightAttractionPercent(): number {
    return Math.round(this.genes.lightAttraction * 100);
  }

  set lightAttractionPercent(value: number) {}

  get nutrientPercent(): number {
    return Math.round(this.genes.nutrientSupply * 100);
  }

  set nutrientPercent(value: number) {}

  get leafDensityPercent(): number {
    return Math.round(this.genes.leafDensity * 100);
  }

  set leafDensityPercent(value: number) {}

  get flowerChancePercent(): number {
    return Math.round(this.genes.flowerChance * 100);
  }

  set flowerChancePercent(value: number) {}

  ngOnInit(): void {}

  updateLightAttraction(value: number): void {
    this.genes.lightAttraction = value / 100;
    this.genesChange.emit(this.genes);
  }

  updateNutrient(value: number): void {
    this.genes.nutrientSupply = value / 100;
    this.genesChange.emit(this.genes);
  }

  updateLeafDensity(value: number): void {
    this.genes.leafDensity = value / 100;
    this.genesChange.emit(this.genes);
  }

  updateFlowerChance(value: number): void {
    this.genes.flowerChance = value / 100;
    this.genesChange.emit(this.genes);
  }
}
