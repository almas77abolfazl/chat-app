import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Channel, ChannelDocument } from './entities/channel.entity';

@Injectable()
export class ChannelService {
  constructor(@InjectModel(Channel.name) private channelModel: Model<ChannelDocument>) {}

  async createChannel(name: string, owner: string): Promise<Channel> {
    const channel = new this.channelModel({
      name,
      owner,
      createdAt: new Date(),
    });
    return channel.save();
  }

  async addSubscriber(channelId: string, userId: string): Promise<Channel> {
    return this.channelModel.findByIdAndUpdate(channelId, { $push: { subscribers: userId }, updatedAt: new Date() }, { new: true }).exec();
  }

  async findById(channelId: string): Promise<Channel> {
    return this.channelModel.findById(channelId).exec();
  }
}
