import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantService } from './plant.service';
import { PlantRendererService } from './plant-renderer.service';
import { ControlPanelComponent } from './control-panel.component';
import {
  PlantGeneParameters,
  EnvironmentConfig,
  AnimationConfig,
  Preset,
  PlantStructure,
  SimulationState,
} from './types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ControlPanelComponent],
  template: `
    <div class="app-container">
      <app-control-panel
        [genes]="state.genes"
        [environment]="state.environment"
        [animation]="state.animationConfig"
        [presets]="presets"
        [currentPresetId]="state.currentPresetId"
        [plantStructure]="state.plantStructure"
        [isLoading]="state.isLoading"
        [error]="state.error"
        (genesChange)="onGenesChange($event)"
        (environmentChange)="onEnvironmentChange($event)"
        (animationChange)="onAnimationChange($event)"
        (applyPreset)="onApplyPreset($event)"
        (generate)="onGenerate()"
        (play)="onPlay()"
        (pause)="onPause()"
        (reset)="onReset()"
        (triggerOverlap)="onTriggerOverlap()"
        (triggerLeafFlip)="onTriggerLeafFlip()"
        (triggerOverflow)="onTriggerOverflow()"
        (triggerDeepIteration)="onTriggerDeepIteration()"
      ></app-control-panel>
      <div class="viewport-container" #viewportContainer></div>
    </div>
  `,
  styles: [
    `
      .app-container {
        display: flex;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
      }

      .viewport-container {
        flex: 1;
        position: relative;
        background: #0f172a;
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  @ViewChild('viewportContainer', { static: true })
  viewportContainer!: ElementRef<HTMLDivElement>;

  presets: Preset[] = [];

  state: SimulationState = {
    genes: {
      iterations: 5,
      branchAngle: 25,
      lightAttraction: 0.5,
      nutrientSupply: 0.6,
      branchReduction: 0.7,
      baseLength: 2.0,
      maxLevel: 8,
      leafDensity: 0.6,
      flowerChance: 0.1,
    },
    environment: {
      lightDirection: { x: 0.2, y: 1.0, z: 0.1 },
      windStrength: 0.1,
      gravityStrength: 0.3,
      temperature: 25,
      humidity: 60,
    },
    animationConfig: {
      branchGrowthSpeed: 1.0,
      leafUnfurlSpeed: 1.0,
      photosynthesisSpeed: 1.0,
      flowerBloomSpeed: 1.0,
      diseaseSpreadSpeed: 0.0,
    },
    plantStructure: null,
    isPlaying: false,
    currentTime: 0,
    isLoading: false,
    error: null,
    currentPresetId: null,
  };

  constructor(
    private plantService: PlantService,
    private renderer: PlantRendererService
  ) {}

  ngOnInit(): void {
    this.renderer.init(this.viewportContainer);

    this.plantService.getPresets().subscribe({
      next: (presets) => {
        this.presets = presets;
        if (presets.length > 0) {
          this.onApplyPreset(presets[0].id);
        } else {
          this.onGenerate();
        }
      },
      error: (err) => {
        this.state.error = '无法连接到后端服务，请确保后端已启动';
        console.error(err);
      },
    });
  }

  onGenesChange(genes: PlantGeneParameters): void {
    this.state.genes = { ...genes };
    this.state.currentPresetId = null;
  }

  onEnvironmentChange(env: EnvironmentConfig): void {
    this.state.environment = { ...env };
    this.state.currentPresetId = null;
  }

  onAnimationChange(anim: AnimationConfig): void {
    this.state.animationConfig = { ...anim };
    if (this.state.plantStructure) {
      this.renderer.setStructure(
        this.state.plantStructure,
        this.state.animationConfig
      );
    }
  }

  onApplyPreset(presetId: string): void {
    const preset = this.presets.find((p) => p.id === presetId);
    if (!preset) return;

    this.state.isLoading = true;
    this.state.error = null;
    this.state.currentPresetId = presetId;

    this.plantService.applyPreset(presetId).subscribe({
      next: (response) => {
        this.state.genes = { ...response.parameters.genes };
        this.state.environment = { ...response.parameters.environment };
        this.state.animationConfig = { ...response.preset.animations };
        this.state.plantStructure = response.structure;
        this.state.isLoading = false;

        this.renderer.setStructure(
          response.structure,
          response.preset.animations
        );
        this.onPlay();
      },
      error: (err) => {
        this.state.isLoading = false;
        this.state.error = '应用预设失败: ' + (err.message || '未知错误');
        console.error(err);
      },
    });
  }

  onGenerate(): void {
    this.state.isLoading = true;
    this.state.error = null;

    this.plantService
      .generate(this.state.genes, this.state.environment)
      .subscribe({
        next: (response) => {
          this.state.plantStructure = response.structure;
          this.state.isLoading = false;

          this.renderer.setStructure(
            response.structure,
            this.state.animationConfig
          );
          this.onPlay();
        },
        error: (err) => {
          this.state.isLoading = false;
          this.state.error =
            '生成植物失败: ' +
            (err.error?.message || err.message || '未知错误');
          console.error(err);
        },
      });
  }

  onPlay(): void {
    if (!this.state.plantStructure) {
      this.onGenerate();
      return;
    }
    this.state.isPlaying = true;
    this.renderer.play();
  }

  onPause(): void {
    this.state.isPlaying = false;
    this.renderer.pause();
  }

  onReset(): void {
    this.state.isPlaying = false;
    this.state.currentTime = 0;
    this.renderer.reset();
  }

  onTriggerOverlap(): void {
    this.state.genes.iterations = 9;
    this.state.genes.branchAngle = 12;
    this.state.genes.branchReduction = 0.92;
    this.state.genes.nutrientSupply = 0.98;
    this.state.genes.baseLength = 1.2;
    this.state.currentPresetId = null;
    this.onGenerate();
  }

  onTriggerLeafFlip(): void {
    this.state.genes.leafDensity = 0.95;
    this.state.genes.iterations = 6;
    this.state.genes.branchAngle = 45;
    this.state.environment.gravityStrength = 0.8;
    this.state.currentPresetId = null;
    this.onGenerate();
  }

  onTriggerOverflow(): void {
    this.state.genes.iterations = 8;
    this.state.genes.baseLength = 4.0;
    this.state.genes.branchAngle = 5;
    this.state.genes.branchReduction = 0.95;
    this.state.genes.lightAttraction = 0.0;
    this.state.environment.gravityStrength = 0.0;
    this.state.currentPresetId = null;
    this.onGenerate();
  }

  onTriggerDeepIteration(): void {
    this.state.genes.iterations = 15;
    this.state.genes.maxLevel = 20;
    this.state.genes.nutrientSupply = 1.0;
    this.state.genes.branchReduction = 0.9;
    this.state.currentPresetId = null;
    this.onGenerate();
  }
}
