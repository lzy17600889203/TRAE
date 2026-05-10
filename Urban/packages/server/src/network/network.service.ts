import { Injectable } from '@nestjs/common';
import { StorageService, NodeData, PipeData, PumpData, ValveData } from '../data/storage.service';
import { HydraulicCalculatorService, NetworkState } from './hydraulic-calculator.service';
import { PresetsService } from './presets.service';

@Injectable()
export class NetworkService {
  constructor(
    private storage: StorageService,
    private calculator: HydraulicCalculatorService,
    private presets: PresetsService,
  ) {}

  async getAllNodes(): Promise<NodeData[]> {
    return this.storage.getNodes();
  }

  async createNode(nodeData: Partial<NodeData>): Promise<NodeData> {
    return this.storage.createNode(nodeData as any);
  }

  async updateNode(id: string, nodeData: Partial<NodeData>): Promise<NodeData | null> {
    return this.storage.updateNode(id, nodeData);
  }

  async deleteNode(id: string): Promise<void> {
    this.storage.deleteNode(id);
  }

  async getAllPipes(): Promise<PipeData[]> {
    return this.storage.getPipes();
  }

  async createPipe(pipeData: Partial<PipeData>): Promise<PipeData> {
    return this.storage.createPipe(pipeData as any);
  }

  async updatePipe(id: string, pipeData: Partial<PipeData>): Promise<PipeData | null> {
    return this.storage.updatePipe(id, pipeData);
  }

  async deletePipe(id: string): Promise<void> {
    this.storage.deletePipe(id);
  }

  async getAllPumps(): Promise<PumpData[]> {
    return this.storage.getPumps();
  }

  async createPump(pumpData: Partial<PumpData>): Promise<PumpData> {
    return this.storage.createPump(pumpData as any);
  }

  async updatePump(id: string, pumpData: Partial<PumpData>): Promise<PumpData | null> {
    return this.storage.updatePump(id, pumpData);
  }

  async deletePump(id: string): Promise<void> {
    this.storage.deletePump(id);
  }

  async getAllValves(): Promise<ValveData[]> {
    return this.storage.getValves();
  }

  async createValve(valveData: Partial<ValveData>): Promise<ValveData> {
    return this.storage.createValve(valveData as any);
  }

  async updateValve(id: string, valveData: Partial<ValveData>): Promise<ValveData | null> {
    return this.storage.updateValve(id, valveData);
  }

  async deleteValve(id: string): Promise<void> {
    this.storage.deleteValve(id);
  }

  async calculateNetwork(): Promise<NetworkState> {
    const nodes = await this.getAllNodes();
    const pipes = await this.getAllPipes();
    const pumps = await this.getAllPumps();
    const valves = await this.getAllValves();

    const result = this.calculator.calculate(
      nodes as any,
      pipes as any,
      pumps as any,
      valves as any,
    );

    for (const node of result.nodes) {
      await this.storage.updateNode(node.id, {
        pressure: node.pressure,
        flowIn: node.flowIn,
        flowOut: node.flowOut,
        hasHighPressureWarning: node.hasHighPressureWarning,
      });
    }

    for (const pipe of result.pipes) {
      await this.storage.updatePipe(pipe.id, {
        flowRate: pipe.flowRate,
        velocity: pipe.velocity,
        headLoss: pipe.headLoss,
        hasReverseFlow: pipe.hasReverseFlow,
        flowDirection: pipe.flowDirection,
        isDeadEnd: pipe.isDeadEnd,
      });
    }

    for (const pump of result.pumps) {
      await this.storage.updatePump(pump.id, {
        currentFlow: pump.currentFlow,
        currentHead: pump.currentHead,
      });
    }

    return result;
  }

  async clearAll(): Promise<void> {
    this.storage.clearAll();
  }

  async loadPreset(presetKey: string): Promise<NetworkState | null> {
    const preset = this.presets.getPreset(presetKey);
    if (!preset) return null;

    await this.clearAll();

    for (const nodeData of preset.nodes) {
      await this.storage.createNode(nodeData as any);
    }

    for (const pipeData of preset.pipes) {
      await this.storage.createPipe(pipeData as any);
    }

    for (const pumpData of preset.pumps) {
      await this.storage.createPump(pumpData as any);
    }

    for (const valveData of preset.valves) {
      await this.storage.createValve(valveData as any);
    }

    return this.calculateNetwork();
  }

  getPresetList(): { key: string; name: string; description: string }[] {
    const all = this.presets.getAllPresets();
    const list: { key: string; name: string; description: string }[] = [];
    all.forEach((preset, key) => {
      list.push({ key, name: preset.name, description: preset.description });
    });
    return list;
  }

  async getFullNetwork(): Promise<{
    nodes: NodeData[];
    pipes: PipeData[];
    pumps: PumpData[];
    valves: ValveData[];
  }> {
    return {
      nodes: await this.getAllNodes(),
      pipes: await this.getAllPipes(),
      pumps: await this.getAllPumps(),
      valves: await this.getAllValves(),
    };
  }
}
