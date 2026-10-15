import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { BotService } from './bot/bot.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';
import { MessageService } from 'src/message/message.service';

@Controller('agent')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly botService: BotService,
    private readonly messageService: MessageService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus() {
    const bot = await this.botService.getBot();
    return {
      configured: this.agentService.isConfigured,
      model: this.agentService.model,
      botUserId: bot._id,
      botName: `${bot.firstName} ${bot.lastName}`,
    };
  }

  @Post('message')
  @UseGuards(JwtAuthGuard)
  async postMessage(@Body() body: { content: string }, @Req() request: RequestWithUser) {
    const user = request.user;
    const bot = await this.botService.getBot();
    const content = body?.content ?? '';
    if (!content.trim()) {
      return { text: 'پیام خالی است.', toolCalls: [], messageId: null };
    }

    await this.messageService.saveMessage(user._id as string, bot._id as string, content);

    const result = await this.agentService.run(user, content);
    const botMessage = await this.messageService.saveMessage(bot._id as string, user._id as string, result.text);

    return {
      text: result.text,
      toolCalls: result.toolCalls,
      messageId: botMessage._id,
    };
  }
}
