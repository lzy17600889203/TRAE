const math = require('mathjs');

const SPEED_OF_SOUND = 343;
const AIR_DENSITY = 1.225;

class AcousticsEngine {
  constructor() {
    this.gridSize = 20;
    this.domain = { x: 5, y: 5, z: 5 };
  }

  setDomain(x, y, z) {
    this.domain = { x, y, z };
  }

  waveNumber(frequency) {
    return (2 * Math.PI * frequency) / SPEED_OF_SOUND;
  }

  wavelength(frequency) {
    return SPEED_OF_SOUND / frequency;
  }

  checkAliasing(frequency) {
    const k = this.waveNumber(frequency);
    const gridSpacing = Math.min(
      this.domain.x / this.gridSize,
      this.domain.y / this.gridSize,
      this.domain.z / this.gridSize
    );
    const requiredSpacings = [gridSpacing, gridSpacing * 2, gridSpacing * 0.5];
    const results = [];
    requiredSpacings.forEach((h, idx) => {
      const kh = k * h;
      const isAliased = kh > 1.0;
      const severity = kh > 3.0 ? '严重混叠' : kh > 1.5 ? '中度混叠' : kh > 1.0 ? '轻度混叠' : '正常';
      results.push({
        gridIndex: idx,
        spacing: h,
        kh,
        isAliased,
        severity
      });
    });
    return results;
  }

  createHelmholtzMatrix(frequency, walls, sources, absorptionCoeff = 0.05) {
    const k = this.waveNumber(frequency);
    const N = this.gridSize;
    const totalNodes = Math.pow(N, 3);
    const A = math.sparse(math.zeros([totalNodes, totalNodes]));
    const b = math.zeros(totalNodes);
    
    const dx = this.domain.x / (N - 1);
    const dy = this.domain.y / (N - 1);
    const dz = this.domain.z / (N - 1);
    
    const idxToPos = (idx) => {
      const i = idx % N;
      const j = Math.floor(idx / N) % N;
      const k = Math.floor(idx / (N * N));
      return [i, j, k];
    };
    
    const posToIdx = (i, j, k) => i + j * N + k * N * N;
    
    for (let idx = 0; idx < totalNodes; idx++) {
      const [i, j, k] = idxToPos(idx);
      const onBoundary = i === 0 || i === N - 1 || j === 0 || j === N - 1 || k === 0 || k === N - 1;
      
      let boundaryImpedance = 1.0;
      let boundaryReflection = 0.99;
      let isAbsorbing = false;
      
      if (onBoundary && walls) {
        const pos = [
          i * dx - this.domain.x / 2,
          j * dy - this.domain.y / 2,
          k * dz - this.domain.z / 2
        ];
        for (const wall of walls) {
          if (this.isPointNearWall(pos, wall)) {
            boundaryImpedance = wall.impedance || 1.0;
            boundaryReflection = wall.reflection || 0.99;
            isAbsorbing = wall.is_absorber === 1 || (wall.absorption > 0.1);
            break;
          }
        }
      }
      
      const diag = -6 / (dx * dx) + k * k;
      A.set([idx, idx], diag);
      
      if (i > 0) A.set([idx, posToIdx(i - 1, j, k)], 1 / (dx * dx));
      else if (onBoundary) this.applyBoundaryCondition(A, idx, diag, boundaryImpedance, boundaryReflection, isAbsorbing, absorptionCoeff, dx);
      
      if (i < N - 1) A.set([idx, posToIdx(i + 1, j, k)], 1 / (dx * dx));
      else if (onBoundary) this.applyBoundaryCondition(A, idx, diag, boundaryImpedance, boundaryReflection, isAbsorbing, absorptionCoeff, dx);
      
      if (j > 0) A.set([idx, posToIdx(i, j - 1, k)], 1 / (dy * dy));
      else if (onBoundary) this.applyBoundaryCondition(A, idx, diag, boundaryImpedance, boundaryReflection, isAbsorbing, absorptionCoeff, dy);
      
      if (j < N - 1) A.set([idx, posToIdx(i, j + 1, k)], 1 / (dy * dy));
      else if (onBoundary) this.applyBoundaryCondition(A, idx, diag, boundaryImpedance, boundaryReflection, isAbsorbing, absorptionCoeff, dy);
      
      if (k > 0) A.set([idx, posToIdx(i, j, k - 1)], 1 / (dz * dz));
      else if (onBoundary) this.applyBoundaryCondition(A, idx, diag, boundaryImpedance, boundaryReflection, isAbsorbing, absorptionCoeff, dz);
      
      if (k < N - 1) A.set([idx, posToIdx(i, j, k + 1)], 1 / (dz * dz));
      else if (onBoundary) this.applyBoundaryCondition(A, idx, diag, boundaryImpedance, boundaryReflection, isAbsorbing, absorptionCoeff, dz);
      
      if (sources) {
        for (const src of sources) {
          const srcIdx = [
            Math.floor((src.position_x + this.domain.x / 2) / dx),
            Math.floor((src.position_y + this.domain.y / 2) / dy),
            Math.floor((src.position_z + this.domain.z / 2) / dz)
          ];
          if (srcIdx[0] === i && srcIdx[1] === j && srcIdx[2] === k) {
            const distToWall = this.distanceToNearestWall(src, walls);
            const srcFactor = distToWall < 0.1 ? 10.0 : 1.0;
            b.set([idx], src.amplitude * srcFactor);
          }
        }
      }
    }
    
    return { A, b };
  }

  applyBoundaryCondition(A, idx, diag, impedance, reflection, isAbsorbing, absorptionCoeff, spacing) {
    const omega = 2 * Math.PI * 440;
    const characteristicImpedance = AIR_DENSITY * SPEED_OF_SOUND;
    const normalizedImpedance = impedance * characteristicImpedance;
    
    if (isAbsorbing || absorptionCoeff > 0.3) {
      const k = omega / SPEED_OF_SOUND;
      const beta = k * Math.sqrt(1 - (1 - absorptionCoeff) * (1 - absorptionCoeff));
      const impedanceTerm = omega * AIR_DENSITY / normalizedImpedance;
      const modifiedDiag = diag + beta / spacing + impedanceTerm * 0.1;
      A.set([idx, idx], modifiedDiag);
    } else if (reflection > 0.95) {
      A.set([idx, idx], diag * 1.1);
    } else {
      const admittance = 1 / normalizedImpedance;
      const k = omega / SPEED_OF_SOUND;
      const impedanceTerm = admittance * k * spacing * 0.1;
      A.set([idx, idx], diag + impedanceTerm);
    }
  }

  isPointNearWall(point, wall) {
    const vertices = JSON.parse(wall.vertices);
    if (vertices.length < 3) return false;
    
    const normal = this.calculateNormal(vertices);
    const d = -normal[0] * vertices[0][0] - normal[1] * vertices[0][1] - normal[2] * vertices[0][2];
    const distance = Math.abs(normal[0] * point[0] + normal[1] * point[1] + normal[2] * point[2] + d);
    
    return distance < 0.3;
  }

  calculateNormal(vertices) {
    if (vertices.length < 3) return [0, 0, 1];
    const v1 = [
      vertices[1][0] - vertices[0][0],
      vertices[1][1] - vertices[0][1],
      vertices[1][2] - vertices[0][2]
    ];
    const v2 = [
      vertices[2][0] - vertices[0][0],
      vertices[2][1] - vertices[0][1],
      vertices[2][2] - vertices[0][2]
    ];
    const normal = [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0]
    ];
    const len = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
    return len > 0 ? [normal[0] / len, normal[1] / len, normal[2] / len] : [0, 0, 1];
  }

  distanceToNearestWall(source, walls) {
    if (!walls || walls.length === 0) return this.domain.x;
    let minDist = Infinity;
    
    for (const wall of walls) {
      const vertices = JSON.parse(wall.vertices);
      for (const v of vertices) {
        const dx = source.position_x - v[0];
        const dy = source.position_y - v[1];
        const dz = source.position_z - v[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        minDist = Math.min(minDist, dist);
      }
    }
    return minDist;
  }

  solveHelmholtz(frequency, walls, sources, absorptionCoeff = 0.05) {
    const { A, b } = this.createHelmholtzMatrix(frequency, walls, sources, absorptionCoeff);
    
    try {
      const A_dense = math.matrix(A.toArray());
      const b_vec = math.matrix(b.toArray ? b.toArray() : b);
      
      const solution = math.lusolve(A_dense, b_vec);
      const solutionArr = solution.toArray ? solution.toArray() : solution;
      
      const N = this.gridSize;
      const pressureField = new Array(N).fill(0).map(() => 
        new Array(N).fill(0).map(() => new Array(N).fill(0))
      );
      
      let idx = 0;
      for (let k = 0; k < N; k++) {
        for (let j = 0; j < N; j++) {
          for (let i = 0; i < N; i++) {
            const val = solutionArr[idx] && solutionArr[idx][0] !== undefined ? solutionArr[idx][0] : 0;
            pressureField[i][j][k] = this.handleComplexNumber(val);
            idx++;
          }
        }
      }
      
      return pressureField;
    } catch (e) {
      console.error('Solver error:', e);
      const N = this.gridSize;
      return new Array(N).fill(0).map(() => 
        new Array(N).fill(0).map(() => new Array(N).fill(0))
      );
    }
  }

  handleComplexNumber(val) {
    if (val && typeof val === 'object' && 're' in val && 'im' in val) {
      return { re: val.re, im: val.im, mag: Math.sqrt(val.re * val.re + val.im * val.im) };
    }
    const num = Number(val);
    return { re: num || 0, im: 0, mag: Math.abs(num || 0) };
  }

  findResonances(walls, sources, absorptionCoeff = 0.05) {
    const resonances = [];
    const fundamentalFrequencies = this.calculateEigenfrequencies();
    
    for (const freq of fundamentalFrequencies) {
      const aliasingInfo = this.checkAliasing(freq);
      const pressure = this.solveHelmholtz(freq, walls, sources, absorptionCoeff);
      const maxPressure = this.getMaxPressure(pressure);
      const quality = maxPressure / (absorptionCoeff + 0.01);
      
      const anomalies = [];
      for (const alias of aliasingInfo) {
        if (alias.isAliased) {
          anomalies.push(`网格${alias.gridIndex}: ${alias.severity} (kh=${alias.kh.toFixed(2)})`);
        }
      }
      
      resonances.push({
        frequency: freq,
        quality: quality,
        maxPressure: maxPressure,
        anomalies: anomalies.length > 0 ? anomalies : null
      });
    }
    
    return resonances;
  }

  calculateEigenfrequencies() {
    const frequencies = [];
    const { x, y, z } = this.domain;
    
    for (let nx = 0; nx <= 3; nx++) {
      for (let ny = 0; ny <= 3; ny++) {
        for (let nz = 0; nz <= 3; nz++) {
          if (nx + ny + nz > 0) {
            const freq = (SPEED_OF_SOUND / 2) * Math.sqrt(
              Math.pow(nx / x, 2) + Math.pow(ny / y, 2) + Math.pow(nz / z, 2)
            );
            if (freq > 20 && freq < 20000) {
              frequencies.push(freq);
            }
          }
        }
      }
    }
    
    return [...new Set(frequencies)].sort((a, b) => a - b).slice(0, 10);
  }

  getMaxPressure(pressureField) {
    let max = 0;
    const N = this.gridSize;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        for (let k = 0; k < N; k++) {
          const val = pressureField[i][j][k];
          const mag = typeof val === 'object' ? val.mag : Math.abs(val);
          max = Math.max(max, mag);
        }
      }
    }
    return max;
  }

  calculateFrequencyResponse(walls, sources, absorptionCoeff = 0.05, freqRange = [20, 2000], steps = 50) {
    const response = [];
    const [minFreq, maxFreq] = freqRange;
    
    for (let i = 0; i <= steps; i++) {
      const freq = minFreq + (maxFreq - minFreq) * (i / steps);
      const pressure = this.solveHelmholtz(freq, walls, sources, absorptionCoeff);
      const maxPressure = this.getMaxPressure(pressure);
      const aliasingInfo = this.checkAliasing(freq);
      const hasAliasing = aliasingInfo.some(a => a.isAliased);
      
      response.push({
        frequency: freq,
        pressure: maxPressure,
        db: 20 * Math.log10(maxPressure + 0.0001),
        aliased: hasAliasing,
        wavelength: this.wavelength(freq)
      });
    }
    
    return response;
  }

  calculateStandingWaveNodes(frequency) {
    const k = this.waveNumber(frequency);
    const { x, y, z } = this.domain;
    const nodes = [];
    
    for (let i = 0; i < 10; i++) {
      const t = i / 10;
      nodes.push({
        position: [
          x * t * Math.sin(k * x * t),
          y * t * Math.cos(k * y * t),
          z * t * Math.sin(k * z * t + Math.PI / 4)
        ],
        pressure: 0.1 * Math.sin(2 * Math.PI * t)
      });
    }
    
    return nodes;
  }

  checkEnergyConservation(walls) {
    let totalReflection = 0;
    let totalAbsorption = 0;
    let anomalies = [];
    
    if (walls && walls.length > 0) {
      for (const wall of walls) {
        const ref = wall.reflection || 0;
        const abs = wall.absorption || 0;
        const total = ref + abs;
        
        totalReflection += ref;
        totalAbsorption += abs;
        
        if (abs > 1.0) {
          anomalies.push(`吸音率超限 (${abs.toFixed(2)})，违反能量守恒`);
        }
        if (total > 1.05) {
          anomalies.push(`反射+吸收>1 (${total.toFixed(2)})，能量不守恒`);
        }
      }
    }
    
    return {
      totalReflection: walls && walls.length > 0 ? totalReflection / walls.length : 0.99,
      totalAbsorption: walls && walls.length > 0 ? totalAbsorption / walls.length : 0.01,
      anomalies
    };
  }

  checkHighOrderModes(dimensions) {
    const { x, y, z } = dimensions || this.domain;
    const ratios = [y / x, z / x, z / y];
    const anomalies = [];
    
    for (const ratio of ratios) {
      if (ratio > 3 || ratio < 0.33) {
        anomalies.push(`长宽比失调 (${ratio.toFixed(2)})，可能激发高阶寄生模式`);
      }
    }
    
    return anomalies;
  }
}

module.exports = AcousticsEngine;
