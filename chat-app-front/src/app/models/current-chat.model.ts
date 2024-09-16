import { Message } from './message.model';

export interface CurrentChat {
  title?: string;
  info?: string;
  messages?: Message[];
  Id: string;
}
