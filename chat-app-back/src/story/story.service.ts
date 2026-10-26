import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Story, StoryDocument } from './entities/story.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { CreateStoryDto } from './dto/create-story.dto';

@Injectable()
export class StoryService {
  constructor(
    @InjectModel(Story.name) private storyModel: Model<StoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createStory(userId: string, dto: CreateStoryDto, filename?: string): Promise<StoryDocument> {
    const mediaUrl = filename ? `/uploads/stories/${filename}` : dto.mediaUrl;
    if (!mediaUrl && dto.mediaType !== 'text') {
      throw new BadRequestException('mediaUrl or uploaded file is required for stories');
    }

    const story = new this.storyModel({
      user: new Types.ObjectId(userId),
      mediaUrl: mediaUrl || '',
      mediaType: dto.mediaType || (filename ? 'image' : 'text'),
      caption: dto.caption?.trim() || '',
      backgroundColor: dto.backgroundColor || null,
      views: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return story.save();
  }

  async getActiveStories(currentUserId: string): Promise<any[]> {
    const now = new Date();

    // Only allow stories from the current user and their saved contacts
    const currentUser = await this.userModel.findById(currentUserId).select('contacts').exec();
    const contactIds: Types.ObjectId[] = [];
    if (currentUser?.contacts && Array.isArray(currentUser.contacts)) {
      for (const c of currentUser.contacts) {
        const rawId = ((c as any)?._id || c)?.toString();
        if (rawId && Types.ObjectId.isValid(rawId)) {
          contactIds.push(new Types.ObjectId(rawId));
        }
      }
    }
    const currentObjId = Types.ObjectId.isValid(currentUserId) ? new Types.ObjectId(currentUserId) : currentUserId;
    const allowedUserIds = [currentObjId, ...contactIds];

    const activeStories = await this.storyModel
      .find({
        expiresAt: { $gt: now },
        user: { $in: allowedUserIds },
      })
      .populate('user', 'firstName lastName username profilePicture isOnline')
      .sort({ createdAt: 1 })
      .exec();

    // Group stories by user
    const userGroupsMap = new Map<string, { user: any; stories: any[]; hasUnviewed: boolean; latestStoryAt: Date }>();

    for (const s of activeStories) {
      if (!s.user) continue;
      const u = s.user as any;
      const uid = (u._id || u).toString();
      const isViewed = (s.views || []).some((v: any) => (v.user?._id || v.user)?.toString() === currentUserId);

      const storyItem = {
        _id: s._id.toString(),
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        caption: s.caption,
        backgroundColor: s.backgroundColor,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        viewsCount: (s.views || []).length,
        isViewed,
      };

      if (!userGroupsMap.has(uid)) {
        userGroupsMap.set(uid, {
          user: {
            _id: uid,
            firstName: u.firstName,
            lastName: u.lastName,
            username: u.username,
            profilePicture: u.profilePicture,
            isOnline: u.isOnline,
          },
          stories: [storyItem],
          hasUnviewed: !isViewed && uid !== currentUserId,
          latestStoryAt: s.createdAt,
        });
      } else {
        const group = userGroupsMap.get(uid)!;
        group.stories.push(storyItem);
        if (!isViewed && uid !== currentUserId) {
          group.hasUnviewed = true;
        }
        if (s.createdAt > group.latestStoryAt) {
          group.latestStoryAt = s.createdAt;
        }
      }
    }

    const groups = Array.from(userGroupsMap.entries()).map(([userId, val]) => ({
      userId,
      isCurrentUser: userId === currentUserId,
      ...val,
    }));

    // Sorting:
    // 1. Current user's stories first
    // 2. Users with unviewed stories
    // 3. Users with all viewed stories
    groups.sort((a, b) => {
      if (a.isCurrentUser) return -1;
      if (b.isCurrentUser) return 1;
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return b.latestStoryAt.getTime() - a.latestStoryAt.getTime();
    });

    return groups;
  }

  async viewStory(storyId: string, userId: string): Promise<{ success: boolean }> {
    const story = await this.storyModel.findById(storyId).exec();
    if (!story) throw new NotFoundException('Story not found');

    const userObjId = new Types.ObjectId(userId);
    const alreadyViewed = (story.views || []).some((v: any) => (v.user?._id || v.user)?.toString() === userId);
    if (!alreadyViewed) {
      story.views ??= [];
      story.views.push({ user: userObjId, viewedAt: new Date() });
      await story.save();
    }
    return { success: true };
  }

  async deleteStory(storyId: string, userId: string): Promise<{ success: boolean }> {
    const story = await this.storyModel.findById(storyId).exec();
    if (!story) throw new NotFoundException('Story not found');
    if (story.user.toString() !== userId) {
      throw new ForbiddenException('Only the author can delete this story');
    }
    await this.storyModel.deleteOne({ _id: storyId }).exec();
    return { success: true };
  }

  async getStoryViewers(storyId: string, userId: string): Promise<any[]> {
    const story = await this.storyModel.findById(storyId).populate('views.user', 'firstName lastName username profilePicture').exec();
    if (!story) throw new NotFoundException('Story not found');
    if (story.user.toString() !== userId) {
      throw new ForbiddenException('Only the author can view story viewers');
    }
    return (story.views || []).map((v: any) => ({
      user: v.user,
      viewedAt: v.viewedAt,
    }));
  }
}
