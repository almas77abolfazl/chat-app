import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message.service';
import { AuthService } from 'src/auth/auth.service';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt.guard';
import { IUser } from 'src/user/interfaces/user.interface';
import { AgentService } from 'src/agent/agent.service';
import { BotService } from 'src/agent/bot/bot.service';

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
      this.server.to(user._id.toString()).emit('connected', { userId: user._id });
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() messageData: any, @ConnectedSocket() client: Socket) {
    try {
      const sender = client.data.user as IUser;
      const receiver = messageData?.receiver;
      const content = messageData?.content;

      if (typeof receiver !== 'string' || !receiver) {
        client.emit('messageError', { message: 'receiver is required' });
        return;
      }
      if (typeof content !== 'string' || !content.trim()) {
        client.emit('messageError', { message: 'content is required' });
        return;
      }
      if (content.length > MAX_MESSAGE_LENGTH) {
        client.emit('messageError', {
          message: `content must be at most ${MAX_MESSAGE_LENGTH} characters`,
        });
        return;
      }

      const msg = await this.messageService.saveMessage(sender._id as string, receiver, content.trim());
      this.server.to(receiver).emit('receiveMessage', {
        sender: sender._id as string,
        msg,
      });
      client.emit('messageSent', { msg });
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
      await this.messageService.saveMessage(user._id as string, bot._id as string, content);

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
        const botMessage = await this.messageService.saveMessage(bot._id as string, user._id as string, result.text);
        client.emit('agentSaved', { messageId: botMessage._id });
      }
    } catch (error) {
      client.emit('agentError', {
        message: error?.message ?? 'Agent failed',
      });
    }
  }
}
