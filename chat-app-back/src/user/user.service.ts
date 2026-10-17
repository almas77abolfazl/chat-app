import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { Model } from 'mongoose';
import { IUser } from './interfaces/user.interface';
import { UpdateUserNamesDto } from './dto/update-user-names.dto';
import * as fs from 'fs';

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

  async updateProfilePicture(userId: string, filename: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previous = user.profilePicture;
    user.profilePicture = filename;
    await user.save();

    if (previous) {
      const path = `./uploads/avatars/${previous}`;
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    }
    return user;
  }

  async getUserAvatar(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.profilePicture) {
      throw new NotFoundException('Avatar not found');
    }
    const path = `./uploads/avatars/${user.profilePicture}`;
    if (!fs.existsSync(path)) {
      throw new NotFoundException('Avatar file not found');
    }
    return fs.readFileSync(path).toString('base64');
  }

  private async doesUserExist(phoneNumber: string): Promise<boolean> {
    const user = await this.userModel.findOne({ phoneNumber });
    return !!user;
  }
}
