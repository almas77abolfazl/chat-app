export interface StoryItem {
  _id: string;
  mediaUrl: string;
  mediaType: 'image' | 'text' | 'video';
  caption?: string;
  backgroundColor?: string;
  createdAt: string | Date;
  expiresAt: string | Date;
  viewsCount?: number;
  isViewed?: boolean;
}

export interface StoryUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profilePicture?: string;
  avatar?: string;
  name?: string;
  isOnline?: boolean;
}

export interface StoryGroup {
  userId: string;
  isCurrentUser: boolean;
  user: StoryUser;
  stories: StoryItem[];
  hasUnviewed: boolean;
  hasUnseen?: boolean;
  latestStoryAt: string | Date;
}
