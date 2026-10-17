import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMessages(
    @Req() request: RequestWithUser,
    @Query('chatId') chatId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    if (!chatId) throw new Error('chatId is required');
    return this.messageService.getMessagesByChat(chatId, request.user._id as string, page, limit);
  }

  @Post('delivered')
  @UseGuards(JwtAuthGuard)
  async markDelivered(@Req() request: RequestWithUser, @Body() body: { messageId: string }) {
    return this.messageService.markMessageDelivered(body.messageId);
  }

  @Post('read')
  @UseGuards(JwtAuthGuard)
  async markRead(@Req() request: RequestWithUser, @Body() body: { messageId: string }) {
    return this.messageService.markMessageRead(body.messageId, request.user._id as string);
  }

  @Post('chat-read')
  @UseGuards(JwtAuthGuard)
  async markChatRead(@Req() request: RequestWithUser, @Body() body: { chatId: string }) {
    return this.messageService.markChatMessagesRead(body.chatId, request.user._id as string);
  }
}
