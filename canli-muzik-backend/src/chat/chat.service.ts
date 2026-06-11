import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../auth/types';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private conversationFilter(user: RequestUser) {
    return user.role === Role.CAFE
      ? { cafeUserId: user.userId }
      : { bandUserId: user.userId };
  }

  async listConversations(user: RequestUser) {
    const rows = await this.prisma.conversation.findMany({
      where: this.conversationFilter(user),
      orderBy: { lastMessageAt: 'desc' },
      include: {
        cafeUser: {
          select: { id: true, cafeProfile: true, email: true, role: true },
        },
        bandUser: {
          select: {
            id: true,
            bandProfile: {
              select: {
                userId: true,
                bandName: true,
                memberCount: true,
                description: true,
              },
            },
            email: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true },
        },
        _count: {
          select: {
            messages: {
              where: {
                readAt: null,
                senderUserId: { not: user.userId },
              },
            },
          },
        },
      },
    });

    return rows.map(({ messages, _count, ...rest }) => ({
      ...rest,
      lastPreview: messages[0]?.body?.slice(0, 80) ?? undefined,
      unreadCount: _count.messages,
    }));
  }

  async unreadCount(user: RequestUser): Promise<number> {
    return this.prisma.message.count({
      where: {
        readAt: null,
        senderUserId: { not: user.userId },
        conversation: this.conversationFilter(user),
      },
    });
  }

  async markConversationRead(
    conversationId: string,
    user: RequestUser,
  ): Promise<number> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, cafeUserId: true, bandUserId: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (user.userId !== conv.cafeUserId && user.userId !== conv.bandUserId) {
      throw new ForbiddenException('Not a member of this conversation');
    }

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderUserId: { not: user.userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return this.unreadCount(user);
  }
}
