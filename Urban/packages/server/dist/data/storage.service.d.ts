import { OnModuleInit } from '@nestjs/common';
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
export declare class StorageService implements OnModuleInit {
    private dataPath;
    private data;
    constructor();
    onModuleInit(): void;
    private ensureDataDir;
    private loadData;
    private saveData;
    generateId(): string;
    getNodes(): NodeData[];
    getNodeById(id: string): NodeData | undefined;
    createNode(nodeData: Omit<NodeData, 'id'> & Partial<Pick<NodeData, 'id'>>): NodeData;
    updateNode(id: string, nodeData: Partial<NodeData>): NodeData | null;
    deleteNode(id: string): boolean;
    getPipes(): PipeData[];
    getPipeById(id: string): PipeData | undefined;
    createPipe(pipeData: Omit<PipeData, 'id'> & Partial<Pick<PipeData, 'id'>>): PipeData;
    updatePipe(id: string, pipeData: Partial<PipeData>): PipeData | null;
    deletePipe(id: string): boolean;
    getPumps(): PumpData[];
    getPumpById(id: string): PumpData | undefined;
    createPump(pumpData: Omit<PumpData, 'id'> & Partial<Pick<PumpData, 'id'>>): PumpData;
    updatePump(id: string, pumpData: Partial<PumpData>): PumpData | null;
    deletePump(id: string): boolean;
    getValves(): ValveData[];
    getValveById(id: string): ValveData | undefined;
    createValve(valveData: Omit<ValveData, 'id'> & Partial<Pick<ValveData, 'id'>>): ValveData;
    updateValve(id: string, valveData: Partial<ValveData>): ValveData | null;
    deleteValve(id: string): boolean;
    clearAll(): void;
    getAllData(): NetworkData;
}
