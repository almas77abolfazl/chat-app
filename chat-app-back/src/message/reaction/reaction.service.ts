import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reaction, ReactionDocument } from './reaction.entity';
import { Message, MessageDocument } from '../entities/message.entity';

@Injectable()
export class ReactionService {
  constructor(
    @InjectModel(Reaction.name) private reactionModel: Model<ReactionDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async addReaction(messageId: string, userId: string, emoji: string): Promise<ReactionDocument> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Remove existing reaction from this user on this message (toggle behavior)
    await this.reactionModel.deleteOne({ messageId, userId }).exec();

    const reaction = new this.reactionModel({
      messageId,
      userId,
      emoji,
    });
    return reaction.save();
  }

  async removeReaction(messageId: string, userId: string): Promise<void> {
    await this.reactionModel.deleteOne({ messageId, userId }).exec();
  }

  async getReactions(messageId: string): Promise<ReactionDocument[]> {
    return this.reactionModel.find({ messageId }).populate('userId', 'firstName lastName profilePicture').exec();
  }

  async getReactionCounts(messageId: string): Promise<{ emoji: string; count: number; users: string[] }[]> {
    const reactions = await this.reactionModel.find({ messageId }).populate('userId', 'firstName lastName profilePicture _id').exec();

    const groups: Record<string, { count: number; users: string[] }> = {};

    for (const reaction of reactions) {
      const emoji = reaction.emoji;
      const user = reaction.userId as any;
      if (!groups[emoji]) {
        groups[emoji] = { count: 0, users: [] };
      }
      groups[emoji].count++;
      groups[emoji].users.push(user._id.toString());
    }

    return Object.entries(groups).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      users: data.users,
    }));
  }

  async getReactionCountsForMessages(messageIds: string[]): Promise<Record<string, { emoji: string; count: number; users: string[] }[]>> {
    if (!messageIds.length) return {};
    const messageObjectIds = messageIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    if (!messageObjectIds.length) return {};
    const reactions = await this.reactionModel
      .find({ messageId: { $in: messageObjectIds } })
      .populate('userId', '_id')
      .exec();

    const result: Record<string, Record<string, { count: number; users: string[] }>> = {};
    for (const reaction of reactions) {
      const msgId = reaction.messageId.toString();
      const emoji = reaction.emoji;
      const user = reaction.userId as any;
      const userIdStr = user?._id ? user._id.toString() : user?.toString();

      if (!result[msgId]) {
        result[msgId] = {};
      }
      if (!result[msgId][emoji]) {
        result[msgId][emoji] = { count: 0, users: [] };
      }
      result[msgId][emoji].count++;
      if (userIdStr && !result[msgId][emoji].users.includes(userIdStr)) {
        result[msgId][emoji].users.push(userIdStr);
      }
    }

    const formatted: Record<string, { emoji: string; count: number; users: string[] }[]> = {};
    for (const [msgId, emojiMap] of Object.entries(result)) {
      formatted[msgId] = Object.entries(emojiMap).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        users: data.users,
      }));
    }
    return formatted;
  }
}
