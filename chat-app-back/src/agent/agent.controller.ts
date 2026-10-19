import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { BotService } from './bot/bot.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';
import { MessageService } from 'src/message/message.service';
import { ChatService } from 'src/chat/chat.service';

@Controller('agent')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly botService: BotService,
    private readonly messageService: MessageService,
    private readonly chatService: ChatService,
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

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Req() request: RequestWithUser) {
    const user = request.user;
    const bot = await this.botService.getBot();
    const chatId = await this.chatService.findOrCreateDirectChat(user._id.toString(), bot._id.toString());
    const messages = await this.messageService.getMessagesByChat(chatId.toString(), user._id.toString(), 1, 100);

    return {
      chatId: chatId.toString(),
      botUserId: bot._id.toString(),
      botName: `${bot.firstName} ${bot.lastName}`,
      messages: messages.messages,
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

    const chat = await this.chatService.findOrCreateDirectChat(user._id.toString(), bot._id.toString());
    const chatId = chat._id.toString();

    await this.messageService.saveMessageToChat(chatId, user._id.toString(), content);

    const result = await this.agentService.run(user, content);
    const botMessage = await this.messageService.saveMessageToChat(chatId, bot._id.toString(), result.text);

    return {
      text: result.text,
      toolCalls: result.toolCalls,
      messageId: botMessage._id,
      chatId,
    };
  }
}
