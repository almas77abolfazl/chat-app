import { Body, Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';
import { NotificationsService, WebPushSubscriptionDto } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: this.notificationsService.getPublicKey() };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(@Body() body: WebPushSubscriptionDto, @Headers('user-agent') userAgent: string | undefined, @Req() req: RequestWithUser) {
    return this.notificationsService.subscribe(req.user._id.toString(), body, userAgent);
  }

  @Post('unsubscribe')
  @UseGuards(JwtAuthGuard)
  async unsubscribe(@Body('endpoint') endpoint: string, @Req() req: RequestWithUser) {
    return this.notificationsService.unsubscribe(req.user._id.toString(), endpoint);
  }
}
