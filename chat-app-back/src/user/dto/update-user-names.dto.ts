import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserNamesDto {
  @IsString()
  @IsOptional()
  @Length(0, 20)
  firstName: string;

  @IsString()
  @IsOptional()
  @Length(0, 20)
  lastName: string;
}
