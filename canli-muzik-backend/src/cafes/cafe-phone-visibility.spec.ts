import { Role } from '@prisma/client';
import { cafeUserIdsWithVisiblePhone } from './cafe-phone-visibility';
import type { PrismaService } from '../prisma/prisma.service';

describe('cafeUserIdsWithVisiblePhone', () => {
  const makePrisma = (rows: { cafeUserId: string }[]) =>
    ({
      conversation: {
        findMany: jest.fn().mockResolvedValue(rows),
      },
    }) as unknown as PrismaService;

  it('returns empty set when viewer is missing', async () => {
    const s = await cafeUserIdsWithVisiblePhone(
      makePrisma([]),
      undefined,
      ['a'],
    );
    expect(s.size).toBe(0);
  });

  it('returns empty set for CUSTOMER', async () => {
    const s = await cafeUserIdsWithVisiblePhone(
      makePrisma([]),
      { userId: 'x', role: Role.CUSTOMER },
      ['a'],
    );
    expect(s.size).toBe(0);
  });

  it('returns only own cafe for CAFE', async () => {
    const prisma = makePrisma([]);
    const s = await cafeUserIdsWithVisiblePhone(
      prisma,
      { userId: 'own', role: Role.CAFE },
      ['own', 'other'],
    );
    expect(s.has('own')).toBe(true);
    expect(s.has('other')).toBe(false);
    expect(prisma.conversation.findMany).not.toHaveBeenCalled();
  });

  it('returns cafes with conversation for BAND', async () => {
    const prisma = makePrisma([{ cafeUserId: 'c1' }]);
    const s = await cafeUserIdsWithVisiblePhone(
      prisma,
      { userId: 'b1', role: Role.BAND },
      ['c1', 'c2'],
    );
    expect(s.has('c1')).toBe(true);
    expect(s.has('c2')).toBe(false);
    expect(prisma.conversation.findMany).toHaveBeenCalledWith({
      where: { bandUserId: 'b1', cafeUserId: { in: ['c1', 'c2'] } },
      select: { cafeUserId: true },
    });
  });
});
