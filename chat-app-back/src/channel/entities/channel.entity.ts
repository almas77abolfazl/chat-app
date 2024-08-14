import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChannelDocument = Channel & Document;

@Schema()
export class Channel {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId; // ID of the user who created the channel

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  subscribers: Types.ObjectId[]; // List of user IDs who subscribed

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Message' }] })
  messages: Types.ObjectId[]; // List of message IDs

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);
