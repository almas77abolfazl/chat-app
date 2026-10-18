import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { SubscribeChannelDto } from './dto/create-channel.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';

@Controller('channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createChannel(@Body() dto: CreateChannelDto, @Req() request: RequestWithUser) {
    return this.channelService.createChannel(dto.name, request.user._id as string);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/subscribe')
  async subscribe(@Param('id') id: string, @Req() request: RequestWithUser) {
    const channel = await this.channelService.findById(id);
    if (!channel) throw new NotFoundException('Channel not found');
    const userId = request.user._id.toString();
    if (channel.subscribers.includes(userId as any)) {
      throw new ForbiddenException('Already subscribed to this channel');
    }
    return this.channelService.addSubscriber(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/unsubscribe')
  async unsubscribe(@Param('id') id: string, @Req() request: RequestWithUser) {
    const channel = await this.channelService.findById(id);
    if (!channel) throw new NotFoundException('Channel not found');
    const userId = request.user._id.toString();
    channel.subscribers = channel.subscribers.filter((s) => s.toString() !== userId);
    await channel.save();
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getChannel(@Param('id') id: string) {
    const channel = await this.channelService.findById(id);
    if (!channel) throw new NotFoundException('Channel not found');
    return channel;
  }
}
