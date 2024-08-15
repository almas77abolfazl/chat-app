import { IsString, IsNotEmpty, Length, IsPhoneNumber } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;

  @IsPhoneNumber('IR')
  @IsNotEmpty()
  phoneNumber: string;
}
