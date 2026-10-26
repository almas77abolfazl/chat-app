import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { Model, Types } from 'mongoose';
import { IUser } from './interfaces/user.interface';
import { UpdateUserNamesDto } from './dto/update-user-names.dto';
import * as fs from 'fs';
import { join } from 'path';
import { resizeAvatar } from 'src/helpers/avatar-resize';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async createUser(phoneNumber: string): Promise<User> {
    const doesUserExist = await this.doesUserExist(phoneNumber);
    if (doesUserExist) return null;
    const createdUser = new this.userModel({ phoneNumber });
    return await createdUser.save();
  }

  async findUserByPhoneNumber(phoneNumber: string): Promise<IUser | null> {
    return this.userModel.findOne({ phoneNumber }).exec();
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

  async update(id: string, user: IUser) {
    const updatedUser = await this.userModel.findByIdAndUpdate(id, user, { new: true }).exec();

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

  async getUserStatus(userId: string): Promise<{ userId: string; isOnline: boolean; lastSeen?: Date } | null> {
    const user = await this.userModel.findById(userId).select('isOnline lastSeen _id').exec();
    if (!user) return null;
    return {
      userId: user._id.toString(),
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    };
  }

  async findUserByRefreshToken(refreshToken: string): Promise<IUser | null> {
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

  async getUserProfile(userId: string): Promise<any> {
    const user = await this.userModel
      .findById(userId)
      .select('firstName lastName username phoneNumber bio profilePicture avatars status isOnline lastSeen createdAt')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const avatars = [...(user.avatars || [])];
    if (user.profilePicture && !avatars.includes(user.profilePicture)) {
      avatars.unshift(user.profilePicture);
    }
    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      phoneNumber: user.phoneNumber,
      bio: user.bio,
      profilePicture: user.profilePicture,
      avatars,
      status: user.status,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
    };
  }

  async getUserAvatars(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId).select('avatars profilePicture').exec();
    if (!user) return [];
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

  async getUserAvatar(userId: string): Promise<string | null> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.profilePicture) {
      return null;
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
      .populate('contacts', 'firstName lastName username profilePicture avatars status isOnline lastSeen phoneNumber')
      .exec();
    if (!user) return [];
    return user.contacts as unknown as IUser[];
  }

  async addContact(userId: string, contactId: string): Promise<IUser> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.contacts.includes(contactId as any)) {
      user.contacts.push(contactId as any);
      await user.save();
    }
    return user;
  }

  async addContactByPhone(userId: string, rawPhone: string, firstName?: string, lastName?: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    const cleanDigits = rawPhone.replace(/\D/g, '');
    const candidates = [rawPhone.trim(), cleanDigits, '+' + cleanDigits];
    if (cleanDigits.startsWith('98')) {
      candidates.push('0' + cleanDigits.slice(2));
      candidates.push(cleanDigits.slice(2));
    } else if (cleanDigits.startsWith('09')) {
      candidates.push('98' + cleanDigits.slice(1));
      candidates.push('+98' + cleanDigits.slice(1));
      candidates.push(cleanDigits.slice(1));
    } else if (cleanDigits.startsWith('9') && cleanDigits.length === 10) {
      candidates.push('0' + cleanDigits);
      candidates.push('98' + cleanDigits);
      candidates.push('+98' + cleanDigits);
    }

    const targetUser = await this.userModel.findOne({ phoneNumber: { $in: candidates } }).exec();
    if (!targetUser) {
      throw new NotFoundException('کاربری با این شماره تلفن در برنامه ثبت‌نام نکرده است');
    }
    if (targetUser._id.toString() === userId) {
      throw new BadRequestException('نمی‌توانید خودتان را به عنوان مخاطب اضافه کنید');
    }

    user.contacts ??= [];
    const targetObjId = new Types.ObjectId(targetUser._id.toString());
    if (!user.contacts.some((id: any) => id.toString() === targetUser._id.toString())) {
      user.contacts.push(targetObjId as any);
      await user.save();
    }

    return {
      _id: targetUser._id.toString(),
      firstName: firstName || targetUser.firstName || '',
      lastName: lastName || targetUser.lastName || '',
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

  private async doesUserExist(phoneNumber: string): Promise<boolean> {
    const user = await this.userModel.findOne({ phoneNumber });
    return !!user;
  }
}
