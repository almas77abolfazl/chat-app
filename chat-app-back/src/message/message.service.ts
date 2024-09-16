import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './entities/message.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async saveMessage(
    sender: string,
    receiver: string,
    content: string,
  ): Promise<Message> {
    const message = new this.messageModel({ sender, receiver, content });
    return message.save();
  }

  async getMessagesBetweenUsers(
    userId1: string,
    userId2: string,
  ): Promise<Message[]> {
    return this.messageModel
      .find({
        $or: [
          { sender: userId1, receiver: userId2 },
          { sender: userId2, receiver: userId1 },
        ],
      })
      .exec();
  }
}
