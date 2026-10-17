import { BadRequestException, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from './entities/chat.entity';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Chat.name) private chatModel: Model<ChatDocument>) {}

  async getChatList(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const chats = await this.chatModel
      .find({ participants: userObjectId })
      .populate<{ participants: any[] }>('participants', 'firstName lastName profilePicture status isOnline lastSeen')
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
        name: chat.name || null,
        isGroup: chat.isGroup,
        isChannel: chat.isChannel,
        avatar: chat.avatar || null,
        ownerId: chat.owner?.toString() || null,
        participants: chat.participants.map((p) => ({
          _id: p._id,
          firstName: p.firstName,
          lastName: p.lastName,
          profilePicture: p.profilePicture,
          status: p.status,
        })),
        otherParticipant: otherParticipant
          ? {
              _id: otherParticipant._id,
              firstName: otherParticipant.firstName,
              lastName: otherParticipant.lastName,
              profilePicture: otherParticipant.profilePicture,
              status: otherParticipant.status,
            }
          : null,
        lastMessage: chat.lastMessage,
        unreadCount,
        updatedAt: chat.updatedAt,
      };
    });
  }

  async findChat(chatId: string, userId: string): Promise<ChatDocument | null> {
    const chat = await this.chatModel.findById(chatId).exec();
    if (!chat) return null;
    if (!chat.participants.includes(new Types.ObjectId(userId))) {
      throw new ForbiddenException('You are not a member of this chat');
    }
    return chat;
  }

  async getParticipantIds(chatId: string): Promise<string[]> {
    const chat = await this.chatModel.findById(chatId, { participants: 1 }).exec();
    if (!chat) return [];
    return chat.participants.map((p) => p.toString());
  }

  async findOrCreateDirectChat(a: string, b: string): Promise<ChatDocument> {
    const aId = new Types.ObjectId(a);
    const bId = new Types.ObjectId(b);
    const existing = await this.chatModel
      .findOne({
        isGroup: false,
        isChannel: false,
        participants: { $all: [aId, bId], $size: 2 },
      })
      .exec();
    if (existing) return existing;

    return this.chatModel.create({
      participants: [aId, bId],
      isGroup: false,
      isChannel: false,
      unreadCounts: {},
    });
  }

  async createGroup(name: string, admin: string, members: string[]): Promise<ChatDocument> {
    if (!name.trim()) throw new BadRequestException('Group name is required');
    const memberIds = Array.from(new Set([admin, ...members])).filter((id) => Types.ObjectId.isValid(id));
    if (memberIds.length < 2) {
      throw new BadRequestException('A group needs at least 2 members');
    }
    return this.chatModel.create({
      name: name.trim(),
      isGroup: true,
      isChannel: false,
      participants: memberIds.map((id) => new Types.ObjectId(id)),
      owner: new Types.ObjectId(admin),
      unreadCounts: {},
    });
  }

  async createChannel(name: string, owner: string): Promise<ChatDocument> {
    if (!name.trim()) throw new BadRequestException('Channel name is required');
    return this.chatModel.create({
      name: name.trim(),
      isGroup: false,
      isChannel: true,
      participants: [new Types.ObjectId(owner)],
      owner: new Types.ObjectId(owner),
      unreadCounts: {},
    });
  }

  async addMember(chatId: string, userId: string, requesterId: string): Promise<ChatDocument> {
    const chat = await this.findChat(chatId, requesterId);
    if (!chat.isGroup) throw new BadRequestException('Chat is not a group');
    if (chat.owner?.toString() !== requesterId) {
      throw new ForbiddenException('Only the group admin can add members');
    }
    const userIdObj = new Types.ObjectId(userId);
    if (!chat.participants.includes(userIdObj)) {
      chat.participants.push(userIdObj);
      chat.unreadCounts ??= new Map();
      chat.unreadCounts.set(userId, 0);
      await chat.save();
    }
    return chat;
  }

  async subscribeChannel(chatId: string, userId: string): Promise<ChatDocument> {
    const chat = await this.chatModel.findById(chatId).exec();
    if (!chat) throw new NotFoundException('Channel not found');
    if (!chat.isChannel) throw new BadRequestException('Chat is not a channel');
    const userIdObj = new Types.ObjectId(userId);
    if (!chat.participants.includes(userIdObj)) {
      chat.participants.push(userIdObj);
      chat.unreadCounts ??= new Map();
      chat.unreadCounts.set(userId, 0);
      await chat.save();
    }
    return chat;
  }
}
