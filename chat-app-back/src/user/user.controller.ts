import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserNamesDto } from './dto/update-user-names.dto';
import { IUser } from './interfaces/user.interface';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('updateUserNames')
  async updateUserNames(@Body() dto: UpdateUserNamesDto): Promise<IUser> {
    return await this.userService.updateUserNames(dto);
  }
}
