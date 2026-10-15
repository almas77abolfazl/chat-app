// chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from './entities/chat.entity';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Chat.name) private chatModel: Model<ChatDocument>) {}

  async getChatList(userId: string) {
    const chats = await this.chatModel
      .find({ participants: userId })
      .populate<{ participants: any[] }>('participants', 'firstName lastName')
      .populate('lastMessage', 'content sender createdAt')
      .sort({ updatedAt: -1 })
      .exec();

    return chats.map((chat) => {
      const otherParticipant = chat.participants.find((participant) => participant._id.toString() !== userId);

      let unreadCount = 0;
      if (chat.unreadCounts) {
        const counts = typeof chat.unreadCounts.get === 'function' ? chat.unreadCounts.get(userId) : (chat.unreadCounts as any)[userId];
        unreadCount = Number(counts) || 0;
      }

      return {
        chatId: chat._id,
        otherParticipant: otherParticipant
          ? {
              _id: otherParticipant._id,
              firstName: otherParticipant.firstName,
              lastName: otherParticipant.lastName,
            }
          : null,
        lastMessage: chat.lastMessage,
        unreadCount,
        updatedAt: chat.updatedAt,
      };
    });
  }
}
