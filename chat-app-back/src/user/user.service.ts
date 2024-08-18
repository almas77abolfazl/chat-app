import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { Model } from 'mongoose';
import { handleException } from 'src/helpers/error.interceptor';
import { IUser } from './interfaces/user.interface';
import { UpdateUserNamesDto } from './dto/update-user-names.dto';

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

  async updateUserNames(dto: UpdateUserNamesDto): Promise<IUser | null> {
    try {
      const user = await this.userModel.findById(dto.id).exec();
      user.lastName = dto.lastName;
      user.firstName = dto.firstName;
      await user.save();
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

  private async doesUserExist(phoneNumber: string): Promise<boolean> {
    try {
      const user = await this.userModel.findOne({ phoneNumber });
      return !!user;
    } catch (error) {
      handleException(error);
    }
  }
}
