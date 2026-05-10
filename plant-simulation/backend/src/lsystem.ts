import {
  Vector3,
  BranchGeometry,
  LeafData,
  FlowerData,
  DiseaseSpot,
  PlantStructure,
  PlantGeneParameters,
  EnvironmentConfig,
} from './types';

interface LSystemState {
  position: Vector3;
  direction: Vector3;
  level: number;
  idStack: string[];
  branchIdCounter: number;
  leafIdCounter: number;
  flowerIdCounter: number;
  diseaseIdCounter: number;
}

class LSystemGenerator {
  private genes: PlantGeneParameters;
  private environment: EnvironmentConfig;
  private branches: BranchGeometry[] = [];
  private leaves: LeafData[] = [];
  private flowers: FlowerData[] = [];
  private diseaseSpots: DiseaseSpot[] = [];
  private randomSeed: number = 12345;

  constructor(genes: PlantGeneParameters, environment: EnvironmentConfig) {
    this.genes = genes;
    this.environment = environment;
  }

  private seededRandom(): number {
    this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
    return this.randomSeed / 233280;
  }

  private normalize(v: Vector3): Vector3 {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (len < 0.0001) return { x: 0, y: 1, z: 0 };
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }

  private add(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  }

  private multiply(v: Vector3, scalar: number): Vector3 {
    return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar };
  }

  private subtract(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  private dot(a: Vector3, b: Vector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  private cross(a: Vector3, b: Vector3): Vector3 {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  }

  private rotateAroundAxis(
    direction: Vector3,
    axis: Vector3,
    angleDeg: number
  ): Vector3 {
    const angle = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const axisNorm = this.normalize(axis);

    const term1 = this.multiply(direction, cos);
    const term2 = this.multiply(this.cross(axisNorm, direction), sin);
    const term3 = this.multiply(axisNorm, this.dot(axisNorm, direction) * (1 - cos));

    return this.normalize(this.add(this.add(term1, term2), term3));
  }

  private calculateBranchPriority(
    start: Vector3,
    direction: Vector3,
    level: number
  ): number {
    const lightDir = this.normalize(this.environment.lightDirection);
    const lightAlignment = (this.dot(direction, lightDir) + 1) / 2;
    const heightScore = Math.max(0, start.y + direction.y);
    const levelPenalty = Math.max(0, 1 - level * 0.05);
    const nutrientFactor = this.genes.nutrientSupply;

    const priority =
      lightAlignment * this.genes.lightAttraction +
      heightScore * 0.3 +
      levelPenalty * 0.2 +
      nutrientFactor * 0.3;

    return Math.max(0, Math.min(1, priority));
  }

  private generateId(
    prefix: string,
    state: LSystemState,
    type: 'branch' | 'leaf' | 'flower' | 'disease'
  ): string {
    let counter: number;
    switch (type) {
      case 'branch':
        counter = state.branchIdCounter++;
        break;
      case 'leaf':
        counter = state.leafIdCounter++;
        break;
      case 'flower':
        counter = state.flowerIdCounter++;
        break;
      case 'disease':
        counter = state.diseaseIdCounter++;
        break;
    }
    return `${prefix}-${counter}-${state.level}`;
  }

  private generateLeaves(
    position: Vector3,
    direction: Vector3,
    level: number,
    state: LSystemState
  ): void {
    const density = this.genes.leafDensity * (1 - level * 0.08);
    const leafCount = Math.floor(density * 3);

    for (let i = 0; i < leafCount; i++) {
      if (this.seededRandom() > density) continue;

      const perpAxis =
        Math.abs(direction.y) < 0.9
          ? this.normalize(this.cross(direction, { x: 0, y: 1, z: 0 }))
          : this.normalize(this.cross(direction, { x: 1, y: 0, z: 0 }));

      const leafRotation = (this.seededRandom() - 0.5) * 360;
      const leafDir = this.rotateAroundAxis(perpAxis, direction, leafRotation);
      const offset = this.multiply(direction, 0.3 + this.seededRandom() * 0.4);

      const leaf: LeafData = {
        position: this.add(position, offset),
        normal: leafDir,
        size: (0.3 + this.seededRandom() * 0.3) * (1 - level * 0.06),
        level,
        rotation: leafRotation,
        id: this.generateId('leaf', state, 'leaf'),
      };
      this.leaves.push(leaf);
    }
  }

  private generateFlowers(
    position: Vector3,
    level: number,
    state: LSystemState
  ): void {
    if (level < 3) return;
    if (this.seededRandom() > this.genes.flowerChance) return;

    const flower: FlowerData = {
      position: { ...position },
      size: 0.4 + this.seededRandom() * 0.2,
      level,
      petals: 5 + Math.floor(this.seededRandom() * 4),
      id: this.generateId('flower', state, 'flower'),
    };
    this.flowers.push(flower);
  }

  private generateDiseaseSpots(
    position: Vector3,
    branchId: string,
    level: number,
    state: LSystemState
  ): void {
    const diseaseChance = 0.05 + (1 - this.genes.nutrientSupply) * 0.15;
    if (this.seededRandom() > diseaseChance) return;

    const spot: DiseaseSpot = {
      position: { ...position },
      radius: 0.1 + this.seededRandom() * 0.15,
      severity: 0.3 + this.seededRandom() * 0.5,
      branchId,
      id: this.generateId('disease', state, 'disease'),
    };
    this.diseaseSpots.push(spot);
  }

  private recursiveBranch(
    state: LSystemState,
    remainingIterations: number
  ): void {
    if (remainingIterations <= 0) return;
    if (state.level > this.genes.maxLevel) return;

    const lengthReduction = Math.pow(
      this.genes.branchReduction,
      state.level
    );
    const length = this.genes.baseLength * lengthReduction;

    if (length < 0.05) return;

    const priority = this.calculateBranchPriority(
      state.position,
      state.direction,
      state.level
    );

    if (priority < 0.15 && state.level > 2) return;

    const start = { ...state.position };
    const end = this.add(state.position, this.multiply(state.direction, length));

    const branchId = this.generateId('branch', state, 'branch');
    const branch: BranchGeometry = {
      start,
      end,
      radius: 0.1 * lengthReduction * this.genes.nutrientSupply,
      level: state.level,
      priority,
      length,
      id: branchId,
    };
    this.branches.push(branch);

    this.generateLeaves(end, state.direction, state.level, state);
    this.generateFlowers(end, state.level, state);
    this.generateDiseaseSpots(end, branchId, state.level, state);

    const newState: LSystemState = {
      ...state,
      position: end,
      level: state.level + 1,
    };

    const branchAngle = this.genes.branchAngle;
    const lightDir = this.normalize(this.environment.lightDirection);

    const up = { x: 0, y: 1, z: 0 };
    const perp1 = this.normalize(
      this.cross(state.direction, Math.abs(this.dot(state.direction, up)) < 0.9 ? up : { x: 1, y: 0, z: 0 })
    );
    const perp2 = this.normalize(this.cross(state.direction, perp1));

    const lightInfluence = this.genes.lightAttraction;
    const toLight = this.subtract(lightDir, state.direction);
    const lightAngle = Math.atan2(
      this.dot(toLight, perp1),
      this.dot(toLight, perp2)
    ) * (180 / Math.PI);

    const branchCount = 2 + Math.floor(this.seededRandom() * 2);
    const angleStep = (360 / branchCount) * (1 - lightInfluence * 0.5);
    const biasAngle = lightAngle * lightInfluence;

    for (let i = 0; i < branchCount; i++) {
      let angle = i * angleStep + biasAngle;
      if (branchCount === 2) {
        angle = i === 0 ? branchAngle : -branchAngle;
      }

      const tiltAngle = (this.seededRandom() - 0.5) * 20 + branchAngle * (this.seededRandom() - 0.3);
      let newDir = this.rotateAroundAxis(state.direction, perp1, tiltAngle);
      newDir = this.rotateAroundAxis(newDir, perp2, angle);

      const gravityPull = this.environment.gravityStrength * 0.05;
      newDir = this.normalize(
        this.add(newDir, { x: 0, y: -gravityPull, z: 0 })
      );

      if (this.seededRandom() > this.genes.nutrientSupply * 0.9 + 0.1) {
        continue;
      }

      const childState: LSystemState = {
        ...newState,
        position: end,
        direction: newDir,
      };

      this.recursiveBranch(childState, remainingIterations - 1);
    }
  }

  public generate(): PlantStructure {
    this.branches = [];
    this.leaves = [];
    this.flowers = [];
    this.diseaseSpots = [];

    const initialState: LSystemState = {
      position: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: 1, z: 0 },
      level: 0,
      idStack: [],
      branchIdCounter: 0,
      leafIdCounter: 0,
      flowerIdCounter: 0,
      diseaseIdCounter: 0,
    };

    this.recursiveBranch(initialState, this.genes.iterations);

    let maxLevel = 0;
    this.branches.forEach((b) => {
      if (b.level > maxLevel) maxLevel = b.level;
    });

    return {
      branches: this.branches,
      leaves: this.leaves,
      flowers: this.flowers,
      diseaseSpots: this.diseaseSpots,
      metadata: {
        totalBranches: this.branches.length,
        maxLevel,
        growthSteps: maxLevel + 1,
      },
    };
  }
}

export { LSystemGenerator };
