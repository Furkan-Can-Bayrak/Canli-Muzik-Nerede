import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../auth/types';

export async function cafeUserIdsWithVisiblePhone(
  prisma: PrismaService,
  viewer: RequestUser | undefined,
  cafeUserIds: string[],
): Promise<Set<string>> {
  const unique = [...new Set(cafeUserIds.filter(Boolean))];
  if (unique.length === 0) return new Set();
  if (!viewer) return new Set();

  if (viewer.role === Role.CUSTOMER) return new Set();

  if (viewer.role === Role.CAFE) {
    return new Set(unique.filter((id) => id === viewer.userId));
  }

  if (viewer.role === Role.BAND) {
    const convs = await prisma.conversation.findMany({
      where: {
        bandUserId: viewer.userId,
        cafeUserId: { in: unique },
      },
      select: { cafeUserId: true },
    });
    return new Set(convs.map((c) => c.cafeUserId));
  }

  return new Set();
}
