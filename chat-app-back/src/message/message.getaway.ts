import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessageGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private messageService: MessageService,
    private jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    console.log('Socket server initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() messageData: any, client: Socket) {
    console.log(client);
    const token = client.handshake.headers.authorization?.split(' ')[1];
    const decoded = this.jwtService.verify(token);

    const sender = decoded.userId;
    const { receiver, content } = messageData;
    await this.messageService.saveMessage(sender, receiver, content);
    this.server.emit('receiveMessage', { sender, receiver, content });
  }
}
