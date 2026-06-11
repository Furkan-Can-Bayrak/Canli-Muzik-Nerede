import { ApiProperty } from '@nestjs/swagger';
import { ReviewTargetType } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class PatchReviewMeQuery {
  @ApiProperty({ enum: ReviewTargetType })
  @IsEnum(ReviewTargetType)
  targetType!: ReviewTargetType;

  @ApiProperty()
  @IsUUID('4')
  targetId!: string;
}
