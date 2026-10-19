import { Controller, Post, Delete, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';

@Controller('message')
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':messageId/reaction')
  async addReaction(@Param('messageId') messageId: string, @Body() body: { emoji: string }, @Req() request: RequestWithUser) {
    return this.reactionService.addReaction(messageId, request.user._id.toString(), body.emoji);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':messageId/reaction')
  async removeReaction(@Param('messageId') messageId: string, @Req() request: RequestWithUser) {
    return this.reactionService.removeReaction(messageId, request.user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Get(':messageId/reactions')
  async getReactions(@Param('messageId') messageId: string) {
    return this.reactionService.getReactionCounts(messageId);
  }
}
