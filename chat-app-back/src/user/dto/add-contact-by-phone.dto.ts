import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizePhoneNumber } from 'src/helpers/phone-normalizer';

export class AddContactByPhoneDto {
  @Transform(({ value }) => (typeof value === 'string' ? normalizePhoneNumber(value) : value))
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
