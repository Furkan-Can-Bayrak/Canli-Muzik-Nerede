import { ForbiddenException } from '@nestjs/common';
import { ReviewTargetType, Role } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import type { RequestUser } from '../auth/types';

describe('ReviewsService assertNotSelfReview', () => {
  const prisma = {} as never;
  const summaryService = {} as never;
  const service = new ReviewsService(prisma, summaryService);

  it('blocks band owner reviewing own band', () => {
    const user: RequestUser = { userId: 'band-1', role: Role.BAND };
    expect(() =>
      service.assertNotSelfReview(
        user,
        ReviewTargetType.BAND,
        'band-1',
      ),
    ).toThrow(ForbiddenException);
  });

  it('blocks cafe owner reviewing own cafe', () => {
    const user: RequestUser = { userId: 'cafe-1', role: Role.CAFE };
    expect(() =>
      service.assertNotSelfReview(
        user,
        ReviewTargetType.CAFE,
        'cafe-1',
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows band reviewing a cafe', () => {
    const user: RequestUser = { userId: 'band-1', role: Role.BAND };
    expect(() =>
      service.assertNotSelfReview(
        user,
        ReviewTargetType.CAFE,
        'cafe-1',
      ),
    ).not.toThrow();
  });

  it('allows customer reviewing band', () => {
    const user: RequestUser = { userId: 'cust-1', role: Role.CUSTOMER };
    expect(() =>
      service.assertNotSelfReview(
        user,
        ReviewTargetType.BAND,
        'band-1',
      ),
    ).not.toThrow();
  });
});
