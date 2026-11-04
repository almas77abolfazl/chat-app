import { IsOptional, IsString } from 'class-validator';

export class AddContactDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}
