import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { RegisterUserBaseDto } from './register-user-base.dto';

export class RegisterCustomerDto extends RegisterUserBaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  displayName?: string;
}

