// chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from './entities/chat.entity';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Chat.name) private chatModel: Model<ChatDocument>) {}

  async getChatList(userId: string): Promise<any> {
    try {
      const chats = await this.chatModel
        .find({ participants: userId })
        .populate('participants', 'firstName lastName') // Populate با فیلدهای مورد نیاز
        .sort({ updatedAt: -1 })
        .exec();

      const formattedChats = chats.map((chat) => {
        const otherParticipant: any = chat.participants.find(
          (participant) => participant._id.toString() !== userId,
        );
        chat.participants = otherParticipant;
        return chat;
      });

      return formattedChats;
    } catch (error) {
      throw new Error('Error fetching chats');
    }
  }
}
