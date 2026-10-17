import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ISession } from '../interfaces/session.interface';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop()
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

  @Prop()
  status: string;

  @Prop({ default: [] })
  contacts: string[];

  @Prop({ default: [] })
  sessions: ISession[];

  @Prop({ default: new Date() })
  createdAt: Date;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop()
  lastSeen: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
