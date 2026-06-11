import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/types';
import { UpdateBandDto } from './dto/update-band.dto';
import { UploadBandMediaDto } from './dto/upload-band-media.dto';
import { ListBandsQuery } from './dto/list-bands.query';
import { presentBand } from './band.presenter';
import {
  assertBandAreaSelection,
  bandAreaUpdateOps,
} from './band-area.util';
import { UploadsService } from '../uploads/uploads.service';

const bandInclude = {
  provinces: { include: { province: true } },
  districts: { include: { district: { include: { province: true } } } },
  genres: { include: { genre: true } },
  media: true,
} as const;

const mediaUploadInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

@ApiTags('bands')
@Controller('bands')
export class BandsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  private buildWhere(q: ListBandsQuery): Prisma.BandProfileWhereInput {
    const and: Prisma.BandProfileWhereInput[] = [];

    if (q.districtId) {
      and.push({ districts: { some: { districtId: q.districtId } } });
    } else if (q.provinceId) {
      and.push({
        OR: [
          { provinces: { some: { provinceId: q.provinceId } } },
          {
            districts: {
              some: { district: { provinceId: q.provinceId } },
            },
          },
        ],
      });
    }

    if (q.genreId) {
      and.push({ genres: { some: { genreId: q.genreId } } });
    }

    if (and.length === 0) return {};
    if (and.length === 1) return and[0]!;
    return { AND: and };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async list(
    @Query() q: ListBandsQuery,
    @CurrentUser() user?: RequestUser,
    @Req() req?: Request,
  ) {
    const where = this.buildWhere(q);
    const orderBy = { bandName: 'asc' as const };

    if (q.take == null && q.skip == null) {
      const bands = await this.prisma.bandProfile.findMany({
        where,
        include: bandInclude,
        orderBy,
      });
      return bands.map((b) =>
        presentBand(b, user?.role, user?.userId, req),
      );
    }

    const take = Math.min(q.take ?? 12, 100);
    const skip = q.skip ?? 0;

    const [bands, total] = await Promise.all([
      this.prisma.bandProfile.findMany({
        where,
        include: bandInclude,
        orderBy,
        take,
        skip,
      }),
      this.prisma.bandProfile.count({ where }),
    ]);

    return {
      items: bands.map((b) =>
        presentBand(b, user?.role, user?.userId, req),
      ),
      total,
      skip,
      take,
    };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getOne(
    @Param('id') id: string,
    @CurrentUser() user?: RequestUser,
    @Req() req?: Request,
  ) {
    const band = await this.prisma.bandProfile.findUnique({
      where: { userId: id },
      include: bandInclude,
    });
    if (!band) throw new NotFoundException('Band not found');
    return presentBand(band, user?.role, user?.userId, req);
  }

  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BAND)
  @Post('me/media')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(mediaUploadInterceptor)
  async uploadMedia(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadBandMediaDto,
    @Req() req: Request,
  ) {
    const storedPath = await this.uploads.saveBandMedia(
      user.userId,
      file,
      dto.type,
    );
    const url = this.uploads.toPublicUrl(storedPath, req);
    const media = await this.prisma.bandMedia.create({
      data: {
        bandId: user.userId,
        type: dto.type,
        url,
      },
    });
    return {
      ...media,
      url: this.uploads.toPublicUrl(url, req),
    };
  }

  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BAND)
  @Delete('me/media/:mediaId')
  async deleteMedia(
    @CurrentUser() user: RequestUser,
    @Param('mediaId') mediaId: string,
  ) {
    const media = await this.prisma.bandMedia.findFirst({
      where: { id: mediaId, bandId: user.userId },
    });
    if (!media) throw new NotFoundException('Media not found');
    await this.uploads.deleteStoredUrl(
      media.url.replace(/^https?:\/\/[^/]+/, ''),
    );
    await this.prisma.bandMedia.delete({ where: { id: mediaId } });
    return { ok: true };
  }

  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BAND)
  @Patch('me')
  async updateMe(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateBandDto,
    @Req() req: Request,
  ) {
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

    return presentBand(band, user.role, user.userId, req);
  }
}
