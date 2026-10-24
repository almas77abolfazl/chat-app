import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StoryDocument = Story & Document;

export interface StoryView {
  user: Types.ObjectId;
  viewedAt: Date;
}

@Schema()
export class Story extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  mediaUrl: string;

  @Prop({ default: 'image' })
  mediaType: string;

  @Prop({ type: String, default: '' })
  caption?: string;

  @Prop({ type: String, default: null })
  backgroundColor?: string;

  @Prop({
    type: [
      {
        user: { type: Types.ObjectId, ref: 'User' },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  views: StoryView[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  })
  expiresAt: Date;
}

export const StorySchema = SchemaFactory.createForClass(Story);

StorySchema.index({ user: 1 });
StorySchema.index({ expiresAt: 1 });
StorySchema.index({ createdAt: -1 });
