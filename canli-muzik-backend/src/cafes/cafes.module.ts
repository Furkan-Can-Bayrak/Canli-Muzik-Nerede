import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';
import { CafesController } from './cafes.controller';

@Module({
  imports: [AuthModule, UploadsModule],
  controllers: [CafesController],
})
export class CafesModule {}

