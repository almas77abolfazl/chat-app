import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PushSubscriptionDocument = PushSubscription & Document;

@Schema({ timestamps: true })
export class PushSubscription extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  endpoint: string;

  @Prop({
    type: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    required: true,
    _id: false,
  })
  keys: {
    p256dh: string;
    auth: string;
  };

  @Prop({ type: String })
  userAgent?: string;
}

export const PushSubscriptionSchema = SchemaFactory.createForClass(PushSubscription);
PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });
