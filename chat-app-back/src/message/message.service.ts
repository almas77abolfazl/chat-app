import { Injectable, NotFoundException, ForbiddenException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './entities/message.entity';
import { Chat, ChatDocument } from 'src/chat/entities/chat.entity';
import { ReactionService } from './reaction/reaction.service';
import { UserService } from 'src/user/user.service';
import { extractFirstUrl, fetchLinkPreview, LinkPreviewData } from 'src/helpers/link-preview.helper';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @Optional() private reactionService?: ReactionService,
    @Optional() private userService?: UserService,
  ) {}

  async findChatForMessage(chatId: string): Promise<ChatDocument> {
    const chat = await this.chatModel.findById(chatId).exec();
    if (!chat) throw new NotFoundException('Chat not found');
    return chat;
  }

  async saveMessageToChat(
    chatId: string,
    senderId: string,
    content: string,
    media?: { mediaType: string; fileUrl: string; fileName?: string; fileSize?: number; waveform?: number[] },
    forwardFrom?: { fromUserId?: string; fromSenderName?: string; originalChatId?: string },
    options?: { linkPreview?: LinkPreviewData; skipLinkPreview?: boolean; waveform?: number[] },
  ): Promise<any> {
    const chat = await this.findChatForMessage(chatId);
    const senderObjectId = new Types.ObjectId(senderId);

    if (!chat.participants.includes(senderObjectId)) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    if (chat.isChannel) {
      const isOwner = chat.owner?.toString() === senderId;
      const admin = chat.admins?.find((a: any) => a.userId?.toString() === senderId);
      const canPost = isOwner || (admin && admin.permissions?.canPostMessages !== false);
      if (!canPost) {
        throw new ForbiddenException('Only channel admins can post in this channel');
      }
    }

    const isDirect = !chat.isGroup && !chat.isChannel;
    const receiver = isDirect ? (chat.participants.find((p) => p.toString() !== senderId) ?? null) : null;

    if (isDirect && receiver && this.userService) {
      const isBlocked = await this.userService.isUserBlocked(senderId, receiver.toString());
      if (isBlocked) {
        throw new ForbiddenException('Cannot send message: one of the users has blocked the other');
      }
    }

    let linkPreview: LinkPreviewData | null | undefined = options?.linkPreview;
    if (!options?.skipLinkPreview && !linkPreview && !media && content) {
      const detectedUrl = extractFirstUrl(content);
      if (detectedUrl) {
        linkPreview = await fetchLinkPreview(detectedUrl);
      }
    }

    const message = await this.messageModel.create({
      sender: senderObjectId,
      receiver: receiver ?? undefined,
      chat: chat._id,
      content: content || '',
      read: false,
      mediaType: media?.mediaType || null,
      fileUrl: media?.fileUrl || null,
      fileName: media?.fileName || null,
      fileSize: media?.fileSize || null,
      forwardFrom: forwardFrom
        ? {
            fromUserId: forwardFrom.fromUserId ? new Types.ObjectId(forwardFrom.fromUserId) : undefined,
            fromSenderName: forwardFrom.fromSenderName,
            originalChatId: forwardFrom.originalChatId ? new Types.ObjectId(forwardFrom.originalChatId) : undefined,
          }
        : undefined,
      linkPreview: linkPreview || undefined,
      waveform: media?.waveform || options?.waveform || undefined,
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

  async editMessage(messageId: string, userId: string, newContent: string): Promise<any> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) throw new NotFoundException('Message not found');
    let canEdit = message.sender.toString() === userId;
    if (!canEdit && message.chat) {
      const chatQuery = this.chatModel.findById(message.chat);
      const chat = chatQuery?.exec ? await chatQuery.exec() : await chatQuery;
      if (chat && chat.isChannel) {
        const isOwner = chat.owner?.toString() === userId;
        const admin = chat.admins?.find((a: any) => a.userId?.toString() === userId);
        if (isOwner || admin?.permissions?.canEditMessages) {
          canEdit = true;
        }
      }
    }
    if (!canEdit) {
      throw new ForbiddenException('You can only edit your own messages');
    }
    if (message.isDeleted) {
      throw new ForbiddenException('Cannot edit a deleted message');
    }
    message.content = newContent.trim();
    message.editedAt = new Date();
    await message.save();

    const populated = await this.messageModel.findById(message._id).populate('sender', 'firstName lastName profilePicture').exec();
    return this.hydrateMessage(populated);
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) throw new NotFoundException('Message not found');
    let canDelete = message.sender.toString() === userId;
    if (!canDelete && message.chat) {
      const chatQuery = this.chatModel.findById(message.chat);
      const chat = chatQuery?.exec ? await chatQuery.exec() : await chatQuery;
      if (chat && (chat.isGroup || chat.isChannel)) {
        const isOwner = chat.owner?.toString() === userId;
        const admin = chat.admins?.find((a: any) => a.userId?.toString() === userId);
        if (isOwner || admin?.permissions?.canDeleteMessages) {
          canDelete = true;
        }
      }
    }
    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this message');
    }
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = 'این پیام حذف شد';
    await message.save();
  }

  async deleteMessagesBulk(messageIds: string[], userId: string): Promise<{ deletedIds: string[] }> {
    const deletedIds: string[] = [];
    for (const id of messageIds) {
      try {
        await this.deleteMessage(id, userId);
        deletedIds.push(id);
      } catch {
        // Skip messages user doesn't have permission to delete
      }
    }
    return { deletedIds };
  }

  async forwardMessages(messageIds: string[], targetChatId: string, senderId: string): Promise<any[]> {
    const targetChat = await this.findChatForMessage(targetChatId);
    if (!targetChat.participants.some((p) => p.toString() === senderId)) {
      throw new ForbiddenException('You are not a participant of the target chat');
    }

    const messages = await this.messageModel
      .find({ _id: { $in: messageIds.map((id) => new Types.ObjectId(id)) } })
      .populate('sender', 'firstName lastName')
      .sort({ createdAt: 1 })
      .exec();

    const createdMessages: any[] = [];
    for (const msg of messages) {
      if (msg.isDeleted) continue;
      const originalSender = msg.sender as any;
      const originalSenderName = originalSender ? `${originalSender.firstName ?? ''} ${originalSender.lastName ?? ''}`.trim() || 'کاربر' : 'کاربر';

      const forwardFromData = {
        fromUserId: msg.forwardFrom?.fromUserId ? msg.forwardFrom.fromUserId.toString() : originalSender?._id?.toString(),
        fromSenderName: msg.forwardFrom?.fromSenderName || originalSenderName,
        originalChatId: msg.chat ? msg.chat.toString() : undefined,
      };

      const media = msg.mediaType
        ? {
            mediaType: msg.mediaType,
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            fileSize: msg.fileSize,
          }
        : undefined;

      const newMsg = await this.saveMessageToChat(targetChatId, senderId, msg.content, media, forwardFromData);
      createdMessages.push(newMsg);
    }

    return createdMessages;
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

    let reactionMap: Record<string, { emoji: string; count: number; users: string[] }[]> = {};
    if (this.reactionService && messages.length > 0) {
      try {
        const messageIds = messages.map((m) => m._id.toString());
        reactionMap = await this.reactionService.getReactionCountsForMessages(messageIds);
      } catch {
        reactionMap = {};
      }
    }

    await this.messageModel
      .updateMany({ chat: new Types.ObjectId(chatId), sender: { $ne: new Types.ObjectId(userId) }, read: false }, { $set: { read: true } })
      .exec();

    await this.chatModel
      .updateOne({ _id: new Types.ObjectId(chatId), participants: new Types.ObjectId(userId) }, { $set: { [`unreadCounts.${userId}`]: 0 } })
      .exec();

    return {
      messages: messages.map((m) => this.hydrateMessage(m, reactionMap[m._id.toString()] ?? [])),
      totalMessages,
      currentPage: page,
      totalPages: Math.ceil(totalMessages / limit),
    };
  }

  async getChatMediaSummary(
    chatId: string,
    userId: string,
  ): Promise<{
    photosCount: number;
    videosCount: number;
    filesCount: number;
    voiceCount: number;
  }> {
    const chat = await this.findChatForMessage(chatId);
    if (!chat.participants.some((p) => p.toString() === userId)) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    const [photosCount, videosCount, filesCount, voiceCount] = await Promise.all([
      this.messageModel.countDocuments({
        chat: new Types.ObjectId(chatId),
        mediaType: { $in: ['image', 'gif'] },
        isDeleted: { $ne: true },
      }),
      this.messageModel.countDocuments({
        chat: new Types.ObjectId(chatId),
        mediaType: 'video',
        isDeleted: { $ne: true },
      }),
      this.messageModel.countDocuments({
        chat: new Types.ObjectId(chatId),
        mediaType: 'file',
        isDeleted: { $ne: true },
      }),
      this.messageModel.countDocuments({
        chat: new Types.ObjectId(chatId),
        mediaType: 'voice',
        isDeleted: { $ne: true },
      }),
    ]);

    return { photosCount, videosCount, filesCount, voiceCount };
  }

  async getChatMedia(
    chatId: string,
    userId: string,
    type: string = 'media',
    page: number = 1,
    limit: number = 30,
  ): Promise<{ items: any[]; total: number; page: number; totalPages: number }> {
    const chat = await this.findChatForMessage(chatId);
    if (!chat.participants.some((p) => p.toString() === userId)) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    const filter: any = { chat: new Types.ObjectId(chatId), isDeleted: { $ne: true } };
    if (type === 'media' || type === 'photo' || type === 'photos') {
      filter.mediaType = { $in: ['image', 'gif', 'video'] };
    } else if (type === 'file' || type === 'files') {
      filter.mediaType = 'file';
    } else if (type === 'voice') {
      filter.mediaType = 'voice';
    } else if (type !== 'all') {
      filter.mediaType = type;
    } else {
      filter.mediaType = { $ne: null };
    }

    const skip = (Math.max(1, page) - 1) * limit;
    const [items, total] = await Promise.all([
      this.messageModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('sender', 'firstName lastName profilePicture').exec(),
      this.messageModel.countDocuments(filter),
    ]);

    return {
      items: items.map((m) => this.hydrateMessage(m)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  hydrateMessage(message: any, reactions?: any[]): any {
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
      editedAt: message.editedAt,
      deletedAt: message.deletedAt,
      isDeleted: message.isDeleted,
      mediaType: message.mediaType,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      forwardFrom: message.forwardFrom
        ? {
            fromUserId: message.forwardFrom.fromUserId?.toString(),
            fromSenderName: message.forwardFrom.fromSenderName,
            originalChatId: message.forwardFrom.originalChatId?.toString(),
          }
        : null,
      linkPreview: message.linkPreview
        ? {
            url: message.linkPreview.url,
            title: message.linkPreview.title,
            description: message.linkPreview.description,
            image: message.linkPreview.image,
            siteName: message.linkPreview.siteName,
          }
        : null,
      waveform: message.waveform || null,
      reactions: reactions ?? message.reactions ?? [],
    };
  }
}
