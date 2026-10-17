import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './entities/message.entity';
import { Chat, ChatDocument } from 'src/chat/entities/chat.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  async findChatForMessage(chatId: string): Promise<ChatDocument> {
    const chat = await this.chatModel.findById(chatId).exec();
    if (!chat) throw new NotFoundException('Chat not found');
    return chat;
  }

  async saveMessageToChat(chatId: string, senderId: string, content: string): Promise<any> {
    const chat = await this.findChatForMessage(chatId);
    const senderObjectId = new Types.ObjectId(senderId);

    if (!chat.participants.includes(senderObjectId)) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    if (chat.isChannel && chat.owner?.toString() !== senderId) {
      throw new ForbiddenException('Only the channel owner can post in a channel');
    }

    const isDirect = !chat.isGroup && !chat.isChannel;
    const receiver = isDirect ? (chat.participants.find((p) => p.toString() !== senderId) ?? null) : null;

    const message = await this.messageModel.create({
      sender: senderObjectId,
      receiver: receiver ?? undefined,
      chat: chat._id,
      content,
      read: false,
    });

    chat.messages.push(message._id as unknown as Types.ObjectId);
    chat.lastMessage = message._id as unknown as Types.ObjectId;
    chat.updatedAt = new Date();

    for (const participant of chat.participants) {
      const id = participant.toString();
      if (id === senderId) continue;
      const current = Number(chat.unreadCounts?.get(id) ?? 0);
      chat.unreadCounts.set(id, current + 1);
    }

    await chat.save();

    const populated = await this.messageModel.findById(message._id).populate('sender', 'firstName lastName profilePicture').exec();
    return this.hydrateMessage(populated);
  }

  async markMessageDelivered(messageId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) return;
    if (message.status === 'sent') {
      message.status = 'delivered';
      message.deliveredAt = new Date();
      await message.save();
    }
  }

  async markMessageRead(messageId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) return;
    if (message.status !== 'read') {
      message.status = 'read';
      message.read = true;
      message.readAt = new Date();
      await message.save();
    }
  }

  async markChatMessagesRead(chatId: string, userId: string): Promise<void> {
    await this.messageModel
      .updateMany(
        { chat: new Types.ObjectId(chatId), sender: { $ne: new Types.ObjectId(userId) }, status: { $ne: 'read' } },
        { $set: { status: 'read', read: true, readAt: new Date() } },
      )
      .exec();
  }

  async getMessagesByChat(
    chatId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ messages: any[]; totalMessages: number; currentPage: number; totalPages: number }> {
    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Math.min(Number(limit) || 20, 100));
    const skip = (page - 1) * limit;

    const [messages, totalMessages] = await Promise.all([
      this.messageModel
        .find({ chat: new Types.ObjectId(chatId) })
        .populate('sender', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel.countDocuments({ chat: new Types.ObjectId(chatId) }).exec(),
    ]);

    await this.messageModel
      .updateMany({ chat: new Types.ObjectId(chatId), sender: { $ne: new Types.ObjectId(userId) }, read: false }, { $set: { read: true } })
      .exec();

    await this.chatModel
      .updateOne({ _id: new Types.ObjectId(chatId), participants: new Types.ObjectId(userId) }, { $set: { [`unreadCounts.${userId}`]: 0 } })
      .exec();

    return {
      messages: messages.map((m) => this.hydrateMessage(m)),
      totalMessages,
      currentPage: page,
      totalPages: Math.ceil(totalMessages / limit),
    };
  }

  hydrateMessage(message: any): any {
    if (!message) return null;
    const sender = message.sender;
    const senderId = typeof sender === 'string' ? sender : sender?._id;
    return {
      _id: message._id,
      chatId: message.chat?.toString(),
      senderId: senderId?.toString(),
      sender: {
        _id: sender?._id,
        firstName: sender?.firstName,
        lastName: sender?.lastName,
        profilePicture: sender?.profilePicture,
      },
      content: message.content,
      createdAt: message.createdAt,
      status: message.status || 'sent',
      read: message.read,
      deliveredAt: message.deliveredAt,
      readAt: message.readAt,
    };
  }
}
