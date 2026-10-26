import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;

  @Matches(/^\+?[0-9]{7,15}$/, { message: 'phoneNumber must be a valid phone number' })
  @IsNotEmpty()
  phoneNumber: string;
}
