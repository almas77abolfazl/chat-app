import { Matches, IsNotEmpty } from 'class-validator';

export class SendCodeDto {
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'phoneNumber must be a valid phone number' })
  @IsNotEmpty()
  phoneNumber: string;
}
