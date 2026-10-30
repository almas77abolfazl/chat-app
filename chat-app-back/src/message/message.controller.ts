import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  Put,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';
import { FileInterceptor } from '@nestjs/platform-express';
import { mediaMulterOptions } from 'src/helpers/media-upload';

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
    return this.messageService.getMessagesByChat(chatId, request.user._id.toString(), page, limit);
  }

  @Get('chat/:chatId/media-summary')
  @UseGuards(JwtAuthGuard)
  async getChatMediaSummary(@Req() request: RequestWithUser, @Param('chatId') chatId: string) {
    return this.messageService.getChatMediaSummary(chatId, request.user._id.toString());
  }

  @Get('chat/:chatId/media')
  @UseGuards(JwtAuthGuard)
  async getChatMedia(
    @Req() request: RequestWithUser,
    @Param('chatId') chatId: string,
    @Query('type') type?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 30,
  ) {
    return this.messageService.getChatMedia(chatId, request.user._id.toString(), type, Number(page), Number(limit));
  }

  @Post('delivered')
  @UseGuards(JwtAuthGuard)
  async markDelivered(@Req() request: RequestWithUser, @Body() body: { messageId: string }) {
    return this.messageService.markMessageDelivered(body.messageId);
  }

  @Post('read')
  @UseGuards(JwtAuthGuard)
  async markRead(@Req() request: RequestWithUser, @Body() body: { messageId: string }) {
    return this.messageService.markMessageRead(body.messageId);
  }

  @Post('chat-read')
  @UseGuards(JwtAuthGuard)
  async markChatRead(@Req() request: RequestWithUser, @Body() body: { chatId: string }) {
    return this.messageService.markChatMessagesRead(body.chatId, request.user._id.toString());
  }

  @Put(':messageId')
  @UseGuards(JwtAuthGuard)
  async editMessage(@Req() request: RequestWithUser, @Param('messageId') messageId: string, @Body() body: { content: string }) {
    return this.messageService.editMessage(messageId, request.user._id.toString(), body.content);
  }

  @Delete('bulk')
  @UseGuards(JwtAuthGuard)
  async deleteMessagesBulk(@Req() request: RequestWithUser, @Body() body: { messageIds: string[] }) {
    if (!Array.isArray(body?.messageIds) || body.messageIds.length === 0) {
      throw new BadRequestException('messageIds array is required');
    }
    return this.messageService.deleteMessagesBulk(body.messageIds, request.user._id.toString());
  }

  @Post('forward')
  @UseGuards(JwtAuthGuard)
  async forwardMessages(@Req() request: RequestWithUser, @Body() body: { messageIds: string[]; targetChatId: string }) {
    if (!Array.isArray(body?.messageIds) || body.messageIds.length === 0) {
      throw new BadRequestException('messageIds array is required');
    }
    if (!body?.targetChatId) {
      throw new BadRequestException('targetChatId is required');
    }
    return this.messageService.forwardMessages(body.messageIds, body.targetChatId, request.user._id.toString());
  }

  @Delete(':messageId')
  @UseGuards(JwtAuthGuard)
  async deleteMessage(@Req() request: RequestWithUser, @Param('messageId') messageId: string) {
    return this.messageService.deleteMessage(messageId, request.user._id.toString());
  }

  @Post('media')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', mediaMulterOptions))
  async uploadMedia(
    @Req() request: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('chatId') chatId: string,
    @Body('content') content: string = '',
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded!');
    }
    if (!chatId) {
      throw new BadRequestException('chatId is required');
    }

    const fileUrl = `/uploads/media/${file.filename}`;
    return this.messageService.saveMessageToChat(chatId, request.user._id.toString(), content, {
      mediaType: file.mimetype.startsWith('image/gif')
        ? 'gif'
        : file.mimetype.startsWith('image/')
          ? 'image'
          : file.mimetype.startsWith('video/')
            ? 'video'
            : file.mimetype.startsWith('audio/')
              ? 'voice'
              : 'file',
      fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
    });
  }
}
