import { NetworkService } from './network.service';
import { NodeData, PipeData, PumpData, ValveData } from '../data/storage.service';
export declare class NetworkController {
    private readonly networkService;
    constructor(networkService: NetworkService);
    getPresetList(): {
        key: string;
        name: string;
        description: string;
    }[];
    loadPreset(key: string): Promise<import("./hydraulic-calculator.service").NetworkState>;
    getNetwork(): Promise<{
        nodes: NodeData[];
        pipes: PipeData[];
        pumps: PumpData[];
        valves: ValveData[];
    }>;
    calculate(): Promise<import("./hydraulic-calculator.service").NetworkState>;
    clearNetwork(): Promise<{
        success: boolean;
    }>;
    getNodes(): Promise<NodeData[]>;
    createNode(nodeData: Partial<NodeData>): Promise<NodeData>;
    updateNode(id: string, nodeData: Partial<NodeData>): Promise<NodeData | null>;
    deleteNode(id: string): Promise<{
        success: boolean;
    }>;
    getPipes(): Promise<PipeData[]>;
    createPipe(pipeData: Partial<PipeData>): Promise<PipeData>;
    updatePipe(id: string, pipeData: Partial<PipeData>): Promise<PipeData | null>;
    deletePipe(id: string): Promise<{
        success: boolean;
    }>;
    getPumps(): Promise<PumpData[]>;
    createPump(pumpData: Partial<PumpData>): Promise<PumpData>;
    updatePump(id: string, pumpData: Partial<PumpData>): Promise<PumpData | null>;
    deletePump(id: string): Promise<{
        success: boolean;
    }>;
    getValves(): Promise<ValveData[]>;
    createValve(valveData: Partial<ValveData>): Promise<ValveData>;
    updateValve(id: string, valveData: Partial<ValveData>): Promise<ValveData | null>;
    deleteValve(id: string): Promise<{
        success: boolean;
    }>;
}
