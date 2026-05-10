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
exports.PresetsService = void 0;
const common_1 = require("@nestjs/common");
let PresetsService = class PresetsService {
    constructor() {
        this.presets = new Map();
        this.initializePresets();
    }
    initializePresets() {
        this.presets.set('balanced', this.createBalancedWaterSupply());
        this.presets.set('burst', this.createLocalBurst());
        this.presets.set('pump-failure', this.createPumpFailure());
        this.presets.set('backflow', this.createHighPressureBackflow());
    }
    createBalancedWaterSupply() {
        const n1 = { id: 'n1', x: 100, y: 300, isSource: true, pressureLimit: 80 };
        const n2 = { id: 'n2', x: 300, y: 300, pressureLimit: 80 };
        const n3 = { id: 'n3', x: 500, y: 200, pressureLimit: 80 };
        const n4 = { id: 'n4', x: 500, y: 400, pressureLimit: 80 };
        const n5 = { id: 'n5', x: 700, y: 300, isSink: true, demand: 50, pressureLimit: 80 };
        const n6 = { id: 'n6', x: 300, y: 500, pressureLimit: 80 };
        const n7 = { id: 'n7', x: 500, y: 500, isSink: true, demand: 30, pressureLimit: 80 };
        const n8 = { id: 'n8', x: 150, y: 150, pressureLimit: 80 };
        const p1 = { id: 'p1', startNodeId: 'n1', endNodeId: 'n2', diameter: 200, roughness: 0.01 };
        const p2 = { id: 'p2', startNodeId: 'n2', endNodeId: 'n3', diameter: 150, roughness: 0.01 };
        const p3 = { id: 'p3', startNodeId: 'n2', endNodeId: 'n4', diameter: 150, roughness: 0.01 };
        const p4 = { id: 'p4', startNodeId: 'n3', endNodeId: 'n5', diameter: 150, roughness: 0.01 };
        const p5 = { id: 'p5', startNodeId: 'n4', endNodeId: 'n5', diameter: 150, roughness: 0.01 };
        const p6 = { id: 'p6', startNodeId: 'n2', endNodeId: 'n6', diameter: 150, roughness: 0.01 };
        const p7 = { id: 'p7', startNodeId: 'n6', endNodeId: 'n7', diameter: 150, roughness: 0.01 };
        const p8 = { id: 'p8', startNodeId: 'n2', endNodeId: 'n8', diameter: 100, roughness: 0.05 };
        const pump1 = { id: 'pu1', pipeId: 'p1', power: 80, head: 40, flowCapacity: 200, isActive: true };
        const v1 = { id: 'v1', pipeId: 'p4', openPercentage: 0.8 };
        const v2 = { id: 'v2', pipeId: 'p5', openPercentage: 0.6 };
        const v3 = { id: 'v3', pipeId: 'p7', openPercentage: 1.0 };
        return {
            name: '平衡供水预设',
            description: '一个设计合理、供水平衡的城市管网系统，展示正常运行状态（含死胡同观察点）',
            nodes: [n1, n2, n3, n4, n5, n6, n7, n8],
            pipes: [p1, p2, p3, p4, p5, p6, p7, p8],
            pumps: [pump1],
            valves: [v1, v2, v3],
        };
    }
    createLocalBurst() {
        const n1 = { id: 'n1', x: 100, y: 300, isSource: true, pressureLimit: 80 };
        const n2 = { id: 'n2', x: 300, y: 300, pressureLimit: 80 };
        const n3 = { id: 'n3', x: 500, y: 300, pressureLimit: 80 };
        const n4 = { id: 'n4', x: 700, y: 300, isSink: true, demand: 80, pressureLimit: 80 };
        const n5 = { id: 'n5', x: 400, y: 500, pressureLimit: 80 };
        const n6 = { id: 'n6', x: 600, y: 500, isSink: true, demand: 40, pressureLimit: 80 };
        const n7 = { id: 'n7', x: 200, y: 150, pressureLimit: 80 };
        const n8 = { id: 'n8', x: 350, y: 100, pressureLimit: 80 };
        const p1 = { id: 'p1', startNodeId: 'n1', endNodeId: 'n2', diameter: 200, roughness: 0.01 };
        const p2 = { id: 'p2', startNodeId: 'n2', endNodeId: 'n3', diameter: 200, roughness: 0.01, isBroken: true, breakSeverity: 0.9 };
        const p3 = { id: 'p3', startNodeId: 'n3', endNodeId: 'n4', diameter: 200, roughness: 0.01 };
        const p4 = { id: 'p4', startNodeId: 'n3', endNodeId: 'n5', diameter: 150, roughness: 0.01 };
        const p5 = { id: 'p5', startNodeId: 'n5', endNodeId: 'n6', diameter: 150, roughness: 0.01 };
        const p6 = { id: 'p6', startNodeId: 'n2', endNodeId: 'n7', diameter: 120, roughness: 0.02 };
        const p7 = { id: 'p7', startNodeId: 'n7', endNodeId: 'n8', diameter: 100, roughness: 0.1 };
        const pump1 = { id: 'pu1', pipeId: 'p1', power: 120, head: 60, flowCapacity: 400, isActive: true };
        const v1 = { id: 'v1', pipeId: 'p3', openPercentage: 0.7 };
        const v2 = { id: 'v2', pipeId: 'p5', openPercentage: 1.0 };
        return {
            name: '局部爆管预设',
            description: '模拟主干管道破裂场景，展示漏水、压力下降和喷水粒子效果，流量数据不守恒',
            nodes: [n1, n2, n3, n4, n5, n6, n7, n8],
            pipes: [p1, p2, p3, p4, p5, p6, p7],
            pumps: [pump1],
            valves: [v1, v2],
        };
    }
    createPumpFailure() {
        const n1 = { id: 'n1', x: 100, y: 300, isSource: true, pressureLimit: 40 };
        const n2 = { id: 'n2', x: 300, y: 200, pressureLimit: 80 };
        const n3 = { id: 'n3', x: 300, y: 400, pressureLimit: 80 };
        const n4 = { id: 'n4', x: 500, y: 300, pressureLimit: 80 };
        const n5 = { id: 'n5', x: 700, y: 300, isSink: true, demand: 50, pressureLimit: 80 };
        const n6 = { id: 'n6', x: 500, y: 100, pressureLimit: 80 };
        const n7 = { id: 'n7', x: 700, y: 100, isSink: true, demand: 30, pressureLimit: 80 };
        const n8 = { id: 'n8', x: 500, y: 500, pressureLimit: 80 };
        const n9 = { id: 'n9', x: 700, y: 500, isSink: true, demand: 30, pressureLimit: 80 };
        const n10 = { id: 'n10', x: 850, y: 200, isSource: true, pressureLimit: 120 };
        const p1 = { id: 'p1', startNodeId: 'n1', endNodeId: 'n2', diameter: 200, roughness: 0.01 };
        const p2 = { id: 'p2', startNodeId: 'n1', endNodeId: 'n3', diameter: 200, roughness: 0.01 };
        const p3 = { id: 'p3', startNodeId: 'n2', endNodeId: 'n4', diameter: 150, roughness: 0.01 };
        const p4 = { id: 'p4', startNodeId: 'n3', endNodeId: 'n4', diameter: 150, roughness: 0.01 };
        const p5 = { id: 'p5', startNodeId: 'n4', endNodeId: 'n5', diameter: 200, roughness: 0.01 };
        const p6 = { id: 'p6', startNodeId: 'n4', endNodeId: 'n6', diameter: 150, roughness: 0.01 };
        const p7 = { id: 'p7', startNodeId: 'n6', endNodeId: 'n7', diameter: 150, roughness: 0.01 };
        const p8 = { id: 'p8', startNodeId: 'n4', endNodeId: 'n8', diameter: 150, roughness: 0.01 };
        const p9 = { id: 'p9', startNodeId: 'n8', endNodeId: 'n9', diameter: 150, roughness: 0.01 };
        const p10 = { id: 'p10', startNodeId: 'n10', endNodeId: 'n5', diameter: 200, roughness: 0.008 };
        const pump1 = { id: 'pu1', pipeId: 'p1', power: 80, head: 30, flowCapacity: 200, isActive: false };
        const pump2 = { id: 'pu2', pipeId: 'p2', power: 80, head: 30, flowCapacity: 200, isActive: false };
        const pump3 = { id: 'pu3', pipeId: 'p10', power: 120, head: 70, flowCapacity: 350, isActive: true };
        const v1 = { id: 'v1', pipeId: 'p7', openPercentage: 1.0 };
        const v2 = { id: 'v2', pipeId: 'p9', openPercentage: 1.0 };
        const v3 = { id: 'v3', pipeId: 'p5', openPercentage: 0.9 };
        return {
            name: '泵站失效预设',
            description: '左侧泵站故障停机，右侧高压源仍在运转，观察水流倒灌（橙色箭头）',
            nodes: [n1, n2, n3, n4, n5, n6, n7, n8, n9, n10],
            pipes: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10],
            pumps: [pump1, pump2, pump3],
            valves: [v1, v2, v3],
        };
    }
    createHighPressureBackflow() {
        const n1 = { id: 'n1', x: 100, y: 300, isSource: true, pressureLimit: 40 };
        const n2 = { id: 'n2', x: 300, y: 300, pressureLimit: 50 };
        const n3 = { id: 'n3', x: 500, y: 300, pressureLimit: 80 };
        const n4 = { id: 'n4', x: 700, y: 300, isSource: true, pressureLimit: 200 };
        const n5 = { id: 'n5', x: 300, y: 100, pressureLimit: 60 };
        const n6 = { id: 'n6', x: 500, y: 100, isSink: true, demand: 10, pressureLimit: 60 };
        const n7 = { id: 'n7', x: 300, y: 500, pressureLimit: 60 };
        const n8 = { id: 'n8', x: 500, y: 500, isSink: true, demand: 10, pressureLimit: 60 };
        const n9 = { id: 'n9', x: 150, y: 150, pressureLimit: 50 };
        const p1 = { id: 'p1', startNodeId: 'n1', endNodeId: 'n2', diameter: 150, roughness: 0.03 };
        const p2 = { id: 'p2', startNodeId: 'n2', endNodeId: 'n3', diameter: 200, roughness: 0.01 };
        const p3 = { id: 'p3', startNodeId: 'n3', endNodeId: 'n4', diameter: 250, roughness: 0.005 };
        const p4 = { id: 'p4', startNodeId: 'n2', endNodeId: 'n5', diameter: 100, roughness: 0.02 };
        const p5 = { id: 'p5', startNodeId: 'n5', endNodeId: 'n6', diameter: 100, roughness: 0.02 };
        const p6 = { id: 'p6', startNodeId: 'n2', endNodeId: 'n7', diameter: 100, roughness: 0.02 };
        const p7 = { id: 'p7', startNodeId: 'n7', endNodeId: 'n8', diameter: 100, roughness: 0.02 };
        const p8 = { id: 'p8', startNodeId: 'n2', endNodeId: 'n9', diameter: 80, roughness: 0.08 };
        const pump1 = { id: 'pu1', pipeId: 'p1', power: 40, head: 20, flowCapacity: 100, isActive: true };
        const pump2 = { id: 'pu2', pipeId: 'p3', power: 180, head: 120, flowCapacity: 500, isActive: true };
        const v1 = { id: 'v1', pipeId: 'p2', openPercentage: 0.8 };
        const v2 = { id: 'v2', pipeId: 'p5', openPercentage: 0.5 };
        const v3 = { id: 'v3', pipeId: 'p7', openPercentage: 0.5 };
        return {
            name: '高压回流预设',
            description: '左右两个水源相互对抗，右侧高压源推动水流倒灌，节点压力持续升高',
            nodes: [n1, n2, n3, n4, n5, n6, n7, n8, n9],
            pipes: [p1, p2, p3, p4, p5, p6, p7, p8],
            pumps: [pump1, pump2],
            valves: [v1, v2, v3],
        };
    }
    getPresetNames() {
        return Array.from(this.presets.keys());
    }
    getPreset(key) {
        return this.presets.get(key);
    }
    getAllPresets() {
        return this.presets;
    }
};
exports.PresetsService = PresetsService;
exports.PresetsService = PresetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PresetsService);
//# sourceMappingURL=presets.service.js.map