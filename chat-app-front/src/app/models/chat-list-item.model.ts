import { Message } from "./message.model";

export interface ChatListItem {
  avatar: string;
  chatName: string;
  lastMessage: string;
  messageTime: string;
  messageCount: number;
  messages?: Message[];
}
