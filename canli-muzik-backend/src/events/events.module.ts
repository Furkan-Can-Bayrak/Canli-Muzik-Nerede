import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';
import { EventsController } from './events.controller';

@Module({
  imports: [AuthModule, UploadsModule],
  controllers: [EventsController],
})
export class EventsModule {}

