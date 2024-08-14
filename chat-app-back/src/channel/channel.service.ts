import { Injectable } from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Channel } from 'diagnostics_channel';
import { Model } from 'mongoose';
import { Message } from 'src/message/entities/message.entity';
import { ChannelDocument } from './entities/channel.entity';

@Injectable()
export class ChannelService {
  constructor(
    @InjectModel(Channel.name) private channelModel: Model<ChannelDocument>,
  ) {}

  async createChannel(name: string, owner: string): Promise<Partial<Channel>> {
    const channel = new this.channelModel({
      name,
      owner,
      createdAt: new Date(),
    });
    return channel.save();
  }

  async addSubscriber(
    channelId: string,
    userId: string,
  ): Promise<Partial<Channel>> {
    return this.channelModel
      .findByIdAndUpdate(
        channelId,
        { $push: { subscribers: userId }, updatedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async sendMessage(
    channelId: string,
    sender: string,
    content: string,
  ): Promise<Message> {
    return null;
  }

  create(createChannelDto: CreateChannelDto) {
    return 'This action adds a new channel';
  }

  findAll() {
    return `This action returns all channel`;
  }

  findOne(id: number) {
    return `This action returns a #${id} channel`;
  }

  update(id: number, updateChannelDto: UpdateChannelDto) {
    return `This action updates a #${id} channel`;
  }

  remove(id: number) {
    return `This action removes a #${id} channel`;
  }
}
