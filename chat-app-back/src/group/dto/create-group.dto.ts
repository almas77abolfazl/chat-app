import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsOptional()
  members: string[];
}

export class AddMemberDto {
  @IsString()
  @IsNotEmpty()
  memberId: string;
}

export class LeaveGroupDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
