import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ description: 'Other user id (cafe<->band only)' })
  @IsUUID()
  otherUserId!: string;
}

