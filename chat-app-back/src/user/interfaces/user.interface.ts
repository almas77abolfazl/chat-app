import { ISession } from './session.interface';
import { Document, Types } from 'mongoose';

export type PrivacyRule = 'everybody' | 'contacts' | 'nobody';

export interface UserPrivacy {
  lastSeen: PrivacyRule;
  profilePhoto: PrivacyRule;
}

export interface IChatFolder {
  _id?: Types.ObjectId | string;
  name: string;
  icon?: string;
  includedChatIds?: (Types.ObjectId | string)[];
  excludedChatIds?: (Types.ObjectId | string)[];
  includedTypes?: string[];
}

export interface IUser extends Document {
  username?: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  email?: string;
  profilePicture?: string;
  avatars?: string[];
  status?: string;
  contacts: string[];
  blockedUsers?: Types.ObjectId[];
  sessions: ISession[];
  createdAt: Date;
  isOnline: boolean;
  lastSeen?: Date;
  notifications: boolean;
  privacy?: UserPrivacy;
  folders?: IChatFolder[];
}
