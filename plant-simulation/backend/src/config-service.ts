import * as fs from 'fs';
import * as path from 'path';
import { Preset, PlantGeneParameters, EnvironmentConfig } from './types';

class ConfigService {
  private dataDir: string;
  private presets: Preset[] = [];
  private defaultGenes: PlantGeneParameters;
  private defaultEnvironment: EnvironmentConfig;

  constructor() {
    this.dataDir = this.resolveDataDir();
    console.log('[ConfigService] Data directory:', this.dataDir);
    this.loadDefaults();
    this.loadPresets();
  }

  private resolveDataDir(): string {
    const possiblePaths = [
      path.resolve(process.cwd(), 'data'),
      path.resolve(__dirname, '..', '..', 'data'),
      path.resolve(__dirname, '..', 'data'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
        const testFile = path.join(p, 'presets.json');
        if (fs.existsSync(testFile)) {
          return p;
        }
      }
    }

    console.warn('[ConfigService] Could not find data directory, using:', possiblePaths[0]);
    return possiblePaths[0];
  }

  private loadDefaults(): void {
    const genesPath = path.join(this.dataDir, 'default-genes.json');
    const envPath = path.join(this.dataDir, 'default-environment.json');

    try {
      if (fs.existsSync(genesPath)) {
        this.defaultGenes = JSON.parse(fs.readFileSync(genesPath, 'utf-8'));
        console.log('[ConfigService] Loaded default genes');
      } else {
        console.warn('[ConfigService] default-genes.json not found, using fallback');
        this.defaultGenes = {
          iterations: 5,
          branchAngle: 25,
          lightAttraction: 0.5,
          nutrientSupply: 0.6,
          branchReduction: 0.7,
          baseLength: 2.0,
          maxLevel: 8,
          leafDensity: 0.6,
          flowerChance: 0.1,
        };
      }

      if (fs.existsSync(envPath)) {
        this.defaultEnvironment = JSON.parse(fs.readFileSync(envPath, 'utf-8'));
        console.log('[ConfigService] Loaded default environment');
      } else {
        console.warn('[ConfigService] default-environment.json not found, using fallback');
        this.defaultEnvironment = {
          lightDirection: { x: 0.2, y: 1.0, z: 0.1 },
          windStrength: 0.1,
          gravityStrength: 0.3,
          temperature: 25,
          humidity: 60,
        };
      }
    } catch (err) {
      console.error('[ConfigService] Error loading defaults:', err);
      this.defaultGenes = {
        iterations: 5,
        branchAngle: 25,
        lightAttraction: 0.5,
        nutrientSupply: 0.6,
        branchReduction: 0.7,
        baseLength: 2.0,
        maxLevel: 8,
        leafDensity: 0.6,
        flowerChance: 0.1,
      };
      this.defaultEnvironment = {
        lightDirection: { x: 0.2, y: 1.0, z: 0.1 },
        windStrength: 0.1,
        gravityStrength: 0.3,
        temperature: 25,
        humidity: 60,
      };
    }
  }

  private loadPresets(): void {
    const presetsPath = path.join(this.dataDir, 'presets.json');
    console.log('[ConfigService] Loading presets from:', presetsPath);
    
    try {
      if (fs.existsSync(presetsPath)) {
        const raw = fs.readFileSync(presetsPath, 'utf-8');
        this.presets = JSON.parse(raw);
        console.log('[ConfigService] Loaded', this.presets.length, 'presets');
      } else {
        console.warn('[ConfigService] presets.json not found at:', presetsPath);
        this.presets = this.getDefaultPresets();
      }
    } catch (err) {
      console.error('[ConfigService] Error loading presets:', err);
      this.presets = this.getDefaultPresets();
    }
  }

  private getDefaultPresets(): Preset[] {
    return [
      {
        id: 'sunny-growth',
        name: '向阳生长预设',
        description: '健康生长状态',
        genes: {
          iterations: 6,
          branchAngle: 22,
          lightAttraction: 0.85,
          nutrientSupply: 0.75,
          branchReduction: 0.68,
          baseLength: 2.2,
          maxLevel: 10,
          leafDensity: 0.85,
          flowerChance: 0.25,
        },
        environment: {
          lightDirection: { x: 0.3, y: 1.0, z: 0.0 },
          windStrength: 0.15,
          gravityStrength: 0.25,
          temperature: 28,
          humidity: 70,
        },
        animations: {
          branchGrowthSpeed: 0.8,
          leafUnfurlSpeed: 1.2,
          photosynthesisSpeed: 2.0,
          flowerBloomSpeed: 1.0,
          diseaseSpreadSpeed: 0.0,
        },
      },
      {
        id: 'shady-etiolation',
        name: '阴暗徒长预设',
        description: '光照不足徒长',
        genes: {
          iterations: 7,
          branchAngle: 15,
          lightAttraction: 0.95,
          nutrientSupply: 0.4,
          branchReduction: 0.55,
          baseLength: 3.5,
          maxLevel: 12,
          leafDensity: 0.25,
          flowerChance: 0.02,
        },
        environment: {
          lightDirection: { x: 0.05, y: 1.0, z: 0.0 },
          windStrength: 0.05,
          gravityStrength: 0.4,
          temperature: 20,
          humidity: 85,
        },
        animations: {
          branchGrowthSpeed: 1.5,
          leafUnfurlSpeed: 0.5,
          photosynthesisSpeed: 0.3,
          flowerBloomSpeed: 0.2,
          diseaseSpreadSpeed: 0.05,
        },
      },
      {
        id: 'nutrient-overload',
        name: '营养过剩预设',
        description: '密集生长重叠',
        genes: {
          iterations: 9,
          branchAngle: 35,
          lightAttraction: 0.3,
          nutrientSupply: 0.98,
          branchReduction: 0.85,
          baseLength: 1.5,
          maxLevel: 15,
          leafDensity: 0.95,
          flowerChance: 0.4,
        },
        environment: {
          lightDirection: { x: 0.1, y: 1.0, z: 0.1 },
          windStrength: 0.08,
          gravityStrength: 0.2,
          temperature: 30,
          humidity: 75,
        },
        animations: {
          branchGrowthSpeed: 1.8,
          leafUnfurlSpeed: 1.5,
          photosynthesisSpeed: 3.0,
          flowerBloomSpeed: 1.8,
          diseaseSpreadSpeed: 0.0,
        },
      },
      {
        id: 'withered-disease',
        name: '枯萎病变预设',
        description: '病害侵袭状态',
        genes: {
          iterations: 4,
          branchAngle: 20,
          lightAttraction: 0.1,
          nutrientSupply: 0.15,
          branchReduction: 0.4,
          baseLength: 1.2,
          maxLevel: 5,
          leafDensity: 0.15,
          flowerChance: 0.0,
        },
        environment: {
          lightDirection: { x: 0.0, y: 0.5, z: 0.0 },
          windStrength: 0.2,
          gravityStrength: 0.5,
          temperature: 15,
          humidity: 40,
        },
        animations: {
          branchGrowthSpeed: 0.2,
          leafUnfurlSpeed: 0.1,
          photosynthesisSpeed: 0.1,
          flowerBloomSpeed: 0.0,
          diseaseSpreadSpeed: 2.5,
        },
      },
    ];
  }

  public getPresets(): Preset[] {
    return this.presets;
  }

  public getPreset(id: string): Preset | undefined {
    return this.presets.find((p) => p.id === id);
  }

  public getDefaultGenes(): PlantGeneParameters {
    return { ...this.defaultGenes };
  }

  public getDefaultEnvironment(): EnvironmentConfig {
    return { ...this.defaultEnvironment };
  }

  public saveGenes(genes: PlantGeneParameters): void {
    const genesPath = path.join(this.dataDir, 'default-genes.json');
    fs.writeFileSync(genesPath, JSON.stringify(genes, null, 2), 'utf-8');
    this.defaultGenes = genes;
  }

  public saveEnvironment(env: EnvironmentConfig): void {
    const envPath = path.join(this.dataDir, 'default-environment.json');
    fs.writeFileSync(envPath, JSON.stringify(env, null, 2), 'utf-8');
    this.defaultEnvironment = env;
  }
}

export { ConfigService };
