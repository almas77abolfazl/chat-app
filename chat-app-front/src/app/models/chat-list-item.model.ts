import { Message } from './message.model';

export interface AdminPermissions {
  canChangeInfo?: boolean;
  canPostMessages?: boolean;
  canEditMessages?: boolean;
  canDeleteMessages?: boolean;
  canInviteUsers?: boolean;
  canPinMessages?: boolean;
  canManageAdmins?: boolean;
}

export interface ChatAdmin {
  userId: string;
  customTitle?: string;
  permissions: AdminPermissions;
  promotedBy?: string;
  promotedAt?: Date;
}

export interface ChatParticipant {
  _id: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  status?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface TypingUser {
  userId: string;
  userName: string;
}

export interface ChatListItem {
  _id: string;            // Chat document id (used as chatId in the gateway)
  peerId?: string;        // for 1:1 chats: the other user's id
  firstName?: string;
  lastName?: string;
  name?: string;          // group / channel name
  avatar?: string;        // profile image url (optional; falls back to Telegram initials)
  avatars?: string[];
  otherParticipant?: ChatParticipant;
  chatId?: string;
  isGroup?: boolean;
  isChannel?: boolean;
  isSavedMessages?: boolean;
  isDraft?: boolean;
  isOwner?: boolean;
  ownerId?: string;
  admins?: ChatAdmin[];
  isBlocked?: boolean;
  participants?: ChatParticipant[];
  lastMessage: Message;
  pinnedMessage?: Message | null;
  updatedAt?: Date;
  messages?: Message[];
  messageCount?: number;
  isOnline?: boolean;     // for 1:1 chats: peer's online status
  lastSeen?: Date;        // for 1:1 chats: peer's last seen timestamp
}
