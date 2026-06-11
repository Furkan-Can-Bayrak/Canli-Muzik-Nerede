import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { RegisterCafeDto } from './dto/register-cafe.dto';
import { RegisterBandDto } from './dto/register-band.dto';
import type { JwtPayload } from './types';
import {
  assertBandAreaSelection,
  bandAreaCreateMany,
} from '../bands/band-area.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Sayısal değerler saniye; "7d", "24h" gibi stringler zaman aralığı. */
  private jwtExpiresIn(): string | number {
    const raw = this.config.get<string>('JWT_EXPIRES_IN') ?? '7d';
    if (/^\d+$/.test(raw)) {
      return parseInt(raw, 10);
    }
    return raw;
  }

  private async signToken(userId: string, role: Role) {
    const payload: JwtPayload = { sub: userId, role };
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.jwtExpiresIn() as `${number}` | number,
    });
  }

  async registerCustomer(dto: RegisterCustomerDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          role: Role.CUSTOMER,
          customerProfile: { create: { displayName: dto.displayName } },
        },
        select: { id: true, email: true, role: true },
      });

      const accessToken = await this.signToken(user.id, user.role);
      return { user, accessToken };
    } catch (e: any) {
      throw new BadRequestException('Email already in use');
    }
  }

  async registerCafe(dto: RegisterCafeDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          role: Role.CAFE,
          cafeProfile: {
            create: {
              name: dto.name,
              provinceId: dto.provinceId,
              districtId: dto.districtId,
              address: dto.address,
              latitude: dto.latitude,
              longitude: dto.longitude,
              phone: dto.phone,
              description: dto.description,
            },
          },
        },
        select: { id: true, email: true, role: true },
      });

      const accessToken = await this.signToken(user.id, user.role);
      return { user, accessToken };
    } catch (e: any) {
      throw new BadRequestException('Email already in use');
    }
  }

  async registerBand(dto: RegisterBandDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const provinceIds = [...new Set(dto.provinceIds ?? [])];
    const districtIds = [...new Set(dto.districtIds ?? [])];
    const genreIds = [...new Set(dto.genreIds)];

    await assertBandAreaSelection(this.prisma, provinceIds, districtIds);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          role: Role.BAND,
          bandProfile: {
            create: {
              bandName: dto.bandName,
              memberCount: dto.memberCount,
              phone: dto.phone,
              basePrice: dto.basePrice,
              description: dto.description,
              ...bandAreaCreateMany(provinceIds, districtIds),
              genres: { createMany: { data: genreIds.map((genreId) => ({ genreId })) } },
            },
          },
        },
        select: { id: true, email: true, role: true },
      });

      const accessToken = await this.signToken(user.id, user.role);
      return { user, accessToken };
    } catch (e: any) {
      throw new BadRequestException('Email already in use');
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true, email: true, role: true, passwordHash: true },
    });
    if (!user) throw new BadRequestException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new BadRequestException('Invalid credentials');

    const accessToken = await this.signToken(user.id, user.role);
    return {
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
    };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        customerProfile: true,
        cafeProfile: true,
        bandProfile: true,
      },
    });
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { ok: true };
  }

  /** Yalnızca geliştirme ortamında — login sayfası hızlı test listesi */
  async listDevLoginHints() {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    return this.prisma.user.findMany({
      select: { email: true, role: true },
      orderBy: { email: 'asc' },
    });
  }
}

