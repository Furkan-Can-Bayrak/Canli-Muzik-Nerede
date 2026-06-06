import { Module } from '@nestjs/common';
import { ProvincesController } from './provinces.controller';

@Module({
  controllers: [ProvincesController],
})
export class LocationsModule {}
