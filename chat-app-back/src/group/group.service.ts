import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from 'src/message/entities/message.entity';
import { Group, GroupDocument } from './entities/group.entity';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
  ) {}

  async createGroup(name: string, admin: string): Promise<Group> {
    const group = new this.groupModel({ name, admin, createdAt: new Date() });
    return group.save();
  }

  async addMember(groupId: string, userId: string): Promise<Group> {
    return this.groupModel
      .findByIdAndUpdate(
        groupId,
        { $push: { members: userId }, updatedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async sendMessage(
    groupId: string,
    sender: string,
    content: string,
  ): Promise<Message> {
    // Logic to send a message in a group
  }

  create(createGroupDto: CreateGroupDto) {
    return 'This action adds a new group';
  }

  findAll() {
    return `This action returns all group`;
  }

  findOne(id: number) {
    return `This action returns a #${id} group`;
  }

  update(id: number, updateGroupDto: UpdateGroupDto) {
    return `This action updates a #${id} group`;
  }

  remove(id: number) {
    return `This action removes a #${id} group`;
  }
}
