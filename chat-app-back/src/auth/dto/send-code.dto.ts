import { IsPhoneNumber, IsNotEmpty } from 'class-validator';

export class SendCodeDto {
  @IsPhoneNumber('IR') // اینجا کشور ایران به عنوان مثال انتخاب شده است
  @IsNotEmpty()
  phoneNumber: string;
}
