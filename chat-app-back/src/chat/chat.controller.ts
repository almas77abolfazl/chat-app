import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async getChatList(@Req() request: RequestWithUser) {
    const userId = request.user.id;
    const chats = await this.chatService.getChatList(userId);

    return chats.map((chat) => ({
      _id: chat.participants[0]._id.toString(),
      firstName: chat.participants[0].firstName,
      lastName: chat.participants[0].lastName,
      lastMessage: chat.lastMessage,
      messageCount: chat.unreadCounts.get(userId) || 0,
      messages: [],
    }));
  }
}
