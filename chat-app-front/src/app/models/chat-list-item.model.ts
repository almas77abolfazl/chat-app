import { Message } from './message.model';

export interface ChatListItem {
  _id: string;
  lastMessage: Message;
  updatedAt?: Date;
  messages?: Message[];
  messageCount?: number;
  firstName?: string;
  lastName?: string;
  status?: string;
}
