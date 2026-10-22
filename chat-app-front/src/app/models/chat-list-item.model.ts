import { Message } from './message.model';

export interface ChatParticipant {
  _id: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  status?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface ChatListItem {
  _id: string;            // Chat document id (used as chatId in the gateway)
  peerId?: string;        // for 1:1 chats: the other user's id
  firstName?: string;
  lastName?: string;
  name?: string;          // group / channel name
  avatar?: string;        // url or 'default_profile.jpg'
  isGroup?: boolean;
  isChannel?: boolean;
  isOwner?: boolean;
  ownerId?: string;
  participants?: ChatParticipant[];
  lastMessage: Message;
  pinnedMessage?: Message | null;
  updatedAt?: Date;
  messages?: Message[];
  messageCount?: number;
  isOnline?: boolean;     // for 1:1 chats: peer's online status
  lastSeen?: Date;        // for 1:1 chats: peer's last seen timestamp
}
