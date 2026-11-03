import { Matches, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizePhoneNumber } from 'src/helpers/phone-normalizer';

export class SendCodeDto {
  @Transform(({ value }) => (typeof value === 'string' ? normalizePhoneNumber(value) : value))
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'phoneNumber must be a valid phone number' })
  @IsNotEmpty()
  phoneNumber: string;
}
