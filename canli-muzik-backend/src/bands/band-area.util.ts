import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export async function assertBandAreaSelection(
  prisma: PrismaService,
  provinceIds: string[],
  districtIds: string[],
) {
  if (provinceIds.length === 0 && districtIds.length === 0) {
    throw new BadRequestException(
      'En az bir il veya ilçe seçmelisiniz.',
    );
  }

  if (districtIds.length > 0) {
    const districts = await prisma.district.findMany({
      where: { id: { in: districtIds } },
      select: { id: true, provinceId: true },
    });
    if (districts.length !== districtIds.length) {
      throw new BadRequestException('Geçersiz ilçe seçimi.');
    }
    const districtProvinceIds = new Set(districts.map((d) => d.provinceId));
    const overlap = provinceIds.filter((id) => districtProvinceIds.has(id));
    if (overlap.length > 0) {
      throw new BadRequestException(
        'Aynı il hem tüm ilçeler hem belirli ilçeler olarak seçilemez.',
      );
    }
  }

  if (provinceIds.length > 0) {
    const count = await prisma.province.count({
      where: { id: { in: provinceIds } },
    });
    if (count !== provinceIds.length) {
      throw new BadRequestException('Geçersiz il seçimi.');
    }
  }
}

export function bandAreaCreateMany(
  provinceIds: string[],
  districtIds: string[],
) {
  return {
    ...(provinceIds.length > 0
      ? {
          provinces: {
            createMany: {
              data: provinceIds.map((provinceId) => ({ provinceId })),
            },
          },
        }
      : {}),
    ...(districtIds.length > 0
      ? {
          districts: {
            createMany: {
              data: districtIds.map((districtId) => ({ districtId })),
            },
          },
        }
      : {}),
  };
}

export function bandAreaUpdateOps(
  provinceIds: string[] | undefined,
  districtIds: string[] | undefined,
) {
  const ops: Record<string, unknown> = {};
  if (provinceIds !== undefined) {
    ops.provinces = {
      deleteMany: {},
      ...(provinceIds.length > 0
        ? {
            createMany: {
              data: provinceIds.map((provinceId) => ({ provinceId })),
            },
          }
        : {}),
    };
  }
  if (districtIds !== undefined) {
    ops.districts = {
      deleteMany: {},
      ...(districtIds.length > 0
        ? {
            createMany: {
              data: districtIds.map((districtId) => ({ districtId })),
            },
          }
        : {}),
    };
  }
  return ops;
}
