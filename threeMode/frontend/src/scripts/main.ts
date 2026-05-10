import { PrintRenderer } from './renderer';
import { sliceModel } from './slicer';
import { generateModel } from './modelGenerator';
import { getPreset, DEFAULT_PARAMETERS } from './presets';
import type { PrintParameters, SliceResult, ModelData } from './types';

class AppController {
  private renderer: PrintRenderer;
  private currentModel: ModelData | null = null;
  private currentSliceResult: SliceResult | null = null;
  private isPrinting: boolean = false;
  private isPaused: boolean = false;
  private lastTime: number = 0;
  private animationId: number | null = null;

  private parameters: PrintParameters = { ...DEFAULT_PARAMETERS };

  constructor() {
    this.renderer = new PrintRenderer('canvas-container');
    this.renderer.onProgressUpdate = this.handleProgressUpdate.bind(this);
    this.renderer.onErrorDetected = this.handleErrorDetected.bind(this);

    this.setupEventListeners();
    this.loadDefaultModel();
  }

  private setupEventListeners(): void {
    document.getElementById('importModel')?.addEventListener('click', () => {
      const select = document.getElementById('modelSelect') as HTMLSelectElement;
      this.loadModel(select.value);
    });

    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const presetId = (e.currentTarget as HTMLElement).dataset.preset;
        if (presetId) this.loadPreset(presetId);
      });
    });

    document.getElementById('startSlice')?.addEventListener('click', () => {
      this.startSlice();
    });

    document.getElementById('startPrint')?.addEventListener('click', () => {
      this.startPrint();
    });

    document.getElementById('pausePrint')?.addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('resetScene')?.addEventListener('click', () => {
      this.resetScene();
    });

    const layerHeight = document.getElementById('layerHeight') as HTMLInputElement;
    layerHeight?.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.parameters.layerHeight = value;
      (document.getElementById('layerHeightValue') as HTMLElement).textContent = value.toFixed(2);
    });

    const infillDensity = document.getElementById('infillDensity') as HTMLInputElement;
    infillDensity?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.parameters.infillDensity = value;
      (document.getElementById('infillDensityValue') as HTMLElement).textContent = value.toString();
    });

    const printSpeed = document.getElementById('printSpeed') as HTMLInputElement;
    printSpeed?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.parameters.printSpeed = value;
      (document.getElementById('printSpeedValue') as HTMLElement).textContent = value.toString();
    });

    const supportStyle = document.getElementById('supportStyle') as HTMLSelectElement;
    supportStyle?.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      this.parameters.supportStyle = value as any;
    });

    const animationSpeed = document.getElementById('animationSpeed') as HTMLInputElement;
    animationSpeed?.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.renderer.setAnimationSpeed(value);
      (document.getElementById('animationSpeedValue') as HTMLElement).textContent = value.toFixed(1) + 'x';
    });

    this.setupVisibilityControls();
  }

  private setupVisibilityControls(): void {
    const showModel = document.getElementById('showModel') as HTMLInputElement;
    const showSlices = document.getElementById('showSlices') as HTMLInputElement;
    const showPaths = document.getElementById('showPaths') as HTMLInputElement;
    const showSupports = document.getElementById('showSupports') as HTMLInputElement;
    const showInfill = document.getElementById('showInfill') as HTMLInputElement;
    const showErrors = document.getElementById('showErrors') as HTMLInputElement;
    const showNozzle = document.getElementById('showNozzle') as HTMLInputElement;

    const updateVisibility = () => {
      this.renderer.setVisibility({
        model: showModel?.checked ?? true,
        wireframe: showModel?.checked ?? true,
        paths: showPaths?.checked ?? true,
        slices: showSlices?.checked ?? false,
        nozzle: showNozzle?.checked ?? true,
        supports: showSupports?.checked ?? true,
        infill: showInfill?.checked ?? true,
        errors: showErrors?.checked ?? true,
      });
    };

    showModel?.addEventListener('change', updateVisibility);
    showSlices?.addEventListener('change', updateVisibility);
    showPaths?.addEventListener('change', updateVisibility);
    showSupports?.addEventListener('change', updateVisibility);
    showInfill?.addEventListener('change', updateVisibility);
    showErrors?.addEventListener('change', updateVisibility);
    showNozzle?.addEventListener('change', updateVisibility);
  }

  private loadDefaultModel(): void {
    this.loadModel('cube');
  }

  private loadModel(modelType: string): void {
    this.setStatus('working', '加载模型中...');
    this.stopPrinting();

    setTimeout(() => {
      this.currentModel = generateModel(modelType);
      this.renderer.loadModel(this.currentModel.vertices, this.currentModel.triangles);
      this.currentSliceResult = null;
      this.setStatus('ready', '模型加载完成');
    }, 100);
  }

  private loadPreset(presetId: string): void {
    this.setStatus('working', '加载预设...');
    this.stopPrinting();

    const preset = getPreset(presetId);

    setTimeout(() => {
      this.parameters = { ...preset.parameters };

      (document.getElementById('layerHeight') as HTMLInputElement).value = 
        preset.parameters.layerHeight.toString();
      (document.getElementById('layerHeightValue') as HTMLElement).textContent = 
        preset.parameters.layerHeight.toFixed(2);

      (document.getElementById('infillDensity') as HTMLInputElement).value = 
        preset.parameters.infillDensity.toString();
      (document.getElementById('infillDensityValue') as HTMLElement).textContent = 
        preset.parameters.infillDensity.toString();

      (document.getElementById('printSpeed') as HTMLInputElement).value = 
        preset.parameters.printSpeed.toString();
      (document.getElementById('printSpeedValue') as HTMLElement).textContent = 
        preset.parameters.printSpeed.toString();

      (document.getElementById('supportStyle') as HTMLSelectElement).value = 
        preset.parameters.supportStyle;

      (document.getElementById('modelSelect') as HTMLSelectElement).value = 
        preset.modelType;

      this.loadModel(preset.modelType);

      setTimeout(() => {
        this.startSlice();
      }, 200);
    }, 100);
  }

  private startSlice(): void {
    if (!this.currentModel) {
      this.setStatus('error', '请先加载模型');
      return;
    }

    this.setStatus('working', '切片计算中...');
    this.stopPrinting();

    setTimeout(() => {
      this.currentSliceResult = sliceModel(this.currentModel!, this.parameters);

      (document.getElementById('totalLayers') as HTMLElement).textContent = 
        this.currentSliceResult.layers.length.toString();
      (document.getElementById('gcodeCount') as HTMLElement).textContent = 
        this.currentSliceResult.totalGcodeLines.toString();
      (document.getElementById('travelDistance') as HTMLElement).textContent = 
        this.currentSliceResult.totalTravelDistance.toFixed(1);

      this.renderer.showAllPaths(this.currentSliceResult);

      if (this.currentSliceResult.errors.length > 0) {
        this.setStatus('warning', `检测到 ${this.currentSliceResult.errors.length} 个打印问题`);
      } else {
        this.setStatus('ready', '切片完成，可开始打印');
      }
    }, 100);
  }

  private startPrint(): void {
    if (!this.currentSliceResult) {
      this.setStatus('error', '请先进行切片');
      return;
    }

    if (this.isPaused) {
      this.isPaused = false;
      this.setStatus('working', '继续打印...');
      this.startAnimationLoop();
      return;
    }

    this.renderer.resetAnimation();
    this.isPrinting = true;
    this.isPaused = false;
    this.setStatus('working', '开始打印...');

    this.renderer.setVisibility({
      model: true,
      paths: false,
    });

    this.lastTime = performance.now();
    this.startAnimationLoop();
  }

  private startAnimationLoop(): void {
    const animate = () => {
      if (!this.isPrinting || this.isPaused) {
        return;
      }

      const currentTime = performance.now();
      const deltaTime = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      const continuePrinting = this.renderer.animatePrintStep(deltaTime);

      if (!continuePrinting) {
        this.isPrinting = false;
        this.setStatus('ready', '打印完成！');
        return;
      }

      this.animationId = requestAnimationFrame(animate);
    };

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    animate();
  }

  private togglePause(): void {
    if (!this.isPrinting) return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.setStatus('warning', '打印已暂停');
    } else {
      this.setStatus('working', '继续打印...');
      this.lastTime = performance.now();
      this.startAnimationLoop();
    }
  }

  private stopPrinting(): void {
    this.isPrinting = false;
    this.isPaused = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private resetScene(): void {
    this.stopPrinting();
    this.renderer.resetAnimation();

    if (this.currentModel) {
      this.renderer.loadModel(this.currentModel.vertices, this.currentModel.triangles);
    }

    if (this.currentSliceResult) {
      this.renderer.showAllPaths(this.currentSliceResult);
    }

    (document.getElementById('currentLayer') as HTMLElement).textContent = '0';
    (document.getElementById('progress') as HTMLElement).textContent = '0%';

    this.setStatus('ready', '场景已重置');
  }

  private handleProgressUpdate(layer: number, progress: number): void {
    if (this.currentSliceResult) {
      (document.getElementById('currentLayer') as HTMLElement).textContent = 
        (layer + 1).toString();
      (document.getElementById('progress') as HTMLElement).textContent = 
        progress.toFixed(1) + '%';
    }
  }

  private handleErrorDetected(errorInfo: { type: string; message: string }): void {
    const statusDot = document.querySelector('.status-dot') as HTMLElement;
    if (statusDot) {
      statusDot.classList.remove('ready', 'working');
      statusDot.classList.add('error');
    }
    (document.getElementById('statusText') as HTMLElement).textContent = 
      `错误: ${errorInfo.message}`;
  }

  private setStatus(state: 'ready' | 'working' | 'warning' | 'error', text: string): void {
    const statusDot = document.querySelector('.status-dot') as HTMLElement;
    const statusText = document.getElementById('statusText') as HTMLElement;

    if (statusDot) {
      statusDot.className = 'status-dot';
      if (state !== 'ready') {
        statusDot.classList.add(state);
      }
    }

    if (statusText) {
      statusText.textContent = text;
      statusText.style.color = state === 'error' ? '#fab1a0' : 
                               state === 'warning' ? '#fdcb6e' : 
                               state === 'working' ? '#74b9ff' : '#55efc4';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AppController();
});
