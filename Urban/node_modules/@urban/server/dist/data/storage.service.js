"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const uuid_1 = require("uuid");
let StorageService = class StorageService {
    constructor() {
        this.data = {
            nodes: [],
            pipes: [],
            pumps: [],
            valves: [],
        };
        this.dataPath = path.join(process.cwd(), 'data', 'network.json');
    }
    onModuleInit() {
        this.ensureDataDir();
        this.loadData();
    }
    ensureDataDir() {
        const dir = path.dirname(this.dataPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    loadData() {
        try {
            if (fs.existsSync(this.dataPath)) {
                const content = fs.readFileSync(this.dataPath, 'utf-8');
                this.data = JSON.parse(content);
            }
        }
        catch (e) {
            console.error('加载数据失败:', e);
            this.data = { nodes: [], pipes: [], pumps: [], valves: [] };
        }
    }
    saveData() {
        try {
            this.ensureDataDir();
            fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2), 'utf-8');
        }
        catch (e) {
            console.error('保存数据失败:', e);
        }
    }
    generateId() {
        return (0, uuid_1.v4)();
    }
    getNodes() {
        return [...this.data.nodes];
    }
    getNodeById(id) {
        return this.data.nodes.find((n) => n.id === id);
    }
    createNode(nodeData) {
        const node = {
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
    updateNode(id, nodeData) {
        const index = this.data.nodes.findIndex((n) => n.id === id);
        if (index === -1)
            return null;
        this.data.nodes[index] = { ...this.data.nodes[index], ...nodeData, id };
        this.saveData();
        return this.data.nodes[index];
    }
    deleteNode(id) {
        const nodeIndex = this.data.nodes.findIndex((n) => n.id === id);
        if (nodeIndex === -1)
            return false;
        this.data.nodes.splice(nodeIndex, 1);
        this.data.pipes = this.data.pipes.filter((p) => p.startNodeId !== id && p.endNodeId !== id);
        const pipeIds = this.data.pipes.map((p) => p.id);
        this.data.pumps = this.data.pumps.filter((p) => pipeIds.includes(p.pipeId));
        this.data.valves = this.data.valves.filter((v) => pipeIds.includes(v.pipeId));
        this.saveData();
        return true;
    }
    getPipes() {
        return [...this.data.pipes];
    }
    getPipeById(id) {
        return this.data.pipes.find((p) => p.id === id);
    }
    createPipe(pipeData) {
        const pipe = {
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
    updatePipe(id, pipeData) {
        const index = this.data.pipes.findIndex((p) => p.id === id);
        if (index === -1)
            return null;
        this.data.pipes[index] = { ...this.data.pipes[index], ...pipeData, id };
        this.saveData();
        return this.data.pipes[index];
    }
    deletePipe(id) {
        const pipeIndex = this.data.pipes.findIndex((p) => p.id === id);
        if (pipeIndex === -1)
            return false;
        this.data.pipes.splice(pipeIndex, 1);
        this.data.pumps = this.data.pumps.filter((p) => p.pipeId !== id);
        this.data.valves = this.data.valves.filter((v) => v.pipeId !== id);
        this.saveData();
        return true;
    }
    getPumps() {
        return [...this.data.pumps];
    }
    getPumpById(id) {
        return this.data.pumps.find((p) => p.id === id);
    }
    createPump(pumpData) {
        const pump = {
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
    updatePump(id, pumpData) {
        const index = this.data.pumps.findIndex((p) => p.id === id);
        if (index === -1)
            return null;
        this.data.pumps[index] = { ...this.data.pumps[index], ...pumpData, id };
        this.saveData();
        return this.data.pumps[index];
    }
    deletePump(id) {
        const index = this.data.pumps.findIndex((p) => p.id === id);
        if (index === -1)
            return false;
        this.data.pumps.splice(index, 1);
        this.saveData();
        return true;
    }
    getValves() {
        return [...this.data.valves];
    }
    getValveById(id) {
        return this.data.valves.find((v) => v.id === id);
    }
    createValve(valveData) {
        const valve = {
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
    updateValve(id, valveData) {
        const index = this.data.valves.findIndex((v) => v.id === id);
        if (index === -1)
            return null;
        this.data.valves[index] = { ...this.data.valves[index], ...valveData, id };
        this.saveData();
        return this.data.valves[index];
    }
    deleteValve(id) {
        const index = this.data.valves.findIndex((v) => v.id === id);
        if (index === -1)
            return false;
        this.data.valves.splice(index, 1);
        this.saveData();
        return true;
    }
    clearAll() {
        this.data = {
            nodes: [],
            pipes: [],
            pumps: [],
            valves: [],
        };
        this.saveData();
    }
    getAllData() {
        return {
            nodes: [...this.data.nodes],
            pipes: [...this.data.pipes],
            pumps: [...this.data.pumps],
            valves: [...this.data.valves],
        };
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StorageService);
//# sourceMappingURL=storage.service.js.map