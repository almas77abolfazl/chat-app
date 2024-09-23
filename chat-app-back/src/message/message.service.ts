import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './entities/message.entity';
import { Chat, ChatDocument } from 'src/chat/entities/chat.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  async saveMessage(
    sender: string,
    receiver: string,
    content: string,
  ): Promise<Message> {
    const message = new this.messageModel({ sender, receiver, content });
    await message.save();

    // بررسی وجود چت بین دو کاربر
    let chat = await this.chatModel.findOne({
      participants: { $all: [sender, receiver] },
    });

    // اگر چت وجود نداشت، ایجاد می‌کنیم
    if (!chat) {
      chat = new this.chatModel({
        participants: [sender, receiver],
        messages: [message._id],
        unreadCounts: { [receiver]: 1, [sender]: 0 },
        lastMessage: message.id,
        updatedAt: new Date(),
      });
    } else {
      chat.messages.push(message.id);
      chat.lastMessage = message.id;
      chat.updatedAt = new Date();
      chat.unreadCounts.set(receiver, chat.unreadCounts.get(receiver) + 1);
    }

    await chat.save();

    return message;
  }

  async getMessagesBetweenUsers(
    senderId: string,
    receiverId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    messages: Message[];
    totalMessages: number;
    currentPage: number;
    totalPages: number;
  }> {
    page = Math.max(1, page);
    limit = Math.max(1, limit);

    const skip = (page - 1) * limit;

    const messages = await this.messageModel
      .find({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId },
        ],
      })
      .populate('sender', 'firstName lastName')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    await this.messageModel.updateMany(
      {
        sender: receiverId,
        receiver: senderId,
        read: false,
      },
      { $set: { read: true } },
    );

    await this.chatModel.findOneAndUpdate(
      { participants: { $all: [senderId, receiverId] } },
      { $set: { [`unreadCounts.${senderId}`]: 0 } },
      { new: true },
    );

    const totalMessages = await this.messageModel.countDocuments({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    return {
      messages,
      totalMessages,
      currentPage: page,
      totalPages: Math.ceil(totalMessages / limit),
    };
  }
}
