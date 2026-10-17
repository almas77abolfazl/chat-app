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
}
