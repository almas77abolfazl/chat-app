import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export type MessageStatus = 'sent' | 'delivered' | 'read';

@Schema()
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  receiver: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Chat', required: false })
  chat: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Group', required: false })
  group: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Channel', required: false })
  channel: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: 'sent' })
  status: MessageStatus;

  @Prop({ default: false })
  read: boolean;

  @Prop()
  deliveredAt: Date;

  @Prop()
  readAt: Date;

  @Prop()
  editedAt: Date;

  @Prop()
  deletedAt: Date;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
