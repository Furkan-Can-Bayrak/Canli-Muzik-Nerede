import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ReviewTargetType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../auth/types';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ListReviewsQuery } from './dto/list-reviews.query';
import { presentReview } from './review.presenter';
import { ReviewSummaryService } from './review-summary.service';
import { shouldRefreshReviewSummary } from './review-summary.util';

const authorInclude = {
  author: {
    include: {
      customerProfile: true,
      cafeProfile: true,
      bandProfile: true,
    },
  },
} as const;

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly summaryService: ReviewSummaryService,
  ) {}

  assertNotSelfReview(
    user: RequestUser,
    targetType: ReviewTargetType,
    targetId: string,
  ) {
    if (
      user.role === Role.BAND &&
      targetType === ReviewTargetType.BAND &&
      targetId === user.userId
    ) {
      throw new ForbiddenException('Kendi grubunuza yorum yazamazsınız');
    }
    if (
      user.role === Role.CAFE &&
      targetType === ReviewTargetType.CAFE &&
      targetId === user.userId
    ) {
      throw new ForbiddenException('Kendi mekânınıza yorum yazamazsınız');
    }
  }

  async assertTargetExists(targetType: ReviewTargetType, targetId: string) {
    if (targetType === ReviewTargetType.BAND) {
      const band = await this.prisma.bandProfile.findUnique({
        where: { userId: targetId },
        select: { bandName: true },
      });
      if (!band) throw new NotFoundException('Grup bulunamadı');
      return { bandName: band.bandName, cafeName: null };
    }
    const cafe = await this.prisma.cafeProfile.findUnique({
      where: { userId: targetId },
      select: { name: true },
    });
    if (!cafe) throw new NotFoundException('Mekân bulunamadı');
    return { bandName: null, cafeName: cafe.name };
  }

  async list(query: ListReviewsQuery, viewer?: RequestUser) {
    const where = {
      targetType: query.targetType,
      targetId: query.targetId,
    };
    const summaryWhere = {
      targetType_targetId: {
        targetType: query.targetType,
        targetId: query.targetId,
      },
    };
    const take = query.take ?? 20;
    const skip = query.skip ?? 0;

    const [reviews, totalCount, aggregate, summaryRow, myReview] =
      await Promise.all([
        this.prisma.review.findMany({
          where,
          include: authorInclude,
          orderBy: { createdAt: 'desc' },
          take,
          skip,
        }),
        this.prisma.review.count({ where }),
        this.prisma.review.aggregate({
          where,
          _avg: { rating: true },
        }),
        this.prisma.reviewSummary.findUnique({ where: summaryWhere }),
        viewer
          ? this.prisma.review.findUnique({
              where: {
                authorUserId_targetType_targetId: {
                  authorUserId: viewer.userId,
                  targetType: query.targetType,
                  targetId: query.targetId,
                },
              },
              include: authorInclude,
            })
          : Promise.resolve(null),
      ]);

    const avgRating = aggregate._avg.rating;
    return {
      items: reviews.map(presentReview),
      totalCount,
      avgRating: avgRating != null ? Math.round(avgRating * 10) / 10 : null,
      summary: summaryRow?.summary ?? null,
      myReview: myReview ? presentReview(myReview) : null,
      skip,
      take,
    };
  }

  async create(user: RequestUser, dto: CreateReviewDto) {
    this.assertNotSelfReview(user, dto.targetType, dto.targetId);
    await this.assertTargetExists(dto.targetType, dto.targetId);

    const existing = await this.prisma.review.findUnique({
      where: {
        authorUserId_targetType_targetId: {
          authorUserId: user.userId,
          targetType: dto.targetType,
          targetId: dto.targetId,
        },
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Bu hedef için zaten yorumunuz var; güncellemek için PATCH kullanın',
      );
    }

    const review = await this.prisma.review.create({
      data: {
        authorUserId: user.userId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        rating: dto.rating,
        body: dto.body?.trim() || null,
      },
      include: authorInclude,
    });

    void this.maybeRefreshSummary(dto.targetType, dto.targetId);

    return presentReview(review);
  }

  async updateMe(
    user: RequestUser,
    targetType: ReviewTargetType,
    targetId: string,
    dto: UpdateReviewDto,
  ) {
    if (dto.rating === undefined && dto.body === undefined) {
      throw new BadRequestException('Güncellenecek alan belirtin');
    }

    const review = await this.prisma.review.findUnique({
      where: {
        authorUserId_targetType_targetId: {
          authorUserId: user.userId,
          targetType,
          targetId,
        },
      },
    });
    if (!review) throw new NotFoundException('Yorum bulunamadı');

    const updated = await this.prisma.review.update({
      where: { id: review.id },
      data: {
        rating: dto.rating,
        body: dto.body !== undefined ? dto.body.trim() || null : undefined,
      },
      include: authorInclude,
    });

    void this.maybeRefreshSummary(targetType, targetId);

    return presentReview(updated);
  }

  async maybeRefreshSummary(targetType: ReviewTargetType, targetId: string) {
    try {
      const totalCount = await this.prisma.review.count({
        where: { targetType, targetId },
      });
      if (!shouldRefreshReviewSummary(totalCount)) return;

      const reviews = await this.prisma.review.findMany({
        where: { targetType, targetId },
        orderBy: { createdAt: 'asc' },
        select: { rating: true, body: true },
      });

      const target = await this.assertTargetExists(targetType, targetId);
      const label = this.summaryService.targetLabel(
        targetType,
        target.bandName,
        target.cafeName,
      );
      const summary = await this.summaryService.generateSummary(label, reviews);
      if (!summary) return;

      await this.prisma.reviewSummary.upsert({
        where: { targetType_targetId: { targetType, targetId } },
        create: {
          targetType,
          targetId,
          summary,
          reviewCount: totalCount,
        },
        update: {
          summary,
          reviewCount: totalCount,
          generatedAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.error('Review summary refresh failed', err);
    }
  }
}
