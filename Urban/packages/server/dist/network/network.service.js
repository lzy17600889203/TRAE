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
exports.NetworkService = void 0;
const common_1 = require("@nestjs/common");
const storage_service_1 = require("../data/storage.service");
const hydraulic_calculator_service_1 = require("./hydraulic-calculator.service");
const presets_service_1 = require("./presets.service");
let NetworkService = class NetworkService {
    constructor(storage, calculator, presets) {
        this.storage = storage;
        this.calculator = calculator;
        this.presets = presets;
    }
    async getAllNodes() {
        return this.storage.getNodes();
    }
    async createNode(nodeData) {
        return this.storage.createNode(nodeData);
    }
    async updateNode(id, nodeData) {
        return this.storage.updateNode(id, nodeData);
    }
    async deleteNode(id) {
        this.storage.deleteNode(id);
    }
    async getAllPipes() {
        return this.storage.getPipes();
    }
    async createPipe(pipeData) {
        return this.storage.createPipe(pipeData);
    }
    async updatePipe(id, pipeData) {
        return this.storage.updatePipe(id, pipeData);
    }
    async deletePipe(id) {
        this.storage.deletePipe(id);
    }
    async getAllPumps() {
        return this.storage.getPumps();
    }
    async createPump(pumpData) {
        return this.storage.createPump(pumpData);
    }
    async updatePump(id, pumpData) {
        return this.storage.updatePump(id, pumpData);
    }
    async deletePump(id) {
        this.storage.deletePump(id);
    }
    async getAllValves() {
        return this.storage.getValves();
    }
    async createValve(valveData) {
        return this.storage.createValve(valveData);
    }
    async updateValve(id, valveData) {
        return this.storage.updateValve(id, valveData);
    }
    async deleteValve(id) {
        this.storage.deleteValve(id);
    }
    async calculateNetwork() {
        const nodes = await this.getAllNodes();
        const pipes = await this.getAllPipes();
        const pumps = await this.getAllPumps();
        const valves = await this.getAllValves();
        const result = this.calculator.calculate(nodes, pipes, pumps, valves);
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
    async clearAll() {
        this.storage.clearAll();
    }
    async loadPreset(presetKey) {
        const preset = this.presets.getPreset(presetKey);
        if (!preset)
            return null;
        await this.clearAll();
        for (const nodeData of preset.nodes) {
            await this.storage.createNode(nodeData);
        }
        for (const pipeData of preset.pipes) {
            await this.storage.createPipe(pipeData);
        }
        for (const pumpData of preset.pumps) {
            await this.storage.createPump(pumpData);
        }
        for (const valveData of preset.valves) {
            await this.storage.createValve(valveData);
        }
        return this.calculateNetwork();
    }
    getPresetList() {
        const all = this.presets.getAllPresets();
        const list = [];
        all.forEach((preset, key) => {
            list.push({ key, name: preset.name, description: preset.description });
        });
        return list;
    }
    async getFullNetwork() {
        return {
            nodes: await this.getAllNodes(),
            pipes: await this.getAllPipes(),
            pumps: await this.getAllPumps(),
            valves: await this.getAllValves(),
        };
    }
};
exports.NetworkService = NetworkService;
exports.NetworkService = NetworkService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [storage_service_1.StorageService,
        hydraulic_calculator_service_1.HydraulicCalculatorService,
        presets_service_1.PresetsService])
], NetworkService);
//# sourceMappingURL=network.service.js.map