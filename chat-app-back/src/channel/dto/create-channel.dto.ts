import { IsString, IsNotEmpty } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class SubscribeChannelDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
