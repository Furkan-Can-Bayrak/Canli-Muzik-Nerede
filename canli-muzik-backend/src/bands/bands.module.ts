import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';
import { BandsController } from './bands.controller';

@Module({
  imports: [AuthModule, UploadsModule],
  controllers: [BandsController],
})
export class BandsModule {}

