import { Module } from '@nestjs/common';
import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';
import { HydraulicCalculatorService } from './hydraulic-calculator.service';
import { PresetsService } from './presets.service';
import { StorageService } from '../data/storage.service';

@Module({
  imports: [],
  controllers: [NetworkController],
  providers: [NetworkService, HydraulicCalculatorService, PresetsService, StorageService],
  exports: [NetworkService],
})
export class NetworkModule {}
