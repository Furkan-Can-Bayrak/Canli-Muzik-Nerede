import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BandsController } from './bands.controller';

@Module({
  imports: [AuthModule],
  controllers: [BandsController],
})
export class BandsModule {}

