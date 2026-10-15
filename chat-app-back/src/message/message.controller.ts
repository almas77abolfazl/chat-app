import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
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
    @Query('receiverId') receiverId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const senderId = request.user._id as string;
    return this.messageService.getMessagesBetweenUsers(senderId, receiverId, page, limit);
  }
}
