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
    const userId = request.user._id as string;
    const chats = await this.chatService.getChatList(userId);

    return chats
      .filter((chat) => chat.otherParticipant)
      .map((chat) => ({
        _id: chat.otherParticipant._id,
        firstName: chat.otherParticipant.firstName,
        lastName: chat.otherParticipant.lastName,
        lastMessage: chat.lastMessage ?? null,
        messageCount: chat.unreadCount,
        updatedAt: chat.updatedAt,
        messages: [],
      }));
  }
}
