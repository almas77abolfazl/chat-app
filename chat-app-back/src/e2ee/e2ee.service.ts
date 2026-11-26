import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import { Chat, ChatDocument } from '../chat/entities/chat.entity';

@Injectable()
export class E2eeService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  async publishPublicKey(userId: string, publicKey: string): Promise<{ success: boolean }> {
    if (!publicKey || typeof publicKey !== 'string') {
      throw new BadRequestException('Invalid public key');
    }
    await this.userModel.findByIdAndUpdate(userId, { $set: { e2eePublicKey: publicKey } }).exec();
    return { success: true };
  }

  async getPublicKey(userId: string): Promise<{ userId: string; publicKey: string | null }> {
    const user = await this.userModel.findById(userId).select('e2eePublicKey').exec();
    if (!user) throw new NotFoundException('User not found');
    return { userId, publicKey: (user as any).e2eePublicKey || null };
  }

  async createOrGetSecretChat(requesterId: string, targetUserId: string, selfDestructSeconds = 0): Promise<any> {
    if (!targetUserId || requesterId === targetUserId) {
      throw new BadRequestException('Invalid target user for secret chat');
    }
    const reqObjId = new Types.ObjectId(requesterId);
    const targetObjId = new Types.ObjectId(targetUserId);

    const targetUser = await this.userModel.findById(targetObjId).select('firstName lastName profilePicture e2eePublicKey').exec();
    if (!targetUser) throw new NotFoundException('Target user not found');

    let chat = await this.chatModel
      .findOne({
        isGroup: false,
        isChannel: false,
        isSecret: true,
        participants: { $all: [reqObjId, targetObjId], $size: 2 },
      })
      .exec();

    if (!chat) {
      chat = await this.chatModel.create({
        participants: [reqObjId, targetObjId],
        isGroup: false,
        isChannel: false,
        isSecret: true,
        selfDestructSeconds: Math.max(0, Number(selfDestructSeconds) || 0),
        messages: [],
        unreadCounts: { [requesterId]: 0, [targetUserId]: 0 },
      });
    }

    return {
      chatId: chat._id.toString(),
      isSecret: true,
      selfDestructSeconds: chat.selfDestructSeconds || 0,
      otherParticipant: {
        _id: targetUser._id.toString(),
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        profilePicture: targetUser.profilePicture,
        e2eePublicKey: (targetUser as any).e2eePublicKey || null,
      },
    };
  }

  async updateSelfDestructTimer(chatId: string, userId: string, seconds: number): Promise<{ chatId: string; selfDestructSeconds: number }> {
    const chat = await this.chatModel.findById(chatId).exec();
    if (!chat) throw new NotFoundException('Chat not found');
    if (!chat.participants.some((p) => p.toString() === userId)) {
      throw new ForbiddenException('You are not a member of this chat');
    }
    if (!chat.isSecret) {
      throw new BadRequestException('Self-destruct timer is only available in secret chats');
    }
    chat.selfDestructSeconds = Math.max(0, Number(seconds) || 0);
    await chat.save();
    return { chatId, selfDestructSeconds: chat.selfDestructSeconds };
  }
}
