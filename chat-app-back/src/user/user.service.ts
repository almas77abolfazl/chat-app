import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { Model, Types } from 'mongoose';
import { IUser, UserPrivacy } from './interfaces/user.interface';
import { UpdateUserNamesDto } from './dto/update-user-names.dto';
import * as fs from 'fs';
import { join } from 'path';
import { resizeAvatar } from 'src/helpers/avatar-resize';
import { normalizePhoneNumber, getPhoneLookupCandidates } from 'src/helpers/phone-normalizer';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async createUser(phoneNumber: string): Promise<User> {
    const canonicalPhone = normalizePhoneNumber(phoneNumber);
    const doesUserExist = await this.doesUserExist(canonicalPhone);
    if (doesUserExist) return null;
    const createdUser = new this.userModel({ phoneNumber: canonicalPhone });
    return await createdUser.save();
  }

  async findUserByPhoneNumber(phoneNumber: string): Promise<IUser | null> {
    const candidates = getPhoneLookupCandidates(phoneNumber);
    return this.userModel.findOne({ phoneNumber: { $in: candidates } }).exec();
  }

  async updateUserNames(dto: UpdateUserNamesDto, userId: string): Promise<IUser | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    user.lastName = dto.lastName;
    user.firstName = dto.firstName;
    if (dto.bio !== undefined) {
      user.bio = dto.bio;
    }
    await user.save();
    return user;
  }

  async findById(id: string): Promise<IUser | undefined> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, user: any) {
    if (user && typeof user.save === 'function') {
      user.markModified?.('sessions');
      return await user.save();
    }
    const updatedUser = await this.userModel.findByIdAndUpdate(id, { $set: user }, { new: true }).exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updatedUser;
  }

  async findUsersByQuery(query: string, userId: string, limit = 20) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');
    const users = await this.userModel
      .find({
        $or: [{ username: { $regex: searchRegex } }, { firstName: { $regex: searchRegex } }, { lastName: { $regex: searchRegex } }],
        $and: [{ _id: { $ne: userId } }],
      })
      .select('firstName lastName username status _id profilePicture avatars isOnline lastSeen')
      .limit(limit)
      .exec();
    return users;
  }

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<IUser | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;
    user.isOnline = isOnline;
    if (!isOnline) {
      user.lastSeen = new Date();
    }
    await user.save();
    return user;
  }

  async getUserStatus(
    userId: string,
    requesterId?: string,
  ): Promise<{ userId: string; isOnline: boolean; lastSeen?: Date | null; privacyStatus?: 'recently' | 'a_long_time_ago' | null } | null> {
    const user = await this.userModel.findById(userId).select('isOnline lastSeen _id blockedUsers privacy contacts').exec();
    if (!user) return null;

    if (requesterId && requesterId !== userId) {
      const isBlocked = (user.blockedUsers || []).some((id: any) => id.toString() === requesterId);
      if (isBlocked) {
        return {
          userId: user._id.toString(),
          isOnline: false,
          lastSeen: null,
          privacyStatus: 'a_long_time_ago',
        };
      }

      const lastSeenRule = user.privacy?.lastSeen || 'everybody';
      if (lastSeenRule === 'nobody') {
        return {
          userId: user._id.toString(),
          isOnline: false,
          lastSeen: null,
          privacyStatus: 'recently',
        };
      }
      if (lastSeenRule === 'contacts') {
        const isContact = (user.contacts || []).some((c: any) => c.toString() === requesterId);
        if (!isContact) {
          return {
            userId: user._id.toString(),
            isOnline: false,
            lastSeen: null,
            privacyStatus: 'recently',
          };
        }
      }
    }

    return {
      userId: user._id.toString(),
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      privacyStatus: null,
    };
  }

  async findUserByRefreshToken(refreshToken: string): Promise<IUser | null> {
    if (!refreshToken || typeof refreshToken !== 'string') return null;
    const user = await this.userModel.findOne({ 'sessions.token': refreshToken }).exec();
    return user ?? null;
  }

  async updateProfilePicture(userId: string, filename: string): Promise<User> {
    const logger = new Logger(UserService.name);
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const inputPath = join('./uploads/avatars', filename);
    const avatarPath = `./uploads/avatars/${filename}`;
    let targetFilename = filename;

    if (fs.existsSync(inputPath)) {
      try {
        const resizedFilename = `resized_${filename}`;
        const outputPath = join('./uploads/avatars', resizedFilename);
        await resizeAvatar(inputPath, outputPath);
        if (fs.existsSync(outputPath)) {
          try {
            fs.unlinkSync(avatarPath);
          } catch {}
          targetFilename = resizedFilename;
        } else {
          logger.warn('Avatar resize failed, using original');
          targetFilename = filename;
        }
      } catch (error) {
        logger.warn(`Avatar resize failed: ${error?.message}, using original`);
        targetFilename = filename;
      }
    }

    user.profilePicture = targetFilename;
    user.avatars = user.avatars || [];
    if (!user.avatars.includes(targetFilename)) {
      user.avatars.unshift(targetFilename);
    }
    if (user.avatars.length > 20) {
      const removed = user.avatars.slice(20);
      user.avatars = user.avatars.slice(0, 20);
      for (const oldFile of removed) {
        const oldPath = `./uploads/avatars/${oldFile}`;
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch {}
        }
      }
    }

    await user.save();
    return user;
  }

  async getUserProfile(userId: string, requesterId?: string): Promise<any> {
    const user = await this.userModel
      .findById(userId)
      .select(
        'firstName lastName username phoneNumber bio profilePicture avatars status isOnline lastSeen createdAt phoneKnownContacts phoneSharedWith contacts blockedUsers privacy',
      )
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let isBlockedByTarget = false;
    let privacyStatus: 'recently' | 'a_long_time_ago' | null = null;
    let isOnline = user.isOnline;
    let lastSeen: Date | null = user.lastSeen || null;
    let profilePicture: string | null = user.profilePicture || null;
    let avatars: string[] = [...(user.avatars || [])];
    if (profilePicture) {
      avatars = [profilePicture, ...avatars.filter((a) => a !== profilePicture)];
    }

    let canSeePhone = false;
    let isContact = false;
    let customFirstName: string | null = null;
    let customLastName: string | null = null;

    if (requesterId) {
      if (requesterId === userId) {
        canSeePhone = true;
      } else {
        isBlockedByTarget = (user.blockedUsers || []).some((b: any) => b.toString() === requesterId);
        if (isBlockedByTarget) {
          isOnline = false;
          lastSeen = null;
          privacyStatus = 'a_long_time_ago';
          profilePicture = null;
          avatars = [];
        } else {
          const requester = await this.userModel.findById(requesterId).select('contacts contactDetails phoneKnownContacts phoneSharedWith').exec();
          if (requester) {
            isContact = (requester.contacts || []).some((c: any) => c.toString() === userId);
            const customDetail = (requester.contactDetails || []).find((d: any) => d.userId?.toString() === userId);
            if (customDetail) {
              if (customDetail.firstName !== undefined) {
                customFirstName = customDetail.firstName;
              }
              if (customDetail.lastName !== undefined) {
                customLastName = customDetail.lastName;
              }
            }
            const isTargetContact = (user.contacts || []).some((c: any) => c.toString() === requesterId);
            const requesterKnewPhone = (requester.phoneKnownContacts || []).some((c: any) => c.toString() === userId);
            const targetSharedWithRequester = (user.phoneSharedWith || []).some((c: any) => c.toString() === requesterId);
            const targetKnewRequesterPhone = (user.phoneKnownContacts || []).some((c: any) => c.toString() === requesterId);
            canSeePhone = requesterKnewPhone || targetSharedWithRequester || targetKnewRequesterPhone;

            const photoRule = user.privacy?.profilePhoto || 'everybody';
            if (photoRule === 'nobody' || (photoRule === 'contacts' && !isTargetContact)) {
              profilePicture = null;
              avatars = [];
            }

            const lastSeenRule = user.privacy?.lastSeen || 'everybody';
            if (lastSeenRule === 'nobody' || (lastSeenRule === 'contacts' && !isTargetContact)) {
              isOnline = false;
              lastSeen = null;
              privacyStatus = 'recently';
            }
          }
        }
      }
    }

    return {
      _id: user._id,
      firstName: customFirstName !== null ? customFirstName : user.firstName,
      lastName: customLastName !== null ? customLastName : user.lastName,
      originalFirstName: user.firstName,
      originalLastName: user.lastName,
      username: user.username,
      phoneNumber: canSeePhone ? user.phoneNumber : null,
      bio: user.bio,
      profilePicture,
      avatars,
      status: user.status,
      isOnline,
      lastSeen,
      privacyStatus,
      isBlocked: isBlockedByTarget,
      createdAt: user.createdAt,
      isContact,
    };
  }

  async getUserAvatars(userId: string, requesterId?: string): Promise<string[]> {
    const user = await this.userModel.findById(userId).select('avatars profilePicture blockedUsers privacy contacts').exec();
    if (!user) return [];
    if (requesterId && requesterId !== userId) {
      const isBlocked = (user.blockedUsers || []).some((b: any) => b.toString() === requesterId);
      if (isBlocked) return [];
      const photoRule = user.privacy?.profilePhoto || 'everybody';
      const isContact = (user.contacts || []).some((c: any) => c.toString() === requesterId);
      if (photoRule === 'nobody' || (photoRule === 'contacts' && !isContact)) return [];
    }
    const list = [...(user.avatars || [])];
    if (user.profilePicture && !list.includes(user.profilePicture)) {
      list.unshift(user.profilePicture);
    }
    return list;
  }

  async deleteAvatar(userId: string, filename: string): Promise<string[]> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    user.avatars = (user.avatars || []).filter((f) => f !== filename);
    if (user.profilePicture === filename) {
      user.profilePicture = (user.avatars[0] || null) as any;
    }
    await user.save();

    const filePath = `./uploads/avatars/${filename}`;
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    }

    return user.avatars;
  }

  async getUserAvatar(userId: string, requesterId?: string): Promise<string | null> {
    const user = await this.userModel.findById(userId).select('profilePicture blockedUsers privacy contacts').exec();
    if (!user || !user.profilePicture) {
      return null;
    }
    if (requesterId && requesterId !== userId) {
      const isBlocked = (user.blockedUsers || []).some((b: any) => b.toString() === requesterId);
      if (isBlocked) return null;
      const photoRule = user.privacy?.profilePhoto || 'everybody';
      const isContact = (user.contacts || []).some((c: any) => c.toString() === requesterId);
      if (photoRule === 'nobody' || (photoRule === 'contacts' && !isContact)) return null;
    }
    const path = `./uploads/avatars/${user.profilePicture}`;
    if (!fs.existsSync(path)) {
      return null;
    }
    return fs.readFileSync(path).toString('base64');
  }

  async getContacts(userId: string): Promise<IUser[]> {
    const user = await this.userModel
      .findById(userId)
      .populate(
        'contacts',
        'firstName lastName username profilePicture avatars status isOnline lastSeen phoneNumber phoneSharedWith phoneKnownContacts',
      )
      .exec();
    if (!user) return [];
    const knownSet = new Set(((user as any).phoneKnownContacts || []).map((id: any) => id.toString()));
    const customDetailsMap = new Map<string, { firstName?: string; lastName?: string }>();
    if (user.contactDetails && Array.isArray(user.contactDetails)) {
      for (const d of user.contactDetails) {
        if (d?.userId) {
          customDetailsMap.set(d.userId.toString(), {
            firstName: d.firstName,
            lastName: d.lastName,
          });
        }
      }
    }

    return (user.contacts as any[]).map((contact: any) => {
      const contactObj = contact.toObject ? contact.toObject() : { ...contact };
      const contactId = (contactObj._id || contactObj).toString();
      const userKnewPhone = knownSet.has(contactId);
      const contactSharedPhone = (contactObj.phoneSharedWith || []).some((id: any) => id.toString() === userId);
      const contactKnewPhone = (contactObj.phoneKnownContacts || []).some((id: any) => id.toString() === userId);
      const canSeePhone = userKnewPhone || contactSharedPhone || contactKnewPhone;

      const customName = customDetailsMap.get(contactId);
      const firstName = customName && customName.firstName !== undefined ? customName.firstName : contactObj.firstName;
      const lastName = customName && customName.lastName !== undefined ? customName.lastName : contactObj.lastName;

      return {
        ...contactObj,
        firstName,
        lastName,
        originalFirstName: contactObj.firstName,
        originalLastName: contactObj.lastName,
        phoneNumber: canSeePhone ? contactObj.phoneNumber : null,
      };
    });
  }

  async addContact(userId: string, contactId: string, firstName?: string, lastName?: string): Promise<IUser> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.contacts ??= [];
    user.contactDetails ??= [];

    if (!user.contacts.some((id: any) => id.toString() === contactId)) {
      user.contacts.push(new Types.ObjectId(contactId) as any);
    }

    const contactObjId = new Types.ObjectId(contactId);
    const existingDetailIdx = user.contactDetails.findIndex((d) => d.userId.toString() === contactId);
    const detailObj = {
      userId: contactObjId,
      firstName: firstName?.trim() ?? '',
      lastName: lastName?.trim() ?? '',
    };
    if (existingDetailIdx !== -1) {
      user.contactDetails[existingDetailIdx] = detailObj;
    } else {
      user.contactDetails.push(detailObj);
    }

    await user.save();
    return user;
  }

  async addContactByPhone(userId: string, rawPhone: string, firstName?: string, lastName?: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    const candidates = getPhoneLookupCandidates(rawPhone);
    const targetUser = await this.userModel.findOne({ phoneNumber: { $in: candidates } }).exec();
    if (!targetUser) {
      throw new NotFoundException('کاربری با این شماره تلفن در برنامه ثبت‌نام نکرده است');
    }
    if (targetUser._id.toString() === userId) {
      throw new BadRequestException('نمی‌توانید خودتان را به عنوان مخاطب اضافه کنید');
    }

    user.contacts ??= [];
    user.contactDetails ??= [];
    user.phoneKnownContacts ??= [];
    targetUser.phoneSharedWith ??= [];

    const targetObjId = new Types.ObjectId(targetUser._id.toString());
    const userObjId = new Types.ObjectId(userId);

    let userChanged = false;
    let targetChanged = false;

    if (!user.contacts.some((id: any) => id.toString() === targetUser._id.toString())) {
      user.contacts.push(targetObjId as any);
      userChanged = true;
    }

    const existingDetailIdx = user.contactDetails.findIndex((d) => d.userId.toString() === targetUser._id.toString());
    const detailObj = {
      userId: targetObjId,
      firstName: firstName?.trim() ?? '',
      lastName: lastName?.trim() ?? '',
    };
    if (existingDetailIdx !== -1) {
      user.contactDetails[existingDetailIdx] = detailObj;
      userChanged = true;
    } else {
      user.contactDetails.push(detailObj);
      userChanged = true;
    }

    if (!user.phoneKnownContacts.some((id: any) => id.toString() === targetUser._id.toString())) {
      user.phoneKnownContacts.push(targetObjId as any);
      userChanged = true;
    }
    if (!targetUser.phoneSharedWith.some((id: any) => id.toString() === userId)) {
      targetUser.phoneSharedWith.push(userObjId as any);
      targetChanged = true;
    }

    if (userChanged) await user.save();
    if (targetChanged) await targetUser.save();

    return {
      _id: targetUser._id.toString(),
      firstName: firstName?.trim() || targetUser.firstName || '',
      lastName: lastName?.trim() || targetUser.lastName || '',
      username: targetUser.username,
      profilePicture: targetUser.profilePicture,
      avatars: targetUser.avatars || [],
      phoneNumber: targetUser.phoneNumber,
      status: targetUser.status,
      isOnline: targetUser.isOnline,
      lastSeen: targetUser.lastSeen,
    };
  }

  async removeContact(userId: string, contactId: string): Promise<IUser> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.contacts = user.contacts.filter((id) => id.toString() !== contactId);
    if (user.contactDetails) {
      user.contactDetails = user.contactDetails.filter((d) => d.userId.toString() !== contactId);
    }
    if (user.phoneKnownContacts) {
      user.phoneKnownContacts = user.phoneKnownContacts.filter((id: any) => id.toString() !== contactId);
    }
    await user.save();
    return user;
  }

  async getNotificationSettings(userId: string): Promise<{ enabled: boolean }> {
    const user = await this.userModel.findById(userId).select('notifications').exec();
    if (!user) throw new NotFoundException('User not found');
    return { enabled: user.notifications ?? true };
  }

  async updateNotificationSettings(userId: string, enabled: boolean): Promise<{ enabled: boolean }> {
    const user = await this.userModel.findByIdAndUpdate(userId, { notifications: enabled }, { new: true }).select('notifications').exec();
    if (!user) throw new NotFoundException('User not found');
    return { enabled: user.notifications };
  }

  async blockUser(userId: string, targetId: string): Promise<{ success: boolean }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    const targetObjId = new Types.ObjectId(targetId);
    user.blockedUsers ??= [];
    if (!user.blockedUsers.some((id: any) => id.toString() === targetId)) {
      user.blockedUsers.push(targetObjId);
      await user.save();
    }
    return { success: true };
  }

  async unblockUser(userId: string, targetId: string): Promise<{ success: boolean }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    user.blockedUsers = (user.blockedUsers || []).filter((id: any) => id.toString() !== targetId);
    await user.save();
    return { success: true };
  }

  async getBlockedUsers(userId: string): Promise<any[]> {
    const user = await this.userModel
      .findById(userId)
      .populate('blockedUsers', 'firstName lastName username profilePicture avatars status isOnline lastSeen phoneNumber')
      .exec();
    if (!user) return [];
    return user.blockedUsers || [];
  }

  async isUserBlocked(userA: string, userB: string): Promise<boolean> {
    const user = await this.userModel.findById(userA).select('blockedUsers').exec();
    if (user?.blockedUsers?.some((id: any) => id.toString() === userB)) {
      return true;
    }
    const other = await this.userModel.findById(userB).select('blockedUsers').exec();
    return !!other?.blockedUsers?.some((id: any) => id.toString() === userA);
  }

  async getPrivacySettings(userId: string): Promise<UserPrivacy> {
    const user = await this.userModel.findById(userId).select('privacy').exec();
    if (!user) throw new NotFoundException('User not found');
    return user.privacy || { lastSeen: 'everybody', profilePhoto: 'everybody' };
  }

  async updatePrivacySettings(userId: string, privacy: Partial<UserPrivacy>): Promise<UserPrivacy> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    user.privacy = {
      lastSeen: privacy.lastSeen ?? user.privacy?.lastSeen ?? 'everybody',
      profilePhoto: privacy.profilePhoto ?? user.privacy?.profilePhoto ?? 'everybody',
    };
    await user.save();
    return user.privacy;
  }

  async getUserWithPrivacy(userId: string): Promise<IUser | null> {
    return this.userModel.findById(userId).select('privacy contacts blockedUsers isOnline lastSeen').exec();
  }

  async getFolders(userId: string): Promise<any[]> {
    const user = await this.userModel.findById(userId).select('folders').exec();
    if (!user) throw new NotFoundException('User not found');
    return user.folders || [];
  }

  async createFolder(
    userId: string,
    dto: { name: string; icon?: string; includedChatIds?: string[]; excludedChatIds?: string[]; includedTypes?: string[] },
  ): Promise<any[]> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    const folder = {
      _id: new Types.ObjectId(),
      name: (dto.name || '').trim(),
      icon: dto.icon || 'folder',
      includedChatIds: (dto.includedChatIds || []).filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id)),
      excludedChatIds: (dto.excludedChatIds || []).filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id)),
      includedTypes: dto.includedTypes || [],
    };
    user.folders = user.folders || [];
    user.folders.push(folder as any);
    await user.save();
    return user.folders;
  }

  async updateFolder(
    userId: string,
    folderId: string,
    dto: { name?: string; icon?: string; includedChatIds?: string[]; excludedChatIds?: string[]; includedTypes?: string[] },
  ): Promise<any[]> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    user.folders = user.folders || [];
    const idx = user.folders.findIndex((f: any) => f._id.toString() === folderId);
    if (idx === -1) {
      throw new NotFoundException('Folder not found');
    }
    const current = user.folders[idx] as any;
    if (dto.name !== undefined) current.name = dto.name.trim();
    if (dto.icon !== undefined) current.icon = dto.icon;
    if (dto.includedChatIds !== undefined) {
      current.includedChatIds = dto.includedChatIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    }
    if (dto.excludedChatIds !== undefined) {
      current.excludedChatIds = dto.excludedChatIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    }
    if (dto.includedTypes !== undefined) current.includedTypes = dto.includedTypes;

    user.folders[idx] = current;
    user.markModified('folders');
    await user.save();
    return user.folders;
  }

  async deleteFolder(userId: string, folderId: string): Promise<any[]> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    user.folders = (user.folders || []).filter((f: any) => f._id.toString() !== folderId);
    user.markModified('folders');
    await user.save();
    return user.folders;
  }

  private async doesUserExist(phoneNumber: string): Promise<boolean> {
    const candidates = getPhoneLookupCandidates(phoneNumber);
    const user = await this.userModel.findOne({ phoneNumber: { $in: candidates } });
    return !!user;
  }
}
