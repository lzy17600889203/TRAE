import type { PresetConfig, PrintParameters } from './types';

export const DEFAULT_PARAMETERS: PrintParameters = {
  layerHeight: 0.2,
  infillDensity: 20,
  printSpeed: 80,
  supportStyle: 'none',
  infillPattern: 'line',
  nozzleDiameter: 0.4,
  extrusionWidth: 0.44,
  enableErrors: true,
};

export const PRESETS: Record<string, PresetConfig> = {
  standard: {
    id: 'standard',
    name: '标准填充预设',
    modelType: 'cube',
    description: '标准配置，展示正常的打印过程',
    parameters: {
      ...DEFAULT_PARAMETERS,
      layerHeight: 0.2,
      infillDensity: 20,
      printSpeed: 80,
      supportStyle: 'none',
      enableErrors: false,
    },
  },
  hollow: {
    id: 'hollow',
    name: '空心外壳预设',
    modelType: 'sphere',
    description: '空心打印，只有外壳没有填充',
    parameters: {
      ...DEFAULT_PARAMETERS,
      layerHeight: 0.15,
      infillDensity: 0,
      printSpeed: 60,
      supportStyle: 'grid',
      enableErrors: false,
    },
  },
  missing_support: {
    id: 'missing_support',
    name: '支撑缺失预设',
    modelType: 'overhang',
    description: '大角度悬臂但无支撑，展示塌陷效果',
    parameters: {
      ...DEFAULT_PARAMETERS,
      layerHeight: 0.2,
      infillDensity: 15,
      printSpeed: 100,
      supportStyle: 'none',
      enableErrors: true,
    },
  },
  fast_jitter: {
    id: 'fast_jitter',
    name: '高速抖动预设',
    modelType: 'torus',
    description: '高速打印导致路径混乱和抖动',
    parameters: {
      ...DEFAULT_PARAMETERS,
      layerHeight: 0.3,
      infillDensity: 50,
      printSpeed: 200,
      supportStyle: 'none',
      enableErrors: true,
    },
  },
};

export function getPreset(presetId: string): PresetConfig {
  return PRESETS[presetId] || PRESETS.standard;
}

export function getAllPresets(): PresetConfig[] {
  return Object.values(PRESETS);
}
