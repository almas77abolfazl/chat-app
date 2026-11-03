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

  @Prop({
    type: String,
    default: '',
    validate: {
      validator: function (this: Message, val: string) {
        // Content is required only if there is no media/file attached
        if (!val || !val.trim()) {
          return !!(this.fileUrl || this.mediaType);
        }
        return true;
      },
      message: 'Message must have content or media',
    },
  })
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

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  deletedForUsers: Types.ObjectId[];

  @Prop({ enum: ['image', 'video', 'file', 'voice', 'sticker', 'gif', 'emoji', 'system'], default: null })
  mediaType: string;

  @Prop({ type: String, default: null })
  systemAction?: string;

  @Prop({ type: Object, default: null })
  metadata?: Record<string, any>;

  @Prop()
  fileUrl: string;

  @Prop()
  fileName: string;

  @Prop()
  fileSize: number;

  @Prop({ type: [Number], default: null })
  waveform?: number[];

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

  @Prop({
    type: {
      url: { type: String },
      title: { type: String },
      description: { type: String },
      image: { type: String },
      siteName: { type: String },
    },
    default: null,
  })
  linkPreview?: {
    url?: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
  };
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ chat: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, read: 1 });
