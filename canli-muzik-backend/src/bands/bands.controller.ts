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
import { UpdateBandDto } from './dto/update-band.dto';
import { presentBand } from './band.presenter';
import {
  assertBandAreaSelection,
  bandAreaUpdateOps,
} from './band-area.util';

const bandInclude = {
  provinces: { include: { province: true } },
  districts: { include: { district: { include: { province: true } } } },
  genres: { include: { genre: true } },
  media: true,
} as const;

@ApiTags('bands')
@Controller('bands')
export class BandsController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async list(@CurrentUser() user?: RequestUser) {
    const bands = await this.prisma.bandProfile.findMany({
      include: bandInclude,
      orderBy: { bandName: 'asc' },
    });
    return bands.map((b) => presentBand(b, user?.role, user?.userId));
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser() user?: RequestUser) {
    const band = await this.prisma.bandProfile.findUnique({
      where: { userId: id },
      include: bandInclude,
    });
    if (!band) throw new NotFoundException('Band not found');
    return presentBand(band, user?.role, user?.userId);
  }

  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BAND)
  @Patch('me')
  async updateMe(@CurrentUser() user: RequestUser, @Body() dto: UpdateBandDto) {
    const existing = await this.prisma.bandProfile.findUnique({
      where: { userId: user.userId },
      select: { userId: true },
    });
    if (!existing) throw new NotFoundException('Band profile not found');

    const provinceIds =
      dto.provinceIds !== undefined
        ? [...new Set(dto.provinceIds)]
        : undefined;
    const districtIds =
      dto.districtIds !== undefined
        ? [...new Set(dto.districtIds)]
        : undefined;

    if (provinceIds !== undefined || districtIds !== undefined) {
      const current = await this.prisma.bandProfile.findUnique({
        where: { userId: user.userId },
        include: {
          provinces: { select: { provinceId: true } },
          districts: { select: { districtId: true } },
        },
      });
      const nextProvinces =
        provinceIds ?? current!.provinces.map((p) => p.provinceId);
      const nextDistricts =
        districtIds ?? current!.districts.map((d) => d.districtId);
      await assertBandAreaSelection(this.prisma, nextProvinces, nextDistricts);
    }

    const genreIds = dto.genreIds ? [...new Set(dto.genreIds)] : undefined;

    const band = await this.prisma.bandProfile.update({
      where: { userId: user.userId },
      data: {
        bandName: dto.bandName,
        memberCount: dto.memberCount,
        phone: dto.phone,
        basePrice: dto.basePrice,
        description: dto.description,
        ...bandAreaUpdateOps(provinceIds, districtIds),
        ...(genreIds
          ? {
              genres: {
                deleteMany: {},
                createMany: { data: genreIds.map((genreId) => ({ genreId })) },
              },
            }
          : {}),
      },
      include: bandInclude,
    });

    return presentBand(band, user.role, user.userId);
  }
}
