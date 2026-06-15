import type { PrismaService } from '../prisma/prisma.service';
import { turkishLikePattern } from '../common/search-text.util';

async function queryEventIds(
  prisma: PrismaService,
  pattern: string,
  addressOnly: boolean,
): Promise<string[]> {
  if (addressOnly) {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT e.id
      FROM "Event" e
      WHERE normalize_search_text(e.address) LIKE ${pattern}
    `;
    return rows.map((row) => row.id);
  }

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT e.id
    FROM "Event" e
    INNER JOIN "CafeProfile" c ON e."cafeId" = c."userId"
    INNER JOIN "Province" p ON e."provinceId" = p.id
    LEFT JOIN "BandProfile" b ON e."bandId" = b."userId"
    LEFT JOIN "District" d ON e."districtId" = d.id
    WHERE (
      normalize_search_text(COALESCE(e.title, '')) LIKE ${pattern}
      OR normalize_search_text(e.address) LIKE ${pattern}
      OR normalize_search_text(c.name) LIKE ${pattern}
      OR normalize_search_text(c.address) LIKE ${pattern}
      OR normalize_search_text(COALESCE(b."bandName", '')) LIKE ${pattern}
      OR normalize_search_text(COALESCE(d.name, '')) LIKE ${pattern}
      OR normalize_search_text(p.name) LIKE ${pattern}
    )
  `;
  return rows.map((row) => row.id);
}

export async function findEventIdsByTurkishSearch(
  prisma: PrismaService,
  rawTerm: string,
): Promise<string[]> {
  const pattern = turkishLikePattern(rawTerm);
  if (!pattern) return [];
  return queryEventIds(prisma, pattern, false);
}

export async function findEventIdsByTurkishAddress(
  prisma: PrismaService,
  rawTerm: string,
): Promise<string[]> {
  const pattern = turkishLikePattern(rawTerm);
  if (!pattern) return [];
  return queryEventIds(prisma, pattern, true);
}
