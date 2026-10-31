export interface ChatFolder {
  _id?: string;
  name: string;
  icon?: string;
  includedChatIds?: string[];
  excludedChatIds?: string[];
  includedTypes?: ('direct' | 'groups' | 'channels' | 'bots')[];
}
