import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/types';
import { presentCafe } from './cafe.presenter';
import { cafeUserIdsWithVisiblePhone } from './cafe-phone-visibility';
import { UpdateCafeDto } from './dto/update-cafe.dto';

const cafeInclude = {
  province: true,
  district: true,
} as const;

@ApiTags('cafes')
@Controller('cafes')
export class CafesController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser() user?: RequestUser) {
    const cafe = await this.prisma.cafeProfile.findUnique({
      where: { userId: id },
      include: cafeInclude,
    });
    if (!cafe) throw new NotFoundException('Cafe not found');
    const visible = await cafeUserIdsWithVisiblePhone(this.prisma, user, [
      cafe.userId,
    ]);
    return presentCafe(cafe, visible.has(cafe.userId));
  }

  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CAFE)
  @Patch('me')
  async updateMe(@CurrentUser() user: RequestUser, @Body() dto: UpdateCafeDto) {
    const cafe = await this.prisma.cafeProfile.update({
      where: { userId: user.userId },
      data: {
        name: dto.name,
        provinceId: dto.provinceId,
        districtId: dto.districtId,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        phone: dto.phone,
        description: dto.description,
      },
      include: cafeInclude,
    });
    return cafe;
  }
}
