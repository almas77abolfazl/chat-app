import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ISession } from '../interfaces/session.interface';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  phoneNumber: string;

  @Prop()
  email: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  bio: string;

  @Prop()
  profilePicture: string;

  @Prop({ type: [String], default: [] })
  avatars?: string[];

  @Prop()
  status: string;

  @Prop({ default: [] })
  contacts: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  blockedUsers?: Types.ObjectId[];

  @Prop({ default: [] })
  sessions: ISession[];

  @Prop({ default: new Date() })
  createdAt: Date;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop({ default: null })
  lastSeen: Date;

  @Prop({ default: true })
  notifications: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ firstName: 'text', lastName: 'text', username: 'text', phoneNumber: 'text' });
