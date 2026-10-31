import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ISession } from '../interfaces/session.interface';
import { UserPrivacy } from '../interfaces/user.interface';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ unique: true, sparse: true })
  username?: string;

  @Prop({ required: true, unique: true })
  phoneNumber: string;

  @Prop()
  email?: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  bio?: string;

  @Prop()
  profilePicture?: string;

  @Prop({ type: [String], default: [] })
  avatars?: string[];

  @Prop()
  status?: string;

  @Prop({ default: [] })
  contacts: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  phoneKnownContacts?: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  phoneSharedWith?: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  blockedUsers?: Types.ObjectId[];

  @Prop({ default: [] })
  sessions: ISession[];

  @Prop({ default: new Date() })
  createdAt: Date;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop({ default: null })
  lastSeen?: Date;

  @Prop({ default: true })
  notifications: boolean;

  @Prop({
    type: {
      lastSeen: { type: String, default: 'everybody' },
      profilePhoto: { type: String, default: 'everybody' },
    },
    default: {
      lastSeen: 'everybody',
      profilePhoto: 'everybody',
    },
    _id: false,
  })
  privacy?: UserPrivacy;

  @Prop({
    type: [
      {
        _id: { type: Types.ObjectId, default: () => new Types.ObjectId() },
        name: { type: String, required: true },
        icon: { type: String, default: 'folder' },
        includedChatIds: [{ type: Types.ObjectId, ref: 'Chat' }],
        excludedChatIds: [{ type: Types.ObjectId, ref: 'Chat' }],
        includedTypes: [{ type: String, default: [] }],
      },
    ],
    default: [],
  })
  folders?: {
    _id?: Types.ObjectId;
    name: string;
    icon?: string;
    includedChatIds?: Types.ObjectId[];
    excludedChatIds?: Types.ObjectId[];
    includedTypes?: string[];
  }[];
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ firstName: 'text', lastName: 'text', username: 'text', phoneNumber: 'text' });
