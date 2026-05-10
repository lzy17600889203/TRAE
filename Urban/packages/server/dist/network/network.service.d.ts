import { StorageService, NodeData, PipeData, PumpData, ValveData } from '../data/storage.service';
import { HydraulicCalculatorService, NetworkState } from './hydraulic-calculator.service';
import { PresetsService } from './presets.service';
export declare class NetworkService {
    private storage;
    private calculator;
    private presets;
    constructor(storage: StorageService, calculator: HydraulicCalculatorService, presets: PresetsService);
    getAllNodes(): Promise<NodeData[]>;
    createNode(nodeData: Partial<NodeData>): Promise<NodeData>;
    updateNode(id: string, nodeData: Partial<NodeData>): Promise<NodeData | null>;
    deleteNode(id: string): Promise<void>;
    getAllPipes(): Promise<PipeData[]>;
    createPipe(pipeData: Partial<PipeData>): Promise<PipeData>;
    updatePipe(id: string, pipeData: Partial<PipeData>): Promise<PipeData | null>;
    deletePipe(id: string): Promise<void>;
    getAllPumps(): Promise<PumpData[]>;
    createPump(pumpData: Partial<PumpData>): Promise<PumpData>;
    updatePump(id: string, pumpData: Partial<PumpData>): Promise<PumpData | null>;
    deletePump(id: string): Promise<void>;
    getAllValves(): Promise<ValveData[]>;
    createValve(valveData: Partial<ValveData>): Promise<ValveData>;
    updateValve(id: string, valveData: Partial<ValveData>): Promise<ValveData | null>;
    deleteValve(id: string): Promise<void>;
    calculateNetwork(): Promise<NetworkState>;
    clearAll(): Promise<void>;
    loadPreset(presetKey: string): Promise<NetworkState | null>;
    getPresetList(): {
        key: string;
        name: string;
        description: string;
    }[];
    getFullNetwork(): Promise<{
        nodes: NodeData[];
        pipes: PipeData[];
        pumps: PumpData[];
        valves: ValveData[];
    }>;
}
