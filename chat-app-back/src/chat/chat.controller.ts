import { Body, Controller, Delete, Get, Param, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';
import { CreateChatDto, ChatMemberDto } from './dto/create-chat.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/helpers/upload';
import { AdminPermissions } from './entities/chat.entity';

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

  @Get('saved-messages')
  @UseGuards(JwtAuthGuard)
  async getSavedMessages(@Req() request: RequestWithUser) {
    const chat = await this.chatService.findOrCreateSavedMessages(request.user._id.toString());
    return {
      chatId: chat._id,
      name: chat.name || 'Saved Messages',
      isGroup: false,
      isChannel: false,
      isSavedMessages: true,
      ownerId: chat.owner?.toString(),
      participants: chat.participants,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getChat(@Param('id') id: string, @Req() request: RequestWithUser) {
    const chat = await this.chatService.findChat(id, request.user._id.toString());
    if (!chat) throw new Error('Chat not found');
    return chat;
  }

  @Post(':id/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', multerOptions))
  async uploadChatAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Req() request: RequestWithUser) {
    if (!file) {
      throw new Error('No file uploaded!');
    }
    return this.chatService.updateChatAvatar(id, request.user._id.toString(), file.filename);
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

  @Get(':id/admins')
  @UseGuards(JwtAuthGuard)
  async getAdmins(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.chatService.getAdmins(id, request.user._id.toString());
  }

  @Post(':id/admins')
  @UseGuards(JwtAuthGuard)
  async addAdmin(
    @Param('id') id: string,
    @Body() body: { targetUserId: string; permissions?: AdminPermissions; customTitle?: string },
    @Req() request: RequestWithUser,
  ) {
    return this.chatService.addAdmin(id, body.targetUserId, request.user._id.toString(), body.permissions, body.customTitle);
  }

  @Delete(':id/admins/:targetUserId')
  @UseGuards(JwtAuthGuard)
  async removeAdmin(@Param('id') id: string, @Param('targetUserId') targetUserId: string, @Req() request: RequestWithUser) {
    return this.chatService.removeAdmin(id, targetUserId, request.user._id.toString());
  }

  @Delete(':id/delete')
  @UseGuards(JwtAuthGuard)
  async deleteChat(
    @Param('id') id: string,
    @Req() request: RequestWithUser,
    @Query('deleteForBoth') queryDeleteForBoth?: string,
    @Body('deleteForBoth') bodyDeleteForBoth?: boolean,
  ) {
    const deleteForBoth = bodyDeleteForBoth === true || queryDeleteForBoth === 'true';
    await this.chatService.deleteChat(id, request.user._id.toString(), deleteForBoth);
    return { success: true };
  }

  @Post(':id/clear')
  @UseGuards(JwtAuthGuard)
  async clearChat(@Param('id') id: string, @Req() request: RequestWithUser) {
    await this.chatService.clearChatHistory(id, request.user._id.toString());
    return { success: true };
  }
}
