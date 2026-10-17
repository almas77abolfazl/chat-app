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

const MAX_MESSAGE_LENGTH = 2000;
const MAX_AGENT_CONTENT_LENGTH = 4000;

@WebSocketGateway({ cors: { origin: '*', transports: ['websocket'] } })
@UseGuards(WsJwtGuard)
export class MessageGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private agentService: AgentService,
    private botService: BotService,
    private chatService: ChatService,
    private userService: UserService,
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

      await this.userService.updateOnlineStatus(user._id as string, true);

      this.server.to(user._id.toString()).emit('connected', { userId: user._id, isOnline: true });
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as IUser;
    if (user) {
      this.userService.updateOnlineStatus(user._id as string, false).catch(() => {});
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() messageData: any, @ConnectedSocket() client: Socket) {
    try {
      const sender = client.data.user as IUser;
      const senderId = sender._id as string;
      let chatId = messageData?.chatId as string | undefined;
      const content: string = messageData?.content;

      if ((typeof content !== 'string' || !content.trim()) && !messageData?.receiver) {
        client.emit('messageError', { message: 'content is required' });
        return;
      }
      if (typeof content === 'string' && content.length > MAX_MESSAGE_LENGTH) {
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

      const msg = await this.messageService.saveMessageToChat(chatId, senderId, content.trim());
      const participantIds = await this.chatService.getParticipantIds(chatId);
      for (const pid of participantIds) {
        if (pid === senderId) {
          client.emit('messageSent', { chatId, message: msg });
        } else {
          this.server.to(pid).emit('receiveMessage', { chatId, message: msg });
        }
      }
    } catch (error) {
      client.emit('messageError', {
        message: error?.message ?? 'Failed to send message',
      });
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
      const chat = await this.chatService.findOrCreateDirectChat(user._id as string, bot._id as string);
      await this.messageService.saveMessageToChat(chat._id.toString(), user._id as string, content);

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
        const botMessage = await this.messageService.saveMessageToChat(chat._id.toString(), bot._id as string, result.text);
        client.emit('agentSaved', { messageId: botMessage._id, chatId: chat._id.toString() });
      }
    } catch (error) {
      client.emit('agentError', {
        message: error?.message ?? 'Agent failed',
      });
    }
  }
}
