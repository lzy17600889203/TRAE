"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HydraulicCalculatorService = void 0;
const common_1 = require("@nestjs/common");
let HydraulicCalculatorService = class HydraulicCalculatorService {
    constructor() {
        this.GRAVITY = 9.81;
        this.WATER_DENSITY = 1000;
        this.MAX_ITERATIONS = 100;
        this.CONVERGENCE_TOLERANCE = 0.0001;
        this.HIGH_PRESSURE_THRESHOLD = 60;
        this.MAX_ITERATIONS_FOR_ANOMALY = 500;
    }
    calculate(nodes, pipes, pumps, valves) {
        const nodeMap = new Map();
        const pipeMap = new Map();
        const pumpMap = new Map();
        const valveMap = new Map();
        nodes.forEach((n) => nodeMap.set(n.id, JSON.parse(JSON.stringify(n))));
        pipes.forEach((p) => pipeMap.set(p.id, JSON.parse(JSON.stringify(p))));
        pumps.forEach((p) => pumpMap.set(p.id, JSON.parse(JSON.stringify(p))));
        valves.forEach((v) => valveMap.set(v.id, JSON.parse(JSON.stringify(v))));
        const warnings = [];
        const anomalies = [];
        this.calculatePipeLengths(pipeMap, nodeMap);
        this.initialGuess(nodeMap, pipeMap, pumpMap, valveMap);
        let converged = false;
        let iteration = 0;
        let previousPressures = new Map();
        let pressureOscillationDetected = false;
        let pressureHistory = new Map();
        let maxOscillationMagnitude = 0;
        nodeMap.forEach((_, id) => {
            pressureHistory.set(id, []);
        });
        while (!converged && iteration < this.MAX_ITERATIONS_FOR_ANOMALY) {
            this.calculateFlows(nodeMap, pipeMap, pumpMap, valveMap);
            const maxChange = this.calculatePressures(nodeMap, pipeMap, pumpMap, valveMap);
            nodeMap.forEach((node, id) => {
                const history = pressureHistory.get(id) || [];
                history.push(node.pressure);
                if (history.length > 20) {
                    history.shift();
                }
                pressureHistory.set(id, history);
            });
            if (iteration > 30 && !pressureOscillationDetected) {
                const oscResult = this.detectPressureOscillationWithHistory(nodeMap, pressureHistory, previousPressures);
                if (oscResult.detected) {
                    pressureOscillationDetected = true;
                    maxOscillationMagnitude = oscResult.magnitude;
                }
            }
            previousPressures = new Map();
            nodeMap.forEach((node, id) => previousPressures.set(id, node.pressure));
            converged = maxChange < this.CONVERGENCE_TOLERANCE;
            iteration++;
            if (iteration > 200 && !converged) {
                anomalies.push({
                    type: 'pressure_oscillation',
                    affectedNodes: Array.from(nodeMap.keys()),
                    affectedPipes: [],
                    description: '节点压力出现无限叠加或持续震荡，系统无法收敛，压力持续攀升！',
                    magnitude: Math.max(maxChange, maxOscillationMagnitude),
                });
                break;
            }
        }
        if (!converged && !anomalies.some(a => a.type === 'pressure_oscillation')) {
            anomalies.push({
                type: 'pressure_oscillation',
                affectedNodes: Array.from(nodeMap.keys()),
                affectedPipes: [],
                description: '计算迭代次数耗尽，压力系统未能达到平衡状态',
                magnitude: maxOscillationMagnitude,
            });
        }
        this.calculateVelocities(pipeMap);
        this.detectReverseFlow(pipeMap, warnings, anomalies);
        this.detectDeadEnds(nodeMap, pipeMap, warnings, anomalies);
        this.checkPressureLimits(nodeMap, warnings);
        this.checkMassConservation(nodeMap, pipeMap, anomalies);
        this.updateFlowDirection(pipeMap);
        return {
            nodes: Array.from(nodeMap.values()),
            pipes: Array.from(pipeMap.values()),
            pumps: Array.from(pumpMap.values()),
            valves: Array.from(valveMap.values()),
            warnings,
            anomalies,
        };
    }
    calculatePipeLengths(pipeMap, nodeMap) {
        pipeMap.forEach((pipe) => {
            const start = nodeMap.get(pipe.startNodeId);
            const end = nodeMap.get(pipe.endNodeId);
            if (start && end) {
                pipe.length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
            }
        });
    }
    initialGuess(nodeMap, pipeMap, pumpMap, valveMap) {
        nodeMap.forEach((node) => {
            if (node.isSource) {
                node.pressure = node.pressureLimit > 0 ? node.pressureLimit * 0.7 : 60;
            }
            else {
                node.pressure = 20;
            }
        });
        pipeMap.forEach((pipe) => {
            pipe.flowRate = 5;
        });
    }
    calculateFlows(nodeMap, pipeMap, pumpMap, valveMap) {
        pipeMap.forEach((pipe) => {
            const startNode = nodeMap.get(pipe.startNodeId);
            const endNode = nodeMap.get(pipe.endNodeId);
            if (!startNode || !endNode)
                return;
            if (pipe.isBroken) {
                const effectiveFlow = this.calculateBrokenPipeFlow(pipe, startNode, endNode);
                pipe.flowRate = effectiveFlow;
                return;
            }
            const headStart = startNode.pressure + startNode.elevation;
            const headEnd = endNode.pressure + endNode.elevation;
            let headDiff = headStart - headEnd;
            const pumpsOnPipe = Array.from(pumpMap.values()).filter((p) => p.pipeId === pipe.id && p.isActive);
            pumpsOnPipe.forEach((pump) => {
                headDiff += pump.head;
                pump.currentFlow = pipe.flowRate;
                pump.currentHead = pump.head;
            });
            const valvesOnPipe = Array.from(valveMap.values()).filter((v) => v.pipeId === pipe.id);
            let valveResistance = 1;
            valvesOnPipe.forEach((valve) => {
                if (valve.openPercentage <= 0) {
                    valveResistance = Infinity;
                }
                else {
                    valveResistance = 1 / Math.pow(valve.openPercentage, 2);
                }
            });
            const resistance = this.calculatePipeResistance(pipe) * valveResistance;
            if (resistance === Infinity) {
                pipe.flowRate = 0;
            }
            else {
                pipe.flowRate = Math.sign(headDiff) * Math.sqrt(Math.abs(headDiff) / Math.max(resistance, 0.0001));
            }
        });
    }
    calculatePipeResistance(pipe) {
        if (pipe.diameter <= 0)
            return Infinity;
        const diameterM = pipe.diameter / 1000;
        const area = Math.PI * Math.pow(diameterM / 2, 2);
        const k = pipe.roughness;
        const resistance = (8 * this.GRAVITY * pipe.length * k) /
            (Math.pow(Math.PI, 2) * Math.pow(diameterM, 5) * area);
        return Math.max(resistance, 0.001);
    }
    calculateBrokenPipeFlow(pipe, start, end) {
        const pressureDiff = start.pressure - end.pressure;
        const baseFlow = Math.sqrt(Math.abs(pressureDiff) / this.calculatePipeResistance(pipe));
        const direction = pressureDiff >= 0 ? 1 : -1;
        return direction * baseFlow;
    }
    calculatePressures(nodeMap, pipeMap, pumpMap, valveMap) {
        let maxChange = 0;
        nodeMap.forEach((node, nodeId) => {
            if (node.isSource)
                return;
            let inflow = 0;
            let outflow = 0;
            let weightedPressure = 0;
            let weightSum = 0;
            pipeMap.forEach((pipe) => {
                if (pipe.startNodeId === nodeId) {
                    const flow = pipe.flowRate;
                    if (flow > 0) {
                        outflow += flow;
                    }
                    else {
                        inflow += Math.abs(flow);
                    }
                    const connectedNode = nodeMap.get(pipe.endNodeId);
                    if (connectedNode) {
                        const resistance = this.calculatePipeResistance(pipe);
                        const weight = 1 / Math.max(resistance, 0.01);
                        weightedPressure += connectedNode.pressure * weight;
                        weightSum += weight;
                    }
                }
                if (pipe.endNodeId === nodeId) {
                    const flow = pipe.flowRate;
                    if (flow > 0) {
                        inflow += flow;
                    }
                    else {
                        outflow += Math.abs(flow);
                    }
                    const connectedNode = nodeMap.get(pipe.startNodeId);
                    if (connectedNode) {
                        const resistance = this.calculatePipeResistance(pipe);
                        const weight = 1 / Math.max(resistance, 0.01);
                        weightedPressure += connectedNode.pressure * weight;
                        weightSum += weight;
                    }
                }
            });
            node.flowIn = inflow;
            node.flowOut = outflow;
            if (weightSum > 0) {
                const avgNeighborPressure = weightedPressure / weightSum;
                const netFlow = inflow - outflow - node.demand;
                let newPressure = avgNeighborPressure + netFlow * 0.8;
                if (node.isSink) {
                    newPressure = Math.max(0, newPressure - 5);
                }
                const change = Math.abs(newPressure - node.pressure);
                maxChange = Math.max(maxChange, change);
                node.pressure = node.pressure * 0.6 + newPressure * 0.4;
            }
        });
        return maxChange;
    }
    calculateVelocities(pipeMap) {
        pipeMap.forEach((pipe) => {
            if (pipe.diameter > 0) {
                const area = Math.PI * Math.pow(pipe.diameter / 2000, 2);
                pipe.velocity = Math.abs(pipe.flowRate) / Math.max(area, 0.0001);
                pipe.headLoss = this.calculatePipeResistance(pipe) * pipe.flowRate * pipe.flowRate;
            }
        });
    }
    detectReverseFlow(pipeMap, warnings, anomalies) {
        const reverseFlowPipes = [];
        pipeMap.forEach((pipe) => {
            pipe.hasReverseFlow = pipe.flowRate < -0.5;
            if (pipe.hasReverseFlow) {
                reverseFlowPipes.push(pipe.id);
                warnings.push({
                    type: 'reverse_flow',
                    pipeId: pipe.id,
                    message: `管道出现严重倒流！流量: ${Math.abs(pipe.flowRate).toFixed(2)} L/s，方向箭头为橙色`,
                    severity: pipe.flowRate < -20 ? 'critical' : pipe.flowRate < -10 ? 'high' : 'medium',
                });
            }
        });
        if (reverseFlowPipes.length > 0) {
            anomalies.push({
                type: 'flow_reversal',
                affectedNodes: [],
                affectedPipes: reverseFlowPipes,
                description: `检测到 ${reverseFlowPipes.length} 条管道出现水流倒灌现象，方向已反转！`,
                magnitude: reverseFlowPipes.length,
            });
        }
    }
    detectDeadEnds(nodeMap, pipeMap, warnings, anomalies) {
        const deadEndNodes = [];
        const deadEndPipes = [];
        nodeMap.forEach((node, nodeId) => {
            if (node.isSource || node.isSink)
                return;
            const connectedPipes = Array.from(pipeMap.values()).filter((p) => p.startNodeId === nodeId || p.endNodeId === nodeId);
            if (connectedPipes.length === 1) {
                const pipe = connectedPipes[0];
                pipe.isDeadEnd = true;
                deadEndNodes.push(nodeId);
                deadEndPipes.push(pipe.id);
                warnings.push({
                    type: 'dead_end',
                    nodeId: nodeId,
                    pipeId: pipe.id,
                    message: `检测到死胡同节点，水流完全停滞（灰色管道），流量: ${Math.abs(pipe.flowRate).toFixed(2)} L/s`,
                    severity: Math.abs(pipe.flowRate) < 0.1 ? 'medium' : 'low',
                });
            }
        });
        if (deadEndNodes.length > 0) {
            anomalies.push({
                type: 'dead_end_stagnation',
                affectedNodes: deadEndNodes,
                affectedPipes: deadEndPipes,
                description: `系统中存在 ${deadEndNodes.length} 个死胡同节点，水流在此处完全停滞，无法流通！`,
                magnitude: deadEndNodes.length,
            });
        }
    }
    checkPressureLimits(nodeMap, warnings) {
        nodeMap.forEach((node) => {
            const threshold = node.pressureLimit > 0 ? node.pressureLimit : this.HIGH_PRESSURE_THRESHOLD;
            node.hasHighPressureWarning = node.pressure > threshold * 0.8;
            if (node.pressure > threshold) {
                warnings.push({
                    type: 'high_pressure',
                    nodeId: node.id,
                    message: `节点压力严重超标！实际: ${node.pressure.toFixed(2)} mH2O，限制: ${threshold} mH2O，触发红光警告！`,
                    severity: node.pressure > threshold * 1.5 ? 'critical' : node.pressure > threshold * 1.2 ? 'high' : 'medium',
                });
            }
            if (node.pressure < 0 && !node.isSink) {
                warnings.push({
                    type: 'low_pressure',
                    nodeId: node.id,
                    message: `节点出现负压状态: ${node.pressure.toFixed(2)} mH2O`,
                    severity: 'high',
                });
            }
        });
    }
    checkMassConservation(nodeMap, pipeMap, anomalies) {
        let totalSourceOutflow = 0;
        let totalSinkInflow = 0;
        let totalLeakage = 0;
        nodeMap.forEach((node) => {
            if (node.isSource) {
                totalSourceOutflow += Math.max(0, node.flowOut - node.flowIn);
            }
            if (node.isSink) {
                totalSinkInflow += Math.max(0, node.flowIn - node.flowOut);
            }
        });
        pipeMap.forEach((pipe) => {
            if (pipe.isBroken) {
                totalLeakage += pipe.breakSeverity * Math.abs(pipe.flowRate) * 2;
            }
        });
        const totalDemand = Array.from(nodeMap.values())
            .filter(n => n.isSink)
            .reduce((sum, n) => sum + n.demand, 0);
        const imbalance = totalSourceOutflow - totalSinkInflow - totalLeakage - totalDemand;
        if (Math.abs(imbalance) > 0.1) {
            anomalies.push({
                type: 'mass_imbalance',
                affectedNodes: [],
                affectedPipes: Array.from(pipeMap.keys()),
                description: `流量数据不守恒！源头流出: ${totalSourceOutflow.toFixed(2)} L/s，用户消费: ${totalDemand.toFixed(2)} L/s，泄漏损失: ${totalLeakage.toFixed(2)} L/s，不平衡量: ${imbalance.toFixed(2)} L/s`,
                magnitude: Math.abs(imbalance),
            });
        }
    }
    detectPressureOscillationWithHistory(nodeMap, pressureHistory, previousPressures) {
        let oscillatingNodes = 0;
        let totalMagnitude = 0;
        nodeMap.forEach((node, id) => {
            const history = pressureHistory.get(id) || [];
            if (history.length < 10)
                return;
            const firstHalf = history.slice(0, Math.floor(history.length / 2));
            const secondHalf = history.slice(Math.floor(history.length / 2));
            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
            const trend = secondAvg - firstAvg;
            const max = Math.max(...history);
            const min = Math.min(...history);
            const range = max - min;
            const avg = history.reduce((a, b) => a + b, 0) / history.length;
            const variance = history.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / history.length;
            const threshold = node.pressureLimit > 0 ? node.pressureLimit : 80;
            if (node.pressure > threshold * 1.2 || (trend > 1 && range > 10) || (variance > 25 && !node.isSource)) {
                oscillatingNodes++;
                totalMagnitude += Math.max(range, Math.abs(trend), node.pressure - threshold);
            }
        });
        return {
            detected: oscillatingNodes > 1,
            magnitude: totalMagnitude / Math.max(oscillatingNodes, 1),
        };
    }
    detectPressureOscillation(nodeMap, previousPressures) {
        if (previousPressures.size === 0)
            return false;
        let oscillatingCount = 0;
        nodeMap.forEach((node, id) => {
            const prev = previousPressures.get(id);
            if (prev !== undefined && node.pressureLimit > 0) {
                if (node.pressure > node.pressureLimit * 1.3) {
                    oscillatingCount++;
                }
            }
        });
        return oscillatingCount > 2;
    }
    updateFlowDirection(pipeMap) {
        pipeMap.forEach((pipe) => {
            pipe.flowDirection = pipe.flowRate >= 0 ? 1 : -1;
        });
    }
};
exports.HydraulicCalculatorService = HydraulicCalculatorService;
exports.HydraulicCalculatorService = HydraulicCalculatorService = __decorate([
    (0, common_1.Injectable)()
], HydraulicCalculatorService);
//# sourceMappingURL=hydraulic-calculator.service.js.map