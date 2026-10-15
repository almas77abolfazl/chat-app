import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from './entities/group.entity';

@Injectable()
export class GroupService {
  constructor(@InjectModel(Group.name) private groupModel: Model<GroupDocument>) {}

  async createGroup(name: string, admin: string, members: string[] = []): Promise<Group> {
    const group = new this.groupModel({
      name,
      admin,
      members,
      createdAt: new Date(),
    });
    return group.save();
  }

  async addMember(groupId: string, userId: string): Promise<Group> {
    return this.groupModel.findByIdAndUpdate(groupId, { $push: { members: userId }, updatedAt: new Date() }, { new: true }).exec();
  }

  async findById(groupId: string): Promise<Group> {
    return this.groupModel.findById(groupId).exec();
  }
}
