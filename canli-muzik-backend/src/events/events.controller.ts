import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';
import { EventStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/types';
import { presentCafe } from '../cafes/cafe.presenter';
import { cafeUserIdsWithVisiblePhone } from '../cafes/cafe-phone-visibility';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ListEventsQuery } from './dto/list-events.query';

const eventPublicInclude = {
  province: true,
  district: true,
  cafe: { include: { province: true, district: true } },
  band: {
    select: {
      userId: true,
      bandName: true,
      memberCount: true,
      description: true,
    },
  },
} satisfies Prisma.EventInclude;

type EventPublicRow = Prisma.EventGetPayload<{
  include: typeof eventPublicInclude;
}>;

function presentEventLocation(row: EventPublicRow) {
  return {
    ...row,
    /** @deprecated use province */
    city: row.province,
    /** @deprecated use provinceId */
    cityId: row.provinceId,
  };
}

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(q: ListEventsQuery): Prisma.EventWhereInput {
    const and: Prisma.EventWhereInput[] = [];

    const provinceId = q.provinceId ?? q.cityId;
    if (provinceId) and.push({ provinceId });
    if (q.districtId) and.push({ districtId: q.districtId });
    if (q.bandId) and.push({ bandId: q.bandId });
    if (q.cafeId) and.push({ cafeId: q.cafeId });

    if (q.minPrice != null || q.maxPrice != null) {
      const price: Prisma.IntNullableFilter = {};
      if (q.minPrice != null) price.gte = q.minPrice;
      if (q.maxPrice != null) price.lte = q.maxPrice;
      and.push({ price });
    }

    if (q.startAtFrom || q.startAtTo) {
      const startAt: Prisma.DateTimeNullableFilter = {};
      if (q.startAtFrom) startAt.gte = new Date(q.startAtFrom);
      if (q.startAtTo) startAt.lte = new Date(q.startAtTo);
      and.push({ startAt });
    }

    const searchTerm = q.q?.trim();
    const addrTerm = q.addressContains?.trim();
    if (searchTerm) {
      and.push({
        OR: [
          { address: { contains: searchTerm, mode: 'insensitive' } },
          {
            cafe: {
              name: { contains: searchTerm, mode: 'insensitive' },
            },
          },
        ],
      });
    } else if (addrTerm) {
      and.push({ address: { contains: addrTerm, mode: 'insensitive' } });
    }

    if (and.length === 0) return {};
    if (and.length === 1) return and[0]!;
    return { AND: and };
  }

  private visibilityWhere(
    q: ListEventsQuery,
    user?: RequestUser,
  ): Prisma.EventWhereInput {
    const ownCafe =
      user?.role === Role.CAFE &&
      q.cafeId != null &&
      q.cafeId === user.userId;
    const ownBand =
      user?.role === Role.BAND &&
      q.bandId != null &&
      q.bandId === user.userId;
    if (ownCafe || ownBand) return {};
    return { status: EventStatus.PUBLISHED };
  }

  private mergeWhere(
    base: Prisma.EventWhereInput,
    extra: Prisma.EventWhereInput,
  ): Prisma.EventWhereInput {
    const baseEmpty = Object.keys(base).length === 0;
    const extraEmpty = Object.keys(extra).length === 0;
    if (baseEmpty && extraEmpty) return {};
    if (baseEmpty) return extra;
    if (extraEmpty) return base;
    return { AND: [base, extra] };
  }

  private toPublicEvent(row: EventPublicRow, canSeeCafePhone: boolean) {
    const presented = presentEventLocation(row);
    return {
      ...presented,
      cafe: presentCafe(row.cafe, canSeeCafePhone),
    };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async list(
    @Query() q: ListEventsQuery,
    @CurrentUser() user?: RequestUser,
  ) {
    const baseWhere = this.buildWhere(q);
    const where = this.mergeWhere(baseWhere, this.visibilityWhere(q, user));
    const take = Math.min(q.take ?? 20, 100);
    const skip = q.skip ?? 0;

    const rows = await this.prisma.event.findMany({
      where,
      take,
      skip,
      orderBy: [{ startAt: 'asc' }, { createdAt: 'desc' }],
      include: eventPublicInclude,
    });
    const cafeIds = rows.map((r) => r.cafe.userId);
    const visible = await cafeUserIdsWithVisiblePhone(
      this.prisma,
      user,
      cafeIds,
    );
    return rows.map((r) =>
      this.toPublicEvent(r, visible.has(r.cafe.userId)),
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser() user?: RequestUser) {
    const ev = await this.prisma.event.findUnique({
      where: { id },
      include: eventPublicInclude,
    });
    if (!ev) throw new NotFoundException('Event not found');
    if (ev.status !== EventStatus.PUBLISHED) {
      const allowed =
        (user?.role === Role.CAFE && user.userId === ev.cafeId) ||
        (user?.role === Role.BAND &&
          ev.bandId != null &&
          user.userId === ev.bandId);
      if (!allowed) throw new NotFoundException('Event not found');
    }
    const visible = await cafeUserIdsWithVisiblePhone(this.prisma, user, [
      ev.cafe.userId,
    ]);
    return this.toPublicEvent(ev, visible.has(ev.cafe.userId));
  }

  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CAFE)
  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateEventDto) {
    const status =
      dto.bandId != null ? EventStatus.DRAFT : EventStatus.PUBLISHED;
    const created = await this.prisma.event.create({
      data: {
        cafeId: user.userId,
        provinceId: dto.provinceId,
        districtId: dto.districtId,
        address: dto.address,
        title: dto.title,
        description: dto.description,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        posterUrl: dto.posterUrl,
        price: dto.price,
        bandId: dto.bandId,
        status,
      },
      include: eventPublicInclude,
    });
    return presentEventLocation(created);
  }

  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BAND)
  @Post(':id/publish')
  async publishAsBand(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    const ev = await this.prisma.event.findUnique({
      where: { id },
      select: { id: true, bandId: true, status: true },
    });
    if (!ev || ev.bandId !== user.userId) {
      throw new NotFoundException('Event not found');
    }
    if (ev.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Event is already published or not a draft');
    }
    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.PUBLISHED },
      include: eventPublicInclude,
    });
    return presentEventLocation(updated);
  }

  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CAFE)
  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    const existing = await this.prisma.event.findUnique({
      where: { id },
      select: { id: true, cafeId: true, bandId: true },
    });
    if (!existing) throw new NotFoundException('Event not found');
    if (existing.cafeId !== user.userId) throw new NotFoundException('Event not found');

    const data: Prisma.EventUpdateInput = {};

    if (dto.provinceId !== undefined) {
      data.province = { connect: { id: dto.provinceId } };
    }
    if (dto.districtId !== undefined) {
      data.district = dto.districtId
        ? { connect: { id: dto.districtId } }
        : { disconnect: true };
    }
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.startAt !== undefined) {
      data.startAt = dto.startAt ? new Date(dto.startAt) : null;
    }
    if (dto.endAt !== undefined) {
      data.endAt = dto.endAt ? new Date(dto.endAt) : null;
    }
    if (dto.posterUrl !== undefined) data.posterUrl = dto.posterUrl;
    if (dto.price !== undefined) data.price = dto.price;

    if (dto.bandId !== undefined) {
      if (dto.bandId) {
        data.band = { connect: { userId: dto.bandId } };
        if (dto.bandId !== existing.bandId) {
          data.status = EventStatus.DRAFT;
        }
      } else {
        data.band = { disconnect: true };
        if (existing.bandId) {
          data.status = EventStatus.PUBLISHED;
        }
      }
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data,
      include: eventPublicInclude,
    });
    return presentEventLocation(updated);
  }

  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CAFE)
  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const existing = await this.prisma.event.findUnique({
      where: { id },
      select: { id: true, cafeId: true },
    });
    if (!existing) throw new NotFoundException('Event not found');
    if (existing.cafeId !== user.userId) throw new NotFoundException('Event not found');

    await this.prisma.event.delete({ where: { id } });
    return { ok: true };
  }
}
