import { NodeData, PipeData, PumpData, ValveData } from '../data/storage.service';
export interface PresetData {
    name: string;
    description: string;
    nodes: Partial<NodeData>[];
    pipes: Partial<PipeData>[];
    pumps: Partial<PumpData>[];
    valves: Partial<ValveData>[];
}
export declare class PresetsService {
    private presets;
    constructor();
    private initializePresets;
    private createBalancedWaterSupply;
    private createLocalBurst;
    private createPumpFailure;
    private createHighPressureBackflow;
    getPresetNames(): string[];
    getPreset(key: string): PresetData | undefined;
    getAllPresets(): Map<string, PresetData>;
}
