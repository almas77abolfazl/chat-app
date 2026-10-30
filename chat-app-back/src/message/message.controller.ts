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
import { MessageGateway } from './message.gateway';
import { extname } from 'path';
import { fetchLinkPreview } from 'src/helpers/link-preview.helper';

@Controller('message')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly messageGateway: MessageGateway,
  ) {}

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

  @Get('link-preview')
  @UseGuards(JwtAuthGuard)
  async getLinkPreview(@Query('url') url: string) {
    if (!url) {
      throw new BadRequestException('url query parameter is required');
    }
    const preview = await fetchLinkPreview(url);
    return { preview };
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
    @Body('waveform') waveformStr?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded!');
    }
    if (!chatId) {
      throw new BadRequestException('chatId is required');
    }

    const fileUrl = `/uploads/media/${file.filename}`;
    const mimetype = (file.mimetype || '').toLowerCase();
    const ext = extname(file.originalname || '').toLowerCase();

    let mediaType: 'image' | 'video' | 'voice' | 'file' | 'gif' = 'file';
    if (mimetype === 'image/gif' || ext === '.gif') {
      mediaType = 'gif';
    } else if (mimetype.startsWith('image/')) {
      mediaType = 'image';
    } else if (mimetype.startsWith('video/')) {
      mediaType = 'video';
    } else if (mimetype.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.opus', '.wma'].includes(ext)) {
      mediaType = 'voice';
    } else {
      mediaType = 'file';
    }

    let fileName = file.originalname;
    try {
      fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch {
      fileName = file.originalname;
    }

    let waveform: number[] | undefined;
    if (waveformStr) {
      try {
        const parsed = typeof waveformStr === 'string' ? JSON.parse(waveformStr) : waveformStr;
        if (Array.isArray(parsed)) {
          waveform = parsed.map((n) => Math.max(5, Math.min(100, Math.round(Number(n) || 0))));
        }
      } catch {}
    }

    const savedMessage = await this.messageService.saveMessageToChat(chatId, request.user._id.toString(), content, {
      mediaType,
      fileUrl,
      fileName,
      fileSize: file.size,
      waveform,
    });

    const senderName = `${request.user.firstName ?? ''} ${request.user.lastName ?? ''}`.trim();
    await this.messageGateway.broadcastNewMessage(chatId, request.user._id.toString(), savedMessage, senderName);

    return savedMessage;
  }
}
