import { ISession } from './session.interface';
import { Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  bio: string;
  email: string;
  profilePicture: string;
  status: string;
  contacts: string[];
  sessions: ISession[];
  createdAt: Date;
}
