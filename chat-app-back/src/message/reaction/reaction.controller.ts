import { Controller, Post, Delete, Get, Body, Param, UseGuards, Req, Inject, forwardRef } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';
import { MessageGateway } from '../message.gateway';

@Controller('message')
export class ReactionController {
  constructor(
    private readonly reactionService: ReactionService,
    @Inject(forwardRef(() => MessageGateway))
    private readonly messageGateway: MessageGateway,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post(':messageId/reaction')
  async addReaction(@Param('messageId') messageId: string, @Body() body: { emoji: string }, @Req() request: RequestWithUser) {
    const userId = request.user._id.toString();
    const existing = await this.reactionService.getReactionCounts(messageId);
    const userReaction = existing.find((r) => r.users.includes(userId));

    if (userReaction && userReaction.emoji === body.emoji) {
      // Toggle off if already reacted with the same emoji
      await this.reactionService.removeReaction(messageId, userId);
    } else {
      await this.reactionService.addReaction(messageId, userId, body.emoji);
    }
    const updated = await this.reactionService.getReactionCounts(messageId);
    await this.messageGateway.broadcastReactionUpdate(messageId, updated);
    return updated;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':messageId/reaction')
  async removeReaction(@Param('messageId') messageId: string, @Req() request: RequestWithUser) {
    await this.reactionService.removeReaction(messageId, request.user._id.toString());
    const updated = await this.reactionService.getReactionCounts(messageId);
    await this.messageGateway.broadcastReactionUpdate(messageId, updated);
    return updated;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':messageId/reactions')
  async getReactions(@Param('messageId') messageId: string) {
    return this.reactionService.getReactionCounts(messageId);
  }
}
