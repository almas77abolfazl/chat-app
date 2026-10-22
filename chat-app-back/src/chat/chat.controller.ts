import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';
import { CreateChatDto, ChatMemberDto } from './dto/create-chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async getChatList(@Req() request: RequestWithUser) {
    const userId = request.user._id.toString();
    const chats = await this.chatService.getChatList(userId);
    return chats;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createChat(@Body() dto: CreateChatDto, @Req() request: RequestWithUser) {
    const userId = request.user._id.toString();
    const type = dto.type ?? 'direct';

    if (type === 'direct') {
      const peerId = dto.peerId;
      if (!peerId) throw new Error('peerId is required for a direct chat');
      return this.chatService.findOrCreateDirectChat(userId, peerId);
    }
    if (type === 'group') {
      return this.chatService.createGroup(dto.name ?? '', userId, dto.memberIds ?? []);
    }
    if (type === 'channel') {
      return this.chatService.createChannel(dto.name ?? '', userId);
    }
    throw new Error(`Unknown chat type: ${type}`);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getChat(@Param('id') id: string, @Req() request: RequestWithUser) {
    const chat = await this.chatService.findChat(id, request.user._id.toString());
    if (!chat) throw new Error('Chat not found');
    return chat;
  }

  @Post(':id/member')
  @UseGuards(JwtAuthGuard)
  async addMember(@Param('id') id: string, @Body() dto: ChatMemberDto, @Req() request: RequestWithUser) {
    const userId = dto.userId ?? request.user._id.toString();
    return this.chatService.addMember(id, userId, request.user._id.toString());
  }

  @Post(':id/subscriber')
  @UseGuards(JwtAuthGuard)
  async subscribeChannel(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.chatService.subscribeChannel(id, request.user._id.toString());
  }

  @Post(':id/pin')
  @UseGuards(JwtAuthGuard)
  async pinMessage(@Param('id') id: string, @Body('messageId') messageId: string, @Req() request: RequestWithUser) {
    return this.chatService.pinMessage(id, messageId, request.user._id.toString());
  }

  @Delete(':id/pin')
  @UseGuards(JwtAuthGuard)
  async unpinMessage(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.chatService.unpinMessage(id, request.user._id.toString());
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveChat(@Param('id') id: string, @Req() request: RequestWithUser) {
    await this.chatService.deleteChat(id, request.user._id.toString());
    return { success: true };
  }

  @Delete(':id/delete')
  @UseGuards(JwtAuthGuard)
  async deleteChat(@Param('id') id: string, @Req() request: RequestWithUser) {
    await this.chatService.deleteChat(id, request.user._id.toString());
    return { success: true };
  }
}
