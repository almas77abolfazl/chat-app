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

  @Prop({ enum: ['image', 'video', 'file', 'voice', 'sticker', 'gif', 'emoji', 'system'], default: null })
  mediaType: string;

  @Prop()
  fileUrl: string;

  @Prop()
  fileName: string;

  @Prop()
  fileSize: number;

  @Prop({
    type: {
      fromUserId: { type: Types.ObjectId, ref: 'User' },
      fromSenderName: { type: String },
      originalChatId: { type: Types.ObjectId, ref: 'Chat' },
    },
    default: null,
  })
  forwardFrom?: {
    fromUserId?: Types.ObjectId;
    fromSenderName?: string;
    originalChatId?: Types.ObjectId;
  };
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ chat: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, read: 1 });
