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
  status?: 'sent' | 'delivered' | 'read';
  read?: boolean;
  readAt?: Date;
  deliveredAt?: Date;
  editedAt?: Date;
  deletedAt?: Date;
  isDeleted?: boolean;
  mediaType?: 'image' | 'video' | 'file' | 'voice' | 'sticker' | 'gif' | 'emoji';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  reactions?: { emoji: string; count: number; users: string[] }[];
  userReactedEmoji?: string;
}
