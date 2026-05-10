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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkController = void 0;
const common_1 = require("@nestjs/common");
const network_service_1 = require("./network.service");
let NetworkController = class NetworkController {
    constructor(networkService) {
        this.networkService = networkService;
    }
    getPresetList() {
        return this.networkService.getPresetList();
    }
    async loadPreset(key) {
        return this.networkService.loadPreset(key);
    }
    async getNetwork() {
        return this.networkService.getFullNetwork();
    }
    async calculate() {
        return this.networkService.calculateNetwork();
    }
    async clearNetwork() {
        await this.networkService.clearAll();
        return { success: true };
    }
    async getNodes() {
        return this.networkService.getAllNodes();
    }
    async createNode(nodeData) {
        return this.networkService.createNode(nodeData);
    }
    async updateNode(id, nodeData) {
        return this.networkService.updateNode(id, nodeData);
    }
    async deleteNode(id) {
        await this.networkService.deleteNode(id);
        return { success: true };
    }
    async getPipes() {
        return this.networkService.getAllPipes();
    }
    async createPipe(pipeData) {
        return this.networkService.createPipe(pipeData);
    }
    async updatePipe(id, pipeData) {
        return this.networkService.updatePipe(id, pipeData);
    }
    async deletePipe(id) {
        await this.networkService.deletePipe(id);
        return { success: true };
    }
    async getPumps() {
        return this.networkService.getAllPumps();
    }
    async createPump(pumpData) {
        return this.networkService.createPump(pumpData);
    }
    async updatePump(id, pumpData) {
        return this.networkService.updatePump(id, pumpData);
    }
    async deletePump(id) {
        await this.networkService.deletePump(id);
        return { success: true };
    }
    async getValves() {
        return this.networkService.getAllValves();
    }
    async createValve(valveData) {
        return this.networkService.createValve(valveData);
    }
    async updateValve(id, valveData) {
        return this.networkService.updateValve(id, valveData);
    }
    async deleteValve(id) {
        await this.networkService.deleteValve(id);
        return { success: true };
    }
};
exports.NetworkController = NetworkController;
__decorate([
    (0, common_1.Get)('presets'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NetworkController.prototype, "getPresetList", null);
__decorate([
    (0, common_1.Post)('presets/:key/load'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "loadPreset", null);
__decorate([
    (0, common_1.Get)('network'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "getNetwork", null);
__decorate([
    (0, common_1.Post)('calculate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "calculate", null);
__decorate([
    (0, common_1.Delete)('network'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "clearNetwork", null);
__decorate([
    (0, common_1.Get)('nodes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "getNodes", null);
__decorate([
    (0, common_1.Post)('nodes'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "createNode", null);
__decorate([
    (0, common_1.Put)('nodes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "updateNode", null);
__decorate([
    (0, common_1.Delete)('nodes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "deleteNode", null);
__decorate([
    (0, common_1.Get)('pipes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "getPipes", null);
__decorate([
    (0, common_1.Post)('pipes'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "createPipe", null);
__decorate([
    (0, common_1.Put)('pipes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "updatePipe", null);
__decorate([
    (0, common_1.Delete)('pipes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "deletePipe", null);
__decorate([
    (0, common_1.Get)('pumps'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "getPumps", null);
__decorate([
    (0, common_1.Post)('pumps'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "createPump", null);
__decorate([
    (0, common_1.Put)('pumps/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "updatePump", null);
__decorate([
    (0, common_1.Delete)('pumps/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "deletePump", null);
__decorate([
    (0, common_1.Get)('valves'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "getValves", null);
__decorate([
    (0, common_1.Post)('valves'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "createValve", null);
__decorate([
    (0, common_1.Put)('valves/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "updateValve", null);
__decorate([
    (0, common_1.Delete)('valves/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NetworkController.prototype, "deleteValve", null);
exports.NetworkController = NetworkController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [network_service_1.NetworkService])
], NetworkController);
//# sourceMappingURL=network.controller.js.map