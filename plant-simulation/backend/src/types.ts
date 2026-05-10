export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface BranchGeometry {
  start: Vector3;
  end: Vector3;
  radius: number;
  level: number;
  priority: number;
  length: number;
  id: string;
}

export interface LeafData {
  position: Vector3;
  normal: Vector3;
  size: number;
  level: number;
  rotation: number;
  id: string;
}

export interface FlowerData {
  position: Vector3;
  size: number;
  level: number;
  petals: number;
  id: string;
}

export interface DiseaseSpot {
  position: Vector3;
  radius: number;
  severity: number;
  branchId: string;
  id: string;
}

export interface PlantStructure {
  branches: BranchGeometry[];
  leaves: LeafData[];
  flowers: FlowerData[];
  diseaseSpots: DiseaseSpot[];
  metadata: {
    totalBranches: number;
    maxLevel: number;
    growthSteps: number;
  };
}

export interface PlantGeneParameters {
  iterations: number;
  branchAngle: number;
  lightAttraction: number;
  nutrientSupply: number;
  branchReduction: number;
  baseLength: number;
  maxLevel: number;
  leafDensity: number;
  flowerChance: number;
}

export interface EnvironmentConfig {
  lightDirection: Vector3;
  windStrength: number;
  gravityStrength: number;
  temperature: number;
  humidity: number;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  genes: PlantGeneParameters;
  environment: EnvironmentConfig;
  animations: AnimationConfig;
}

export interface AnimationConfig {
  branchGrowthSpeed: number;
  leafUnfurlSpeed: number;
  photosynthesisSpeed: number;
  flowerBloomSpeed: number;
  diseaseSpreadSpeed: number;
}

export interface GenerateRequest {
  genes: PlantGeneParameters;
  environment: EnvironmentConfig;
}

export interface SimulationState {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  plantStructure: PlantStructure | null;
}
