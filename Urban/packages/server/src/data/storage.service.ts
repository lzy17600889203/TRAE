import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface NodeData {
  id: string;
  x: number;
  y: number;
  pressure: number;
  elevation: number;
  isSource: boolean;
  isSink: boolean;
  demand: number;
  type: string;
  flowIn: number;
  flowOut: number;
  hasHighPressureWarning: boolean;
  pressureLimit: number;
}

export interface PipeData {
  id: string;
  startNodeId: string;
  endNodeId: string;
  diameter: number;
  roughness: number;
  length: number;
  flowRate: number;
  velocity: number;
  headLoss: number;
  isBroken: boolean;
  breakSeverity: number;
  hasReverseFlow: boolean;
  flowDirection: number;
  isDeadEnd: boolean;
}

export interface PumpData {
  id: string;
  pipeId: string;
  power: number;
  head: number;
  flowCapacity: number;
  isActive: boolean;
  efficiency: number;
  currentFlow: number;
  currentHead: number;
}

export interface ValveData {
  id: string;
  pipeId: string;
  openPercentage: number;
  isOperational: boolean;
  position: number;
  pressureDrop: number;
  flowCoefficient: number;
}

export interface NetworkData {
  nodes: NodeData[];
  pipes: PipeData[];
  pumps: PumpData[];
  valves: ValveData[];
}

@Injectable()
export class StorageService implements OnModuleInit {
  private dataPath: string;
  private data: NetworkData = {
    nodes: [],
    pipes: [],
    pumps: [],
    valves: [],
  };

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'network.json');
  }

  onModuleInit() {
    this.ensureDataDir();
    this.loadData();
  }

  private ensureDataDir() {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadData() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const content = fs.readFileSync(this.dataPath, 'utf-8');
        this.data = JSON.parse(content);
      }
    } catch (e) {
      console.error('加载数据失败:', e);
      this.data = { nodes: [], pipes: [], pumps: [], valves: [] };
    }
  }

  private saveData() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  }

  generateId(): string {
    return uuidv4();
  }

  getNodes(): NodeData[] {
    return [...this.data.nodes];
  }

  getNodeById(id: string): NodeData | undefined {
    return this.data.nodes.find((n) => n.id === id);
  }

  createNode(nodeData: Omit<NodeData, 'id'> & Partial<Pick<NodeData, 'id'>>): NodeData {
    const node: NodeData = {
      id: nodeData.id || this.generateId(),
      x: nodeData.x,
      y: nodeData.y,
      pressure: nodeData.pressure || 0,
      elevation: nodeData.elevation || 0,
      isSource: nodeData.isSource || false,
      isSink: nodeData.isSink || false,
      demand: nodeData.demand || 0,
      type: nodeData.type || 'normal',
      flowIn: nodeData.flowIn || 0,
      flowOut: nodeData.flowOut || 0,
      hasHighPressureWarning: nodeData.hasHighPressureWarning || false,
      pressureLimit: nodeData.pressureLimit || 80,
    };
    this.data.nodes.push(node);
    this.saveData();
    return node;
  }

  updateNode(id: string, nodeData: Partial<NodeData>): NodeData | null {
    const index = this.data.nodes.findIndex((n) => n.id === id);
    if (index === -1) return null;
    this.data.nodes[index] = { ...this.data.nodes[index], ...nodeData, id };
    this.saveData();
    return this.data.nodes[index];
  }

  deleteNode(id: string): boolean {
    const nodeIndex = this.data.nodes.findIndex((n) => n.id === id);
    if (nodeIndex === -1) return false;

    this.data.nodes.splice(nodeIndex, 1);
    this.data.pipes = this.data.pipes.filter((p) => p.startNodeId !== id && p.endNodeId !== id);
    
    const pipeIds = this.data.pipes.map((p) => p.id);
    this.data.pumps = this.data.pumps.filter((p) => pipeIds.includes(p.pipeId));
    this.data.valves = this.data.valves.filter((v) => pipeIds.includes(v.pipeId));

    this.saveData();
    return true;
  }

  getPipes(): PipeData[] {
    return [...this.data.pipes];
  }

  getPipeById(id: string): PipeData | undefined {
    return this.data.pipes.find((p) => p.id === id);
  }

  createPipe(pipeData: Omit<PipeData, 'id'> & Partial<Pick<PipeData, 'id'>>): PipeData {
    const pipe: PipeData = {
      id: pipeData.id || this.generateId(),
      startNodeId: pipeData.startNodeId,
      endNodeId: pipeData.endNodeId,
      diameter: pipeData.diameter || 150,
      roughness: pipeData.roughness || 0.01,
      length: pipeData.length || 0,
      flowRate: pipeData.flowRate || 0,
      velocity: pipeData.velocity || 0,
      headLoss: pipeData.headLoss || 0,
      isBroken: pipeData.isBroken || false,
      breakSeverity: pipeData.breakSeverity || 0,
      hasReverseFlow: pipeData.hasReverseFlow || false,
      flowDirection: pipeData.flowDirection || 1,
      isDeadEnd: pipeData.isDeadEnd || false,
    };
    this.data.pipes.push(pipe);
    this.saveData();
    return pipe;
  }

  updatePipe(id: string, pipeData: Partial<PipeData>): PipeData | null {
    const index = this.data.pipes.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.data.pipes[index] = { ...this.data.pipes[index], ...pipeData, id };
    this.saveData();
    return this.data.pipes[index];
  }

  deletePipe(id: string): boolean {
    const pipeIndex = this.data.pipes.findIndex((p) => p.id === id);
    if (pipeIndex === -1) return false;

    this.data.pipes.splice(pipeIndex, 1);
    this.data.pumps = this.data.pumps.filter((p) => p.pipeId !== id);
    this.data.valves = this.data.valves.filter((v) => v.pipeId !== id);

    this.saveData();
    return true;
  }

  getPumps(): PumpData[] {
    return [...this.data.pumps];
  }

  getPumpById(id: string): PumpData | undefined {
    return this.data.pumps.find((p) => p.id === id);
  }

  createPump(pumpData: Omit<PumpData, 'id'> & Partial<Pick<PumpData, 'id'>>): PumpData {
    const pump: PumpData = {
      id: pumpData.id || this.generateId(),
      pipeId: pumpData.pipeId,
      power: pumpData.power || 50,
      head: pumpData.head || 40,
      flowCapacity: pumpData.flowCapacity || 200,
      isActive: pumpData.isActive !== undefined ? pumpData.isActive : true,
      efficiency: pumpData.efficiency || 0,
      currentFlow: pumpData.currentFlow || 0,
      currentHead: pumpData.currentHead || 0,
    };
    this.data.pumps.push(pump);
    this.saveData();
    return pump;
  }

  updatePump(id: string, pumpData: Partial<PumpData>): PumpData | null {
    const index = this.data.pumps.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.data.pumps[index] = { ...this.data.pumps[index], ...pumpData, id };
    this.saveData();
    return this.data.pumps[index];
  }

  deletePump(id: string): boolean {
    const index = this.data.pumps.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.data.pumps.splice(index, 1);
    this.saveData();
    return true;
  }

  getValves(): ValveData[] {
    return [...this.data.valves];
  }

  getValveById(id: string): ValveData | undefined {
    return this.data.valves.find((v) => v.id === id);
  }

  createValve(valveData: Omit<ValveData, 'id'> & Partial<Pick<ValveData, 'id'>>): ValveData {
    const valve: ValveData = {
      id: valveData.id || this.generateId(),
      pipeId: valveData.pipeId,
      openPercentage: valveData.openPercentage !== undefined ? valveData.openPercentage : 1.0,
      isOperational: valveData.isOperational !== undefined ? valveData.isOperational : true,
      position: valveData.position || 0,
      pressureDrop: valveData.pressureDrop || 0,
      flowCoefficient: valveData.flowCoefficient || 0,
    };
    this.data.valves.push(valve);
    this.saveData();
    return valve;
  }

  updateValve(id: string, valveData: Partial<ValveData>): ValveData | null {
    const index = this.data.valves.findIndex((v) => v.id === id);
    if (index === -1) return null;
    this.data.valves[index] = { ...this.data.valves[index], ...valveData, id };
    this.saveData();
    return this.data.valves[index];
  }

  deleteValve(id: string): boolean {
    const index = this.data.valves.findIndex((v) => v.id === id);
    if (index === -1) return false;
    this.data.valves.splice(index, 1);
    this.saveData();
    return true;
  }

  clearAll(): void {
    this.data = {
      nodes: [],
      pipes: [],
      pumps: [],
      valves: [],
    };
    this.saveData();
  }

  getAllData(): NetworkData {
    return {
      nodes: [...this.data.nodes],
      pipes: [...this.data.pipes],
      pumps: [...this.data.pumps],
      valves: [...this.data.valves],
    };
  }
}
