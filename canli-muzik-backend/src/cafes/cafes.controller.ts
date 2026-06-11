import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
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
import { UploadsService } from '../uploads/uploads.service';

const cafeInclude = {
  province: true,
  district: true,
} as const;

const coverUploadInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

@ApiTags('cafes')
@Controller('cafes')
export class CafesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async list(@CurrentUser() user?: RequestUser) {
    const cafes = await this.prisma.cafeProfile.findMany({
      include: cafeInclude,
      orderBy: { name: 'asc' },
    });
    const visible = await cafeUserIdsWithVisiblePhone(
      this.prisma,
      user,
      cafes.map((c) => c.userId),
    );
    return cafes.map((cafe) =>
      presentCafe(cafe, visible.has(cafe.userId)),
    );
  }

  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CAFE)
  @Post('me/cover')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(coverUploadInterceptor)
  async uploadCover(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const existing = await this.prisma.cafeProfile.findUnique({
      where: { userId: user.userId },
      select: { coverUrl: true },
    });
    if (!existing) throw new NotFoundException('Cafe not found');

    const storedPath = await this.uploads.saveCafeCover(user.userId, file);
    const coverUrl = this.uploads.toPublicUrl(storedPath, req);
    if (existing.coverUrl) {
      await this.uploads.deleteStoredUrl(existing.coverUrl);
    }
    await this.prisma.cafeProfile.update({
      where: { userId: user.userId },
      data: { coverUrl },
    });
    return { coverUrl };
  }

  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CAFE)
  @Delete('me/cover')
  async deleteCover(@CurrentUser() user: RequestUser) {
    const existing = await this.prisma.cafeProfile.findUnique({
      where: { userId: user.userId },
      select: { coverUrl: true },
    });
    if (!existing) throw new NotFoundException('Cafe not found');
    if (existing.coverUrl) {
      await this.uploads.deleteStoredUrl(existing.coverUrl);
    }
    await this.prisma.cafeProfile.update({
      where: { userId: user.userId },
      data: { coverUrl: null },
    });
    return { ok: true };
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
}
