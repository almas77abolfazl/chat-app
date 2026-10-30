import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message.service';
import { AuthService } from 'src/auth/auth.service';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt.guard';
import { IUser } from 'src/user/interfaces/user.interface';
import { AgentService } from 'src/agent/agent.service';
import { BotService } from 'src/agent/bot/bot.service';
import { ChatService } from 'src/chat/chat.service';
import { UserService } from 'src/user/user.service';
import { ReactionService } from './reaction/reaction.service';
import { Message, MessageDocument } from './entities/message.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_AGENT_CONTENT_LENGTH = 4000;

@WebSocketGateway({
  cors: {
    origin: (origin: any, callback: any) => callback(null, true),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@UseGuards(WsJwtGuard)
export class MessageGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private messageService: MessageService,
    private authService: AuthService,
    private agentService: AgentService,
    private botService: BotService,
    private chatService: ChatService,
    private userService: UserService,
    private reactionService: ReactionService,
  ) {}

  afterInit() {
    console.log('Socket server initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.query?.token as string | undefined;
      if (!token) {
        client.disconnect();
        return;
      }
      const decoded = this.authService.decodeToken(token);
      const user = (await this.authService.validateUserByJwt(decoded)) as IUser | null;
      if (!user) {
        client.disconnect();
        return;
      }
      client.data.user = user;
      client.join(user._id.toString());

      await this.userService.updateOnlineStatus(user._id.toString(), true);

      this.server.to(user._id.toString()).emit('connected', { userId: user._id, isOnline: true });
      this.server.emit('userStatusChanged', {
        userId: user._id.toString(),
        isOnline: true,
      });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as IUser;
    if (user) {
      const lastSeen = new Date();
      this.userService.updateOnlineStatus(user._id.toString(), false).catch(() => {});
      this.server.emit('userStatusChanged', {
        userId: user._id.toString(),
        isOnline: false,
        lastSeen,
      });
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() messageData: any, @ConnectedSocket() client: Socket) {
    try {
      const sender = client.data.user as IUser;
      const senderId = sender._id.toString();
      let chatId = messageData?.chatId as string | undefined;
      const content: string = typeof messageData?.content === 'string' ? messageData.content : '';
      const media = messageData?.media as { mediaType: string; fileUrl: string; fileName?: string; fileSize?: number } | undefined;

      if (!content.trim() && !media && !messageData?.receiver) {
        client.emit('messageError', { message: 'content or media is required' });
        return;
      }
      if (content.length > MAX_MESSAGE_LENGTH) {
        client.emit('messageError', {
          message: `content must be at most ${MAX_MESSAGE_LENGTH} characters`,
        });
        return;
      }

      if (!chatId && messageData?.receiver) {
        const chat = await this.chatService.findOrCreateDirectChat(senderId, messageData.receiver);
        chatId = chat._id.toString();
      }

      if (!chatId) {
        client.emit('messageError', { message: 'chatId or receiver is required' });
        return;
      }

      const msg = await this.messageService.saveMessageToChat(chatId, senderId, content.trim(), media, messageData?.forwardFrom, {
        linkPreview: messageData?.linkPreview,
        skipLinkPreview: messageData?.skipLinkPreview,
        waveform: messageData?.waveform || media?.waveform,
      });
      const participantIds = await this.chatService.getParticipantIds(chatId);
      for (const pid of participantIds) {
        if (pid === senderId) {
          client.emit('messageSent', { chatId, message: msg });
        } else {
          this.server.to(pid).emit('receiveMessage', { chatId, message: msg });
          this.server.to(pid).emit('notification', {
            chatId,
            message: msg,
            senderId: senderId,
            senderName: `${sender.firstName ?? ''} ${sender.lastName ?? ''}`.trim(),
          });
        }
      }
    } catch (error) {
      client.emit('messageError', {
        message: error?.message ?? 'Failed to send message',
      });
    }
  }

  @SubscribeMessage('messageDelivered')
  async handleMessageDelivered(@MessageBody() data: { messageId: string }, @ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user as IUser;
      await this.messageService.markMessageDelivered(data.messageId);
      const message = await this.messageModel.findById(data.messageId).exec();
      if (message) {
        const senderId = message.sender.toString();
        if (senderId !== user._id.toString()) {
          this.server.to(senderId).emit('messageStatusUpdated', {
            messageId: data.messageId,
            status: 'delivered',
            userId: user._id.toString(),
          });
        }
      }
    } catch (error) {
      client.emit('messageError', { message: error?.message ?? 'Failed to mark delivered' });
    }
  }

  @SubscribeMessage('messageRead')
  async handleMessageRead(@MessageBody() data: { messageId: string }, @ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user as IUser;
      await this.messageService.markMessageRead(data.messageId);
      const message = await this.messageModel.findById(data.messageId).exec();
      if (message) {
        const senderId = message.sender.toString();
        if (senderId !== user._id.toString()) {
          this.server.to(senderId).emit('messageStatusUpdated', {
            messageId: data.messageId,
            status: 'read',
            userId: user._id.toString(),
          });
        }
      }
    } catch (error) {
      client.emit('messageError', { message: error?.message ?? 'Failed to mark read' });
    }
  }

  @SubscribeMessage('typingStart')
  async handleTypingStart(@MessageBody() data: { chatId: string }, @ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user as IUser;
      if (!user || !data?.chatId) return;
      const participantIds = await this.chatService.getParticipantIds(data.chatId);
      const rawName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
      const userName = rawName || user.username || user.phoneNumber || 'User';
      for (const pid of participantIds) {
        if (pid !== user._id.toString()) {
          this.server.to(pid).emit('typingStatus', {
            chatId: data.chatId,
            userId: user._id.toString(),
            userName,
            isTyping: true,
          });
        }
      }
    } catch (error) {
      client.emit('messageError', { message: error?.message ?? 'Failed to send typing status' });
    }
  }

  @SubscribeMessage('typingStop')
  async handleTypingStop(@MessageBody() data: { chatId: string }, @ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user as IUser;
      if (!user || !data?.chatId) return;
      const participantIds = await this.chatService.getParticipantIds(data.chatId);
      const rawName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
      const userName = rawName || user.username || user.phoneNumber || 'User';
      for (const pid of participantIds) {
        if (pid !== user._id.toString()) {
          this.server.to(pid).emit('typingStatus', {
            chatId: data.chatId,
            userId: user._id.toString(),
            userName,
            isTyping: false,
          });
        }
      }
    } catch (error) {
      client.emit('messageError', { message: error?.message ?? 'Failed to send typing status' });
    }
  }

  @SubscribeMessage('agentMessage')
  async handleAgentMessage(@MessageBody() messageData: any, @ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user as IUser;
      const content = typeof messageData?.content === 'string' ? messageData.content.trim() : '';

      if (!content) {
        client.emit('agentError', { message: 'content is required' });
        return;
      }
      if (content.length > MAX_AGENT_CONTENT_LENGTH) {
        client.emit('agentError', {
          message: `content must be at most ${MAX_AGENT_CONTENT_LENGTH} characters`,
        });
        return;
      }

      const bot = await this.botService.getBot();
      const chat = await this.chatService.findOrCreateDirectChat(user._id.toString(), bot._id.toString());
      await this.messageService.saveMessageToChat(chat._id.toString(), user._id.toString(), content);

      client.emit('agentStart', { botUserId: bot._id });

      const result = await this.agentService.run(
        user,
        content,
        (event) => {
          client.emit('agent' + event.type[0].toUpperCase() + event.type.slice(1), event.data ?? {});
        },
        { stream: true },
      );

      if (result.text) {
        const botMessage = await this.messageService.saveMessageToChat(chat._id.toString(), bot._id.toString(), result.text);
        client.emit('agentSaved', { messageId: botMessage._id, chatId: chat._id.toString() });
      }
    } catch (error) {
      client.emit('agentError', {
        message: error?.message ?? 'Agent failed',
      });
    }
  }

  @SubscribeMessage('messageEdit')
  async handleMessageEdit(@MessageBody() data: { messageId: string; content: string }, @ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user as IUser;
      const updated = await this.messageService.editMessage(data.messageId, user._id.toString(), data.content);
      const message = await this.messageModel.findById(data.messageId).exec();
      if (message) {
        const chatId = message.chat.toString();
        const participantIds = await this.chatService.getParticipantIds(chatId);
        for (const pid of participantIds) {
          if (pid === user._id.toString()) {
            client.emit('messageEdited', { messageId: data.messageId, message: updated });
          } else {
            this.server.to(pid).emit('messageEdited', { messageId: data.messageId, message: updated });
          }
        }
      }
    } catch (error) {
      client.emit('messageError', { message: error?.message ?? 'Failed to edit message' });
    }
  }

  @SubscribeMessage('messageDelete')
  async handleMessageDelete(@MessageBody() data: { messageId: string }, @ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user as IUser;
      const message = await this.messageModel.findById(data.messageId).exec();
      if (message) {
        const chatId = message.chat.toString();
        await this.messageService.deleteMessage(data.messageId, user._id.toString());
        const participantIds = await this.chatService.getParticipantIds(chatId);
        for (const pid of participantIds) {
          if (pid === user._id.toString()) {
            client.emit('messageDeleted', { messageId: data.messageId });
          } else {
            this.server.to(pid).emit('messageDeleted', { messageId: data.messageId });
          }
        }
      }
    } catch (error) {
      client.emit('messageError', { message: error?.message ?? 'Failed to delete message' });
    }
  }

  @SubscribeMessage('forwardMessages')
  async handleForwardMessages(@MessageBody() data: { messageIds: string[]; targetChatId: string }, @ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user as IUser;
      const senderId = user._id.toString();
      const newMessages = await this.messageService.forwardMessages(data.messageIds, data.targetChatId, senderId);

      const participantIds = await this.chatService.getParticipantIds(data.targetChatId);
      for (const msg of newMessages) {
        for (const pid of participantIds) {
          if (pid === senderId) {
            client.emit('messageSent', { chatId: data.targetChatId, message: msg });
          } else {
            this.server.to(pid).emit('receiveMessage', { chatId: data.targetChatId, message: msg });
            this.server.to(pid).emit('notification', {
              chatId: data.targetChatId,
              message: msg,
              senderId: senderId,
              senderName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
            });
          }
        }
      }
    } catch (error) {
      client.emit('messageError', { message: error?.message ?? 'Failed to forward messages' });
    }
  }

  @SubscribeMessage('messageReaction')
  async handleMessageReaction(@MessageBody() data: { messageId: string; emoji: string }, @ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user as IUser;
      const existingReactions = await this.reactionService.getReactionCounts(data.messageId);
      const userReaction = existingReactions.find((r) => r.users.includes(user._id.toString()));

      if (userReaction && userReaction.emoji === data.emoji) {
        // Remove reaction (toggle off)
        await this.reactionService.removeReaction(data.messageId, user._id.toString());
      } else {
        // Add or change reaction
        await this.reactionService.addReaction(data.messageId, user._id.toString(), data.emoji);
      }
      const updated = await this.reactionService.getReactionCounts(data.messageId);
      const message = await this.messageModel.findById(data.messageId).exec();
      if (message) {
        const chatId = message.chat.toString();
        const participantIds = await this.chatService.getParticipantIds(chatId);
        for (const pid of participantIds) {
          this.server.to(pid).emit('messageReactionUpdated', {
            messageId: data.messageId,
            reactions: updated,
          });
        }
      }
    } catch (error) {
      client.emit('messageError', { message: error?.message ?? 'Failed to add reaction' });
    }
  }

  @SubscribeMessage('pinMessage')
  async handlePinMessage(@MessageBody() data: { chatId: string; messageId: string }, @ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user as IUser;
      await this.chatService.pinMessage(data.chatId, data.messageId, user._id.toString());
      const message = await this.messageModel.findById(data.messageId).populate('sender', 'firstName lastName profilePicture').exec();
      const hydrated = this.messageService.hydrateMessage(message);
      const participantIds = await this.chatService.getParticipantIds(data.chatId);
      for (const pid of participantIds) {
        this.server.to(pid).emit('messagePinned', {
          chatId: data.chatId,
          pinnedMessage: hydrated,
        });
      }
    } catch (error) {
      client.emit('messageError', { message: error?.message ?? 'Failed to pin message' });
    }
  }

  @SubscribeMessage('unpinMessage')
  async handleUnpinMessage(@MessageBody() data: { chatId: string }, @ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user as IUser;
      await this.chatService.unpinMessage(data.chatId, user._id.toString());
      const participantIds = await this.chatService.getParticipantIds(data.chatId);
      for (const pid of participantIds) {
        this.server.to(pid).emit('messagePinned', {
          chatId: data.chatId,
          pinnedMessage: null,
        });
      }
    } catch (error) {
      client.emit('messageError', { message: error?.message ?? 'Failed to unpin message' });
    }
  }

  @SubscribeMessage('chatDelete')
  async handleChatDelete(@MessageBody() data: { chatId: string }, @ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user as IUser;
      await this.chatService.deleteChat(data.chatId, user._id.toString());
      client.join(data.chatId);
      this.server.to(data.chatId).emit('chatDeleted', { chatId: data.chatId, userId: user._id.toString() });
    } catch (error) {
      client.emit('messageError', { message: error?.message ?? 'Failed to delete chat' });
    }
  }

  @SubscribeMessage('chatLeave')
  async handleChatLeave(@MessageBody() data: { chatId: string }, @ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user as IUser;
      await this.chatService.deleteChat(data.chatId, user._id.toString());
      client.join(data.chatId);
      this.server.to(data.chatId).emit('chatLeft', { chatId: data.chatId, userId: user._id.toString() });
    } catch (error) {
      client.emit('messageError', { message: error?.message ?? 'Failed to leave chat' });
    }
  }

  async broadcastNewMessage(chatId: string, senderId: string, msg: any, senderName?: string) {
    if (!this.server) return;
    try {
      const participantIds = await this.chatService.getParticipantIds(chatId);
      for (const pid of participantIds) {
        if (pid === senderId) {
          this.server.to(pid).emit('messageSent', { chatId, message: msg });
        } else {
          this.server.to(pid).emit('receiveMessage', { chatId, message: msg });
          this.server.to(pid).emit('notification', {
            chatId,
            message: msg,
            senderId: senderId,
            senderName: senderName || 'کاربر',
          });
        }
      }
    } catch (e) {
      console.error('Failed to broadcast media message:', e);
    }
  }
}
