import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterBandDto } from './dto/register-band.dto';
import { RegisterCafeDto } from './dto/register-cafe.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { RequestUser } from './types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register/customer')
  registerCustomer(@Body() dto: RegisterCustomerDto) {
    return this.auth.registerCustomer(dto);
  }

  @Post('register/cafe')
  registerCafe(@Body() dto: RegisterCafeDto) {
    return this.auth.registerCafe(dto);
  }

  @Post('register/band')
  registerBand(@Body() dto: RegisterBandDto) {
    return this.auth.registerBand(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: { user: RequestUser }) {
    return this.auth.me(req.user.userId);
  }
}

