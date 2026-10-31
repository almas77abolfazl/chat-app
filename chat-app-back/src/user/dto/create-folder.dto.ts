import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsArray()
  @IsOptional()
  includedChatIds?: string[];

  @IsArray()
  @IsOptional()
  excludedChatIds?: string[];

  @IsArray()
  @IsOptional()
  includedTypes?: string[];
}

export class UpdateFolderDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsArray()
  @IsOptional()
  includedChatIds?: string[];

  @IsArray()
  @IsOptional()
  excludedChatIds?: string[];

  @IsArray()
  @IsOptional()
  includedTypes?: string[];
}

