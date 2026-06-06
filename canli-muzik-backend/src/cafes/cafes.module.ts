import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CafesController } from './cafes.controller';

@Module({
  imports: [AuthModule],
  controllers: [CafesController],
})
export class CafesModule {}

