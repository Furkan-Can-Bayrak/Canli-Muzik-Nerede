import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload, RequestUser } from '../auth/types';
import { Role } from '@prisma/client';
import { ChatService } from './chat.service';

type AuthedSocket = Socket & { user?: RequestUser };

@Injectable()
@WebSocketGateway({
  cors: { origin: true, credentials: true },
})
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly chatService: ChatService,
  ) {}

  private extractBearer(socket: Socket): string | undefined {
    const headerAuth = socket.handshake.headers.authorization;
    if (typeof headerAuth === 'string' && headerAuth.startsWith('Bearer ')) {
      return headerAuth.slice(7);
    }
    const auth = socket.handshake.auth as { token?: unknown } | undefined;
    if (auth && typeof auth.token === 'string') return auth.token;
    return undefined;
  }

  private async authenticate(socket: AuthedSocket) {
    if (socket.user) return socket.user;

    const token = this.extractBearer(socket);
    if (!token) throw new ForbiddenException('Missing token');

    const payload = (await this.jwt.verifyAsync(token, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
    })) as JwtPayload;

    socket.user = { userId: payload.sub, role: payload.role };
    return socket.user;
  }

  private room(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  emitUnreadCount(userId: string, count: number) {
    this.server
      .to(this.userRoom(userId))
      .emit('unreadCountChanged', { count });
  }

  private async isUserViewingConversation(
    userId: string,
    conversationId: string,
  ): Promise<boolean> {
    const sockets = await this.server.in(this.room(conversationId)).fetchSockets();
    return sockets.some((s) => s.data.userId === userId);
  }

  private async notifyRecipientUnread(
    conversationId: string,
    senderUserId: string,
    members: { cafeUserId: string; bandUserId: string },
  ) {
    const recipientId =
      senderUserId === members.cafeUserId
        ? members.bandUserId
        : members.cafeUserId;
    const recipient: RequestUser = {
      userId: recipientId,
      role:
        recipientId === members.cafeUserId ? Role.CAFE : Role.BAND,
    };

    try {
      let count: number;
      if (await this.isUserViewingConversation(recipientId, conversationId)) {
        count = await this.chatService.markConversationRead(
          conversationId,
          recipient,
        );
      } else {
        count = await this.chatService.unreadCount(recipient);
      }
      this.emitUnreadCount(recipientId, count);
    } catch {
      /* ignore */
    }
  }

  emitMessageCreated(
    conversationId: string,
    payload: {
      id: string;
      body: string;
      createdAt: Date;
      senderUserId: string;
      sender: { id: string; role: string };
    },
    members: { cafeUserId: string; bandUserId: string },
  ) {
    this.server.to(this.room(conversationId)).emit('messageCreated', payload);
    const update = {
      conversationId,
      lastMessageAt: payload.createdAt,
      preview: payload.body.slice(0, 80),
      senderId: payload.senderUserId,
    };
    this.server
      .to(this.userRoom(members.cafeUserId))
      .emit('conversationUpdated', update);
    this.server
      .to(this.userRoom(members.bandUserId))
      .emit('conversationUpdated', update);
    void this.notifyRecipientUnread(conversationId, payload.senderUserId, members);
  }

  @SubscribeMessage('joinInbox')
  async joinInbox(@ConnectedSocket() socket: AuthedSocket) {
    const user = await this.authenticate(socket);
    if (user.role !== Role.CAFE && user.role !== Role.BAND) {
      throw new ForbiddenException('Only cafe/band can use inbox');
    }
    await socket.join(this.userRoom(user.userId));
    return { ok: true };
  }

  @SubscribeMessage('joinConversation')
  async joinConversation(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() body: { conversationId: string },
  ) {
    const user = await this.authenticate(socket);
    const conv = await this.prisma.conversation.findUnique({
      where: { id: body.conversationId },
      select: { id: true, cafeUserId: true, bandUserId: true },
    });
    if (!conv) throw new ForbiddenException('Conversation not found');
    if (user.userId !== conv.cafeUserId && user.userId !== conv.bandUserId) {
      throw new ForbiddenException('Not a member');
    }
    await socket.join(this.room(conv.id));
    socket.data.userId = user.userId;
    return { ok: true };
  }

  @SubscribeMessage('leaveConversation')
  async leaveConversation(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() body: { conversationId: string },
  ) {
    await this.authenticate(socket);
    await socket.leave(this.room(body.conversationId));
    return { ok: true };
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() body: { conversationId: string; text: string },
  ) {
    const user = await this.authenticate(socket);
    if (user.role !== Role.CAFE && user.role !== Role.BAND) {
      throw new ForbiddenException('Only cafe/band can send messages');
    }

    const conv = await this.prisma.conversation.findUnique({
      where: { id: body.conversationId },
      select: { id: true, cafeUserId: true, bandUserId: true },
    });
    if (!conv) throw new ForbiddenException('Conversation not found');
    if (user.userId !== conv.cafeUserId && user.userId !== conv.bandUserId) {
      throw new ForbiddenException('Not a member');
    }

    const msg = await this.prisma.message.create({
      data: {
        conversationId: conv.id,
        senderUserId: user.userId,
        body: body.text,
      },
      include: { sender: { select: { id: true, role: true } } },
    });

    await this.prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: msg.createdAt },
    });

    this.emitMessageCreated(conv.id, msg, conv);
    return msg;
  }
}

