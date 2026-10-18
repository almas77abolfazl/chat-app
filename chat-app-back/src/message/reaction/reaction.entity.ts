import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReactionDocument = Reaction & Document;

@Schema()
export class Reaction {
  @Prop({ type: Types.ObjectId, ref: 'Message', required: true })
  messageId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  emoji: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ReactionSchema = SchemaFactory.createForClass(Reaction);
