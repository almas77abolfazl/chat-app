import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';
import { E2eeService } from './e2ee.service';

@Controller('e2ee')
@UseGuards(JwtAuthGuard)
export class E2eeController {
  constructor(private readonly e2eeService: E2eeService) {}

  @Post('keys')
  async publishKey(@Body('publicKey') publicKey: string, @Req() req: RequestWithUser) {
    return this.e2eeService.publishPublicKey(req.user._id.toString(), publicKey);
  }

  @Get('keys/:userId')
  async getPublicKey(@Param('userId') userId: string) {
    return this.e2eeService.getPublicKey(userId);
  }

  @Post('secret-chat')
  async createSecretChat(@Body() body: { targetUserId: string; selfDestructSeconds?: number }, @Req() req: RequestWithUser) {
    return this.e2eeService.createOrGetSecretChat(req.user._id.toString(), body.targetUserId, body.selfDestructSeconds);
  }

  @Post('secret-chat/:chatId/timer')
  async updateTimer(@Param('chatId') chatId: string, @Body('selfDestructSeconds') selfDestructSeconds: number, @Req() req: RequestWithUser) {
    return this.e2eeService.updateSelfDestructTimer(chatId, req.user._id.toString(), selfDestructSeconds);
  }
}
