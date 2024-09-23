import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message.service';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway({ cors: { origin: '*', transports: ['websocket'] } })
export class MessageGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
  ) {}

  afterInit(server: Server) {
    console.log(server);
    console.log('Socket server initialized');
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() messageData: any,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log(client);
      const token = client.handshake.query.token;
      const decoded = this.authService.decodeToken(token as string);

      const user = await this.authService.userService.findUserByPhoneNumber(
        decoded.phoneNumber,
      );
      const sender = user.id as string;

      const { receiver, content } = messageData;
      const msg = await this.messageService.saveMessage(
        sender,
        receiver,
        content,
      );
      this.server.to(receiver).emit('receiveMessage', { sender, msg });
    } catch (error) {
      console.log(error);
    }
  }

  @SubscribeMessage('connect')
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.query.token;
      const decoded = this.authService.decodeToken(token as string);
      const user = await this.authService.validateUserByPhoneNumber(
        decoded.phoneNumber,
      );
      client.join(user._id.toString());
    } catch (error) {
      console.log('error in connceting get away' + error);
    }
  }
}
