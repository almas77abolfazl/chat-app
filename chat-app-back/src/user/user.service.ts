import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { Model } from 'mongoose';
import { handleException } from 'src/helpers/error.interceptor';
import { IUser } from './interfaces/user.interface';
import { UpdateUserNamesDto } from './dto/update-user-names.dto';
import * as fs from 'fs';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createUser(phoneNumber: string): Promise<User> {
    try {
      const doesUserExist = await this.doesUserExist(phoneNumber);
      if (doesUserExist) return null;
      const createdUser = new this.userModel({ phoneNumber });
      return await createdUser.save();
    } catch (error) {
      handleException(error);
    }
  }

  async findUserByPhoneNumber(phoneNumber: string): Promise<IUser | null> {
    try {
      return this.userModel.findOne({ phoneNumber }).exec();
    } catch (error) {
      handleException(error);
    }
  }

  async updateUserNames(
    dto: UpdateUserNamesDto,
    userId: string,
  ): Promise<IUser | null> {
    try {
      const user = await this.userModel.findById(userId).exec();
      user.lastName = dto.lastName;
      user.firstName = dto.firstName;
      await user.save();
      return user;
    } catch (error) {
      handleException(error);
    }
  }

  async findById(id: string): Promise<IUser | undefined> {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      handleException(error);
    }
  }

  async update(id: string, user: IUser) {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, user, { new: true })
        .exec();

      if (!updatedUser)
        throw new NotFoundException(`User with ID ${id} not found`);

      return updatedUser;
    } catch (error) {
      handleException(error);
    }
  }

  async findUsersByQuery(query: string, userId: string) {
    try {
      const searchRegex = new RegExp(query, 'i');
      const users = await this.userModel
        .find({
          $or: [
            { username: { $regex: searchRegex } },
            { firstName: { $regex: searchRegex } },
            { lastName: { $regex: searchRegex } },
          ],
          $and: [{ _id: { $ne: userId } }],
        })
        .select('firstName lastName username status _id');
      return users;
    } catch (error) {
      handleException(error);
    }
  }

  async updateProfilePicture(userId: string, filename: string): Promise<User> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.profilePicture) {
        const path = `./uploads/avatars/${user.profilePicture}`;
        if (fs.existsSync(path)) {
          fs.unlinkSync(path);
        }
      }

      user.profilePicture = filename;
      await user.save();

      return user;
    } catch (error) {
      console.log(error);
    }
  }

  async getUserAvatar(userId: string): Promise<string> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user || !user.profilePicture) {
        throw new NotFoundException('User or avatar not found');
      }
      try {
        const path = `./uploads/avatars/${user.profilePicture}`;
        const fileBuffer = await fs.readFileSync(path);
        return fileBuffer.toString('base64');
      } catch (error) {
        throw new NotFoundException('Avatar file not found');
      }
    } catch (error) {
      console.log(error);
    }
  }

  private async doesUserExist(phoneNumber: string): Promise<boolean> {
    try {
      const user = await this.userModel.findOne({ phoneNumber });
      return !!user;
    } catch (error) {
      handleException(error);
    }
  }
}
