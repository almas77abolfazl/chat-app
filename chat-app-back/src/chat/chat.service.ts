import { BadRequestException, Injectable, ForbiddenException, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AdminPermissions, Chat, ChatAdmin, ChatDocument } from './entities/chat.entity';
import { Message, MessageDocument } from '../message/entities/message.entity';
import { User, UserDocument } from '../user/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @Optional() @InjectModel(Message.name) private messageModel?: Model<MessageDocument>,
    @Optional() @InjectModel(User.name) private userModel?: Model<UserDocument>,
  ) {}

  async getChatList(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const chats = await this.chatModel
      .find({
        participants: userObjectId,
        deletedFor: { $ne: userObjectId },
      })
      .populate<{ participants: any[] }>('participants', 'firstName lastName profilePicture avatars status isOnline lastSeen')
      .populate('lastMessage', 'content sender createdAt')
      .populate('pinnedMessage', 'content sender createdAt status isDeleted')
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
        isSavedMessages: !!chat.isSavedMessages,
        avatar: chat.avatar || null,
        avatars: chat.avatars || [],
        ownerId: chat.owner?.toString() || null,
        admins: (chat.admins || []).map((a: any) => ({
          userId: a.userId?.toString(),
          customTitle: a.customTitle || 'مدیر',
          permissions: a.permissions || {},
          promotedBy: a.promotedBy?.toString(),
          promotedAt: a.promotedAt,
        })),
        participants: chat.participants.map((p) => ({
          _id: p._id,
          firstName: p.firstName,
          lastName: p.lastName,
          profilePicture: p.profilePicture,
          avatars: p.avatars || [],
          status: p.status,
        })),
        otherParticipant: otherParticipant
          ? {
              _id: otherParticipant._id,
              firstName: otherParticipant.firstName,
              lastName: otherParticipant.lastName,
              profilePicture: otherParticipant.profilePicture,
              avatars: otherParticipant.avatars || [],
              status: otherParticipant.status,
            }
          : null,
        lastMessage: chat.lastMessage,
        pinnedMessage: chat.pinnedMessage || null,
        unreadCount,
        updatedAt: chat.updatedAt,
      };
    });
  }

  async findChat(chatId: string, userId: string): Promise<ChatDocument | null> {
    const chat = await this.chatModel
      .findById(chatId)
      .populate('participants', 'firstName lastName profilePicture avatars status isOnline lastSeen phoneNumber')
      .populate('pinnedMessage')
      .exec();
    if (!chat) return null;
    if (!chat.participants.some((p: any) => (p._id || p).toString() === userId)) {
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

  async findOrCreateSavedMessages(userId: string): Promise<ChatDocument> {
    const userObjId = new Types.ObjectId(userId);
    const existing = await this.chatModel
      .findOne({
        isGroup: false,
        isChannel: false,
        isSavedMessages: true,
        participants: userObjId,
      })
      .exec();
    if (existing) return existing;

    return this.chatModel.create({
      participants: [userObjId],
      owner: userObjId,
      isGroup: false,
      isChannel: false,
      isSavedMessages: true,
      name: 'Saved Messages',
      unreadCounts: {},
    });
  }

  async createGroup(name: string, admin: string, members: string[]): Promise<ChatDocument> {
    if (!name.trim()) throw new BadRequestException('Group name is required');
    const memberIds = Array.from(new Set([admin, ...members])).filter((id) => Types.ObjectId.isValid(id));
    if (memberIds.length < 2) {
      throw new BadRequestException('A group needs at least 2 members');
    }
    const chat = await this.chatModel.create({
      name: name.trim(),
      isGroup: true,
      isChannel: false,
      participants: memberIds.map((id) => new Types.ObjectId(id)),
      owner: new Types.ObjectId(admin),
      unreadCounts: {},
    });

    if (this.messageModel) {
      try {
        let adminName = 'شما';
        let addedNames: string[] = [];
        if (this.userModel) {
          const adminUser = await this.userModel.findById(admin).exec();
          if (adminUser) adminName = `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() || 'مدیر';
          const otherMembers = memberIds.filter((id) => id !== admin);
          if (otherMembers.length > 0) {
            const users = await this.userModel.find({ _id: { $in: otherMembers } }).exec();
            addedNames = users.map((u) => `${u.firstName || ''} ${u.lastName || ''}`.trim()).filter(Boolean);
          }
        }
        const createMsg = await this.messageModel.create({
          sender: new Types.ObjectId(admin),
          chat: chat._id,
          content: `${adminName} گروه را ایجاد کرد`,
          mediaType: 'system',
          read: true,
          status: 'sent',
        });
        chat.lastMessage = createMsg._id as any;
        if (addedNames.length > 0) {
          const addMsg = await this.messageModel.create({
            sender: new Types.ObjectId(admin),
            chat: chat._id,
            content: `${adminName}، ${addedNames.join(' و ')} را به گروه اضافه کرد`,
            mediaType: 'system',
            read: true,
            status: 'sent',
          });
          chat.lastMessage = addMsg._id as any;
        }
        await chat.save();
      } catch {
        // Non-blocking system message creation
      }
    }

    return chat;
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
    if (!chat) throw new NotFoundException('Chat not found');
    if (!chat.isGroup) throw new BadRequestException('Chat is not a group');
    if (chat.owner?.toString() !== requesterId) {
      throw new ForbiddenException('Only the group admin can add members');
    }
    const userIdObj = new Types.ObjectId(userId);
    if (!chat.participants.some((p: any) => (p._id || p).toString() === userId)) {
      chat.participants.push(userIdObj);
      chat.unreadCounts ??= new Map();
      chat.unreadCounts.set(userId, 0);
      await chat.save();

      if (this.messageModel) {
        try {
          let requesterName = 'مدیر';
          let addedUserName = 'کاربر جدید';
          if (this.userModel) {
            const reqUser = await this.userModel.findById(requesterId).exec();
            if (reqUser) requesterName = `${reqUser.firstName || ''} ${reqUser.lastName || ''}`.trim() || 'مدیر';
            const targetUser = await this.userModel.findById(userId).exec();
            if (targetUser) addedUserName = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || 'کاربر جدید';
          }
          const sysMsg = await this.messageModel.create({
            sender: new Types.ObjectId(requesterId),
            chat: chat._id,
            content: `${requesterName}، ${addedUserName} را به گروه اضافه کرد`,
            mediaType: 'system',
            read: true,
            status: 'sent',
          });
          chat.lastMessage = sysMsg._id as any;
          await chat.save();
        } catch {
          // Non-blocking
        }
      }
    }
    return chat;
  }

  async subscribeChannel(chatId: string, userId: string): Promise<ChatDocument> {
    const chat = await this.chatModel.findById(chatId).exec();
    if (!chat) throw new NotFoundException('Channel not found');
    if (!chat.isChannel) throw new BadRequestException('Chat is not a channel');
    const userIdObj = new Types.ObjectId(userId);
    if (!chat.participants.some((p: any) => (p._id || p).toString() === userId)) {
      chat.participants.push(userIdObj);
      chat.unreadCounts ??= new Map();
      chat.unreadCounts.set(userId, 0);
      await chat.save();
    }
    return chat;
  }

  async pinMessage(chatId: string, messageId: string, userId: string): Promise<ChatDocument> {
    const chat = await this.findChat(chatId, userId);
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.isChannel && chat.owner?.toString() !== userId) {
      throw new ForbiddenException('Only channel owner can pin messages');
    }
    chat.pinnedMessage = new Types.ObjectId(messageId) as any;
    await chat.save();
    return chat;
  }

  async unpinMessage(chatId: string, userId: string): Promise<ChatDocument> {
    const chat = await this.findChat(chatId, userId);
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.isChannel && chat.owner?.toString() !== userId) {
      throw new ForbiddenException('Only channel owner can unpin messages');
    }
    chat.pinnedMessage = null as any;
    await chat.save();
    return chat;
  }

  async updateChatAvatar(chatId: string, userId: string, filename: string): Promise<ChatDocument> {
    const chat = await this.chatModel.findById(chatId).exec();
    if (!chat) throw new NotFoundException('Chat not found');
    if (!chat.isGroup && !chat.isChannel) {
      throw new ForbiddenException('Cannot set avatar on a direct chat');
    }
    if (chat.owner?.toString() !== userId) {
      throw new ForbiddenException('Only the chat owner can update avatar');
    }

    if (!chat.avatars) chat.avatars = [];
    if (chat.avatar && !chat.avatars.includes(chat.avatar)) {
      chat.avatars.unshift(chat.avatar);
    }
    chat.avatars.unshift(filename);
    chat.avatars = Array.from(new Set(chat.avatars)).slice(0, 20);
    chat.avatar = filename;
    await chat.save();
    return chat;
  }

  async addAdmin(
    chatId: string,
    targetUserId: string,
    requesterId: string,
    permissions?: AdminPermissions,
    customTitle?: string,
  ): Promise<ChatDocument> {
    const chat = await this.chatModel.findById(chatId).exec();
    if (!chat) throw new NotFoundException('Chat not found');
    if (!chat.isGroup && !chat.isChannel) {
      throw new BadRequestException('Admins can only be added to groups or channels');
    }
    const isOwner = chat.owner?.toString() === requesterId;
    const requesterAdmin = chat.admins?.find((a: any) => a.userId?.toString() === requesterId);
    const canManage = isOwner || requesterAdmin?.permissions?.canManageAdmins;
    if (!canManage) {
      throw new ForbiddenException('Only owner or admins with canManageAdmins can appoint admins');
    }
    if (!chat.participants.some((p: any) => (p._id || p).toString() === targetUserId)) {
      throw new BadRequestException('User must be a member of the chat before becoming an admin');
    }
    chat.admins ??= [];
    const existingIndex = chat.admins.findIndex((a: any) => a.userId?.toString() === targetUserId);
    const adminRecord: ChatAdmin = {
      userId: new Types.ObjectId(targetUserId),
      customTitle: customTitle?.trim() || 'مدیر',
      permissions: {
        canChangeInfo: permissions?.canChangeInfo ?? true,
        canPostMessages: permissions?.canPostMessages ?? true,
        canEditMessages: permissions?.canEditMessages ?? false,
        canDeleteMessages: permissions?.canDeleteMessages ?? true,
        canInviteUsers: permissions?.canInviteUsers ?? true,
        canPinMessages: permissions?.canPinMessages ?? true,
        canManageAdmins: isOwner ? (permissions?.canManageAdmins ?? false) : false,
      },
      promotedBy: new Types.ObjectId(requesterId),
      promotedAt: new Date(),
    };
    if (existingIndex >= 0) {
      chat.admins[existingIndex] = adminRecord;
    } else {
      chat.admins.push(adminRecord);
    }
    await chat.save();
    return chat;
  }

  async removeAdmin(chatId: string, targetUserId: string, requesterId: string): Promise<ChatDocument> {
    const chat = await this.chatModel.findById(chatId).exec();
    if (!chat) throw new NotFoundException('Chat not found');
    const isOwner = chat.owner?.toString() === requesterId;
    const requesterAdmin = chat.admins?.find((a: any) => a.userId?.toString() === requesterId);
    const canManage = isOwner || requesterAdmin?.permissions?.canManageAdmins;
    if (!canManage) {
      throw new ForbiddenException('Only owner or admins with canManageAdmins can dismiss admins');
    }
    if (chat.owner?.toString() === targetUserId) {
      throw new BadRequestException('Cannot remove the chat owner');
    }
    chat.admins = (chat.admins || []).filter((a: any) => a.userId?.toString() !== targetUserId);
    await chat.save();
    return chat;
  }

  async getAdmins(chatId: string, requesterId: string): Promise<any[]> {
    const chat = await this.chatModel.findById(chatId).populate('participants', 'firstName lastName username profilePicture').exec();
    if (!chat) throw new NotFoundException('Chat not found');
    if (!chat.participants.some((p: any) => (p._id || p).toString() === requesterId)) {
      throw new ForbiddenException('You are not a participant of this chat');
    }
    return (chat.admins || []).map((admin: any) => {
      const user = (chat.participants as any[]).find((p: any) => p._id.toString() === admin.userId?.toString());
      return {
        userId: admin.userId?.toString(),
        user: user || null,
        customTitle: admin.customTitle || 'مدیر',
        permissions: admin.permissions || {},
        promotedBy: admin.promotedBy?.toString(),
        promotedAt: admin.promotedAt,
        isOwner: chat.owner?.toString() === admin.userId?.toString(),
      };
    });
  }

  async deleteChat(chatId: string, userId: string, deleteForBoth: boolean = false): Promise<void> {
    const chat = await this.chatModel.findById(chatId).exec();
    if (!chat) throw new NotFoundException('Chat not found');

    if (!chat.isGroup && !chat.isChannel) {
      if (!chat.participants.some((p: any) => (p._id || p).toString() === userId)) {
        throw new ForbiddenException('You are not a participant of this chat');
      }

      if (deleteForBoth) {
        if (this.messageModel) {
          await this.messageModel.deleteMany({ chat: chatId }).exec();
        }
        await this.chatModel.deleteOne({ _id: chatId }).exec();
      } else {
        chat.deletedFor ??= [];
        const userObjId = new Types.ObjectId(userId);
        if (!chat.deletedFor.some((id: any) => id.toString() === userId)) {
          chat.deletedFor.push(userObjId);
        }
        const remaining = chat.participants.filter((p: any) => !chat.deletedFor?.some((df: any) => df.toString() === (p._id || p).toString()));
        if (remaining.length === 0) {
          if (this.messageModel) {
            await this.messageModel.deleteMany({ chat: chatId }).exec();
          }
          await this.chatModel.deleteOne({ _id: chatId }).exec();
        } else {
          await chat.save();
        }
      }
      return;
    }

    if (!chat.participants.some((p: any) => (p._id || p).toString() === userId)) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    const isOwner = chat.owner?.toString() === userId;
    if (isOwner && deleteForBoth) {
      if (this.messageModel) {
        await this.messageModel.deleteMany({ chat: chatId }).exec();
      }
      await this.chatModel.deleteOne({ _id: chatId }).exec();
      return;
    }

    chat.participants = chat.participants.filter((p: any) => (p._id || p).toString() !== userId);
    chat.admins = (chat.admins || []).filter((a: any) => a.userId?.toString() !== userId);
    if (chat.unreadCounts) {
      chat.unreadCounts.delete(userId);
    }
    await chat.save();
  }
}
