import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { Model } from 'mongoose';
import { handleException } from 'src/helpers/error.interceptor';
import { IUser } from './interfaces/user.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createUser(phoneNumber: string): Promise<User> {
    const doesUserExist = await this.doesUserExist(phoneNumber);
    if (doesUserExist) return null;
    const createdUser = new this.userModel({ phoneNumber });
    return await createdUser.save();
  }

  async findUserByPhoneNumber(phoneNumber: string): Promise<IUser | null> {
    return this.userModel.findOne({ phoneNumber }).exec();
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

  private async doesUserExist(phoneNumber: string): Promise<boolean> {
    try {
      const user = await this.userModel.findOne({ phoneNumber });
      return !!user;
    } catch (error) {
      handleException(error);
    }
  }
}
