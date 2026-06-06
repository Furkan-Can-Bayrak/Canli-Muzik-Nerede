import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/types';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatGateway } from './chat.gateway';

@ApiTags('chat')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CAFE, Role.BAND)
@Controller()
export class ChatController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('conversations')
  async listConversations(@CurrentUser() user: RequestUser) {
    return this.prisma.conversation.findMany({
      where:
        user.role === Role.CAFE
          ? { cafeUserId: user.userId }
          : { bandUserId: user.userId },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        cafeUser: { select: { id: true, cafeProfile: true, email: true, role: true } },
        bandUser: {
          select: {
            id: true,
            bandProfile: { select: { userId: true, bandName: true, memberCount: true, description: true } },
            email: true,
            role: true,
          },
        },
      },
    });
  }

  @Post('conversations')
  async createConversation(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateConversationDto,
  ) {
    const other = await this.prisma.user.findUnique({
      where: { id: dto.otherUserId },
      select: { id: true, role: true },
    });
    if (!other) throw new NotFoundException('User not found');

    // Only allow cafe<->band
    const isCafeBandPair =
      (user.role === Role.CAFE && other.role === Role.BAND) ||
      (user.role === Role.BAND && other.role === Role.CAFE);
    if (!isCafeBandPair) throw new ForbiddenException('Only cafe<->band chat allowed');

    const cafeUserId = user.role === Role.CAFE ? user.userId : other.id;
    const bandUserId = user.role === Role.BAND ? user.userId : other.id;

    return this.prisma.conversation.upsert({
      where: { cafeUserId_bandUserId: { cafeUserId, bandUserId } },
      update: { lastMessageAt: new Date() },
      create: { cafeUserId, bandUserId },
      include: {
        cafeUser: { select: { id: true, cafeProfile: true, email: true, role: true } },
        bandUser: {
          select: {
            id: true,
            bandProfile: { select: { userId: true, bandName: true, memberCount: true, description: true } },
            email: true,
            role: true,
          },
        },
      },
    });
  }

  @Get('conversations/:id/messages')
  async listMessages(
    @CurrentUser() user: RequestUser,
    @Param('id') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('take') takeRaw?: string,
  ) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, cafeUserId: true, bandUserId: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (user.userId !== conv.cafeUserId && user.userId !== conv.bandUserId) {
      throw new ForbiddenException('Not a member of this conversation');
    }

    const take = Math.min(Math.max(Number(takeRaw ?? 30), 1), 100);

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { sender: { select: { id: true, role: true } } },
    });
  }

  @Post('conversations/:id/messages')
  async createMessage(
    @CurrentUser() user: RequestUser,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, cafeUserId: true, bandUserId: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (user.userId !== conv.cafeUserId && user.userId !== conv.bandUserId) {
      throw new ForbiddenException('Not a member of this conversation');
    }

    const msg = await this.prisma.message.create({
      data: {
        conversationId: conv.id,
        senderUserId: user.userId,
        body: dto.body,
      },
      include: { sender: { select: { id: true, role: true } } },
    });

    await this.prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: msg.createdAt },
    });

    this.chatGateway.emitMessageCreated(conv.id, msg);
    return msg;
  }
}

