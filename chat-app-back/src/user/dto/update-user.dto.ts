import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ISession } from '../interfaces/session.interface';

export class UpdateUserDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @IsOptional()
  username: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsArray()
  sessions: ISession[];

  @IsString()
  @IsOptional()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName: string;
}
