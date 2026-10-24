export class CreateStoryDto {
  mediaUrl?: string;
  mediaType?: 'image' | 'text' | 'video';
  caption?: string;
  backgroundColor?: string;
}
