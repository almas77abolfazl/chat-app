export interface Message {
  _id: string;
  chatId?: string;
  avatar: string;
  sender: any;
  senderId?: string;
  senderName?: string;
  content: string;
  createdAt: Date;
  receiver: string;
  isStreaming?: boolean;
  toolCalls?: { name: string; arguments: any }[];
  _pending?: boolean;
  status?: 'pending' | 'sent' | 'delivered' | 'read';
  read?: boolean;
  readAt?: Date;
  deliveredAt?: Date;
  editedAt?: Date;
  deletedAt?: Date;
  isDeleted?: boolean;
  deletedForEveryone?: boolean;
  mediaType?: 'image' | 'video' | 'file' | 'voice' | 'sticker' | 'gif' | 'emoji' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  forwardFrom?: {
    fromUserId?: string;
    fromSenderName?: string;
    originalChatId?: string;
  };
  reactions?: { emoji: string; count: number; users: string[] }[];
  userReactedEmoji?: string;
  linkPreview?: {
    url?: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
  };
  waveform?: number[];
}
