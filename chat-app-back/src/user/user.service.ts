import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { Model } from 'mongoose';
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
      .select('firstName lastName username status _id profilePicture isOnline lastSeen')
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
    const previous = user.profilePicture;

    const avatarPath = `./uploads/avatars/${filename}`;
    if (fs.existsSync(inputPath)) {
      try {
        const resizedFilename = `resized_${filename}`;
        const outputPath = join('./uploads/avatars', resizedFilename);
        await resizeAvatar(inputPath, outputPath);
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(avatarPath);
          user.profilePicture = resizedFilename;
        } else {
          logger.warn('Avatar resize failed, using original');
          user.profilePicture = filename;
        }
      } catch (error) {
        logger.warn(`Avatar resize failed: ${error?.message}, using original`);
        user.profilePicture = filename;
      }
    } else {
      user.profilePicture = filename;
    }

    await user.save();

    if (previous) {
      const previousPath = `./uploads/avatars/${previous}`;
      if (fs.existsSync(previousPath)) {
        fs.unlinkSync(previousPath);
      }
    }
    return user;
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
      .populate('contacts', 'firstName lastName username profilePicture status isOnline lastSeen phoneNumber')
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

  async removeContact(userId: string, contactId: string): Promise<IUser> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.contacts = user.contacts.filter((id) => id.toString() !== contactId);
    await user.save();
    return user;
  }

  private async doesUserExist(phoneNumber: string): Promise<boolean> {
    const user = await this.userModel.findOne({ phoneNumber });
    return !!user;
  }
}
