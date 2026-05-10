import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { NetworkService } from './network.service';
import { NodeData, PipeData, PumpData, ValveData } from '../data/storage.service';

@Controller('api')
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @Get('presets')
  getPresetList() {
    return this.networkService.getPresetList();
  }

  @Post('presets/:key/load')
  async loadPreset(@Param('key') key: string) {
    return this.networkService.loadPreset(key);
  }

  @Get('network')
  async getNetwork() {
    return this.networkService.getFullNetwork();
  }

  @Post('calculate')
  async calculate() {
    return this.networkService.calculateNetwork();
  }

  @Delete('network')
  async clearNetwork() {
    await this.networkService.clearAll();
    return { success: true };
  }

  @Get('nodes')
  async getNodes(): Promise<NodeData[]> {
    return this.networkService.getAllNodes();
  }

  @Post('nodes')
  async createNode(@Body() nodeData: Partial<NodeData>): Promise<NodeData> {
    return this.networkService.createNode(nodeData);
  }

  @Put('nodes/:id')
  async updateNode(
    @Param('id') id: string,
    @Body() nodeData: Partial<NodeData>,
  ): Promise<NodeData | null> {
    return this.networkService.updateNode(id, nodeData);
  }

  @Delete('nodes/:id')
  async deleteNode(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.networkService.deleteNode(id);
    return { success: true };
  }

  @Get('pipes')
  async getPipes(): Promise<PipeData[]> {
    return this.networkService.getAllPipes();
  }

  @Post('pipes')
  async createPipe(@Body() pipeData: Partial<PipeData>): Promise<PipeData> {
    return this.networkService.createPipe(pipeData);
  }

  @Put('pipes/:id')
  async updatePipe(
    @Param('id') id: string,
    @Body() pipeData: Partial<PipeData>,
  ): Promise<PipeData | null> {
    return this.networkService.updatePipe(id, pipeData);
  }

  @Delete('pipes/:id')
  async deletePipe(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.networkService.deletePipe(id);
    return { success: true };
  }

  @Get('pumps')
  async getPumps(): Promise<PumpData[]> {
    return this.networkService.getAllPumps();
  }

  @Post('pumps')
  async createPump(@Body() pumpData: Partial<PumpData>): Promise<PumpData> {
    return this.networkService.createPump(pumpData);
  }

  @Put('pumps/:id')
  async updatePump(
    @Param('id') id: string,
    @Body() pumpData: Partial<PumpData>,
  ): Promise<PumpData | null> {
    return this.networkService.updatePump(id, pumpData);
  }

  @Delete('pumps/:id')
  async deletePump(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.networkService.deletePump(id);
    return { success: true };
  }

  @Get('valves')
  async getValves(): Promise<ValveData[]> {
    return this.networkService.getAllValves();
  }

  @Post('valves')
  async createValve(@Body() valveData: Partial<ValveData>): Promise<ValveData> {
    return this.networkService.createValve(valveData);
  }

  @Put('valves/:id')
  async updateValve(
    @Param('id') id: string,
    @Body() valveData: Partial<ValveData>,
  ): Promise<ValveData | null> {
    return this.networkService.updateValve(id, valveData);
  }

  @Delete('valves/:id')
  async deleteValve(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.networkService.deleteValve(id);
    return { success: true };
  }
}
