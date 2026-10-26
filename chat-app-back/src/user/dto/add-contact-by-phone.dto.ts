import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddContactByPhoneDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}

