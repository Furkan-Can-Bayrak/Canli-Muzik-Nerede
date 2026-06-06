import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('provinces')
@Controller()
export class ProvincesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('provinces')
  listProvinces() {
    return this.prisma.province.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, plateCode: true, name: true },
    });
  }

  @Get('provinces/:provinceId/districts')
  listDistricts(@Param('provinceId') provinceId: string) {
    return this.prisma.district.findMany({
      where: { provinceId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, provinceId: true },
    });
  }

  /** @deprecated Use GET /provinces */
  @Get('cities')
  listCitiesAlias() {
    return this.prisma.province.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  }

  @Get('provinces/:provinceId')
  async getProvince(@Param('provinceId') provinceId: string) {
    const province = await this.prisma.province.findUnique({
      where: { id: provinceId },
      select: { id: true, plateCode: true, name: true },
    });
    if (!province) throw new NotFoundException('Province not found');
    return province;
  }
}
