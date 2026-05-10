import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NetworkModule } from './network/network.module';
import { StorageService } from './data/storage.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    NetworkModule,
  ],
  controllers: [],
  providers: [StorageService],
})
export class AppModule {}
