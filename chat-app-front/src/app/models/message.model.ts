export interface Message {
  _id: string;
  avatar: string;
  sender: any;
  content: string;
  createdAt: Date;
  receiver: string;
}
