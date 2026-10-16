import { IsArray, IsEnum, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export type ChatType = 'direct' | 'group' | 'channel';

export class CreateChatDto {
  @IsEnum(['direct', 'group', 'channel'])
  @IsOptional()
  type?: ChatType = 'direct';

  @IsString()
  @IsOptional()
  @MaxLength(64)
  name?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  memberIds?: string[];

  @IsString()
  @IsMongoId()
  @IsOptional()
  peerId?: string;
}

export class ChatMemberDto {
  @IsString()
  @IsMongoId()
  @IsOptional()
  userId?: string;
}
