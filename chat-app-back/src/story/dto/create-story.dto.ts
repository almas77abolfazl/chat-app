import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateStoryDto {
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(['image', 'text', 'video'])
  mediaType?: 'image' | 'text' | 'video';

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;
}
