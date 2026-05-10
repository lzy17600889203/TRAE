import { NodeData, PipeData, PumpData, ValveData } from '../data/storage.service';
export interface NetworkState {
    nodes: NodeData[];
    pipes: PipeData[];
    pumps: PumpData[];
    valves: ValveData[];
    warnings: SimulationWarning[];
    anomalies: AnomalyReport[];
}
export interface SimulationWarning {
    type: 'high_pressure' | 'low_pressure' | 'reverse_flow' | 'dead_end' | 'leakage';
    nodeId?: string;
    pipeId?: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface AnomalyReport {
    type: 'pressure_oscillation' | 'flow_reversal' | 'dead_end_stagnation' | 'mass_imbalance';
    affectedNodes: string[];
    affectedPipes: string[];
    description: string;
    magnitude: number;
}
export declare class HydraulicCalculatorService {
    private readonly GRAVITY;
    private readonly WATER_DENSITY;
    private readonly MAX_ITERATIONS;
    private readonly CONVERGENCE_TOLERANCE;
    private readonly HIGH_PRESSURE_THRESHOLD;
    private readonly MAX_ITERATIONS_FOR_ANOMALY;
    calculate(nodes: NodeData[], pipes: PipeData[], pumps: PumpData[], valves: ValveData[]): NetworkState;
    private calculatePipeLengths;
    private initialGuess;
    private calculateFlows;
    private calculatePipeResistance;
    private calculateBrokenPipeFlow;
    private calculatePressures;
    private calculateVelocities;
    private detectReverseFlow;
    private detectDeadEnds;
    private checkPressureLimits;
    private checkMassConservation;
    private detectPressureOscillationWithHistory;
    private detectPressureOscillation;
    private updateFlowDirection;
}
