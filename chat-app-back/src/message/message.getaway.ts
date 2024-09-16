import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message.service';

@WebSocketGateway({
  cors: {
    origin: '*', // برای اجازه به همه کلاینت‌ها (اختیاری)
  },
})
export class MessageGateway {
  constructor(private messageService: MessageService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() message: any, client: Socket) {
    console.log(client);
    await this.messageService.saveMessage(null, null, message);
    this.server.emit('receiveMessage', message);
  }
}
