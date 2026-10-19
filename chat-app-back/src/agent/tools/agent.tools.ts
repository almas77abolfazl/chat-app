import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from 'src/message/entities/message.entity';
import { ChatService } from 'src/chat/chat.service';
import { UserService } from 'src/user/user.service';
import { IUser } from 'src/user/interfaces/user.interface';
import { LlmToolDefinition } from '../llm/llm.service';

export interface ToolContext {
  user: IUser;
}

@Injectable()
export class AgentTools {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private chatService: ChatService,
    private userService: UserService,
  ) {}

  get definitions(): LlmToolDefinition[] {
    return [
      {
        type: 'function',
        function: {
          name: 'get_chat_list',
          description: 'لیست گفتگوهای کاربر را برمی‌گرداند (طرف مقابل و آخرین پیام)',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_chat_history',
          description: 'آخرین پیام‌های یک گفتگوی خصوصی بین کاربر و طرف مقابل را برمی‌گرداند',
          parameters: {
            type: 'object',
            properties: {
              otherUserId: {
                type: 'string',
                description: 'شناسه کاربر طرف مقابل گفتگو',
              },
              limit: {
                type: 'number',
                description: 'تعداد پیام‌ها (حداکثر ۱۰۰، پیش‌فرض ۳۰)',
              },
            },
            required: ['otherUserId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'search_messages',
          description: 'در پیام‌های خود کاربر جستجو می‌کند',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'عبارت جستجو' },
              limit: { type: 'number', description: 'حداکثر نتایج (پیش‌فرض ۲۰)' },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_current_time',
          description: 'زمان فعلی سرور را برمی‌گرداند',
          parameters: { type: 'object', properties: {} },
        },
      },
    ];
  }

  async execute(name: string, args: Record<string, any>, ctx: ToolContext) {
    switch (name) {
      case 'get_chat_list':
        return this.getChatList(ctx);
      case 'get_chat_history':
        return this.getChatHistory(ctx, args);
      case 'search_messages':
        return this.searchMessages(ctx, args);
      case 'get_current_time':
        return { now: new Date().toISOString() };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async getChatList(ctx: ToolContext) {
    const chats = await this.chatService.getChatList(ctx.user._id.toString());
    return chats.map((chat: any) => ({
      chatId: chat.chatId,
      isGroup: chat.isGroup,
      isChannel: chat.isChannel,
      name: chat.name ?? [chat.otherParticipant?.firstName, chat.otherParticipant?.lastName].filter(Boolean).join(' '),
      lastMessage: chat.lastMessage?.content ?? null,
      unreadCount: chat.unreadCount,
    }));
  }

  private async getChatHistory(ctx: ToolContext, args: Record<string, any>) {
    const otherUserId = String(args.otherUserId ?? '');
    const limit = Math.min(Number(args.limit ?? 30), 100);
    const userId = ctx.user._id.toString();

    const messages = await this.messageModel
      .find({
        $or: [
          { sender: userId, receiver: otherUserId },
          { sender: otherUserId, receiver: userId },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return {
      messages: messages
        .map((message: any) => ({
          from: message.sender.toString() === userId ? 'me' : 'them',
          content: message.content,
          createdAt: message.createdAt,
        }))
        .reverse(),
    };
  }

  private async searchMessages(ctx: ToolContext, args: Record<string, any>) {
    const query = String(args.query ?? '');
    const limit = Math.min(Number(args.limit ?? 20), 50);
    const userId = ctx.user._id.toString();
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const messages = await this.messageModel
      .find({
        $or: [{ sender: userId }, { receiver: userId }],
        content: { $regex: new RegExp(escaped, 'i') },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return {
      results: messages.map((message: any) => ({
        with: message.sender.toString() === userId ? message.receiver?.toString() : message.sender.toString(),
        content: message.content,
        createdAt: message.createdAt,
      })),
    };
  }
}
