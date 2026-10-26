import { ISession } from './session.interface';
import { Document, Types } from 'mongoose';

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
}
