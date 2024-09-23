import { Message } from './message.model';

export interface ChatListItem {
  participants: string[];
  lastMessage: Message;
  updatedAt: Date;
  messages?: Message[];
  messageCount: number;
  firstName: string;
  lastName: string;
}
