import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserNamesDto } from './dto/update-user-names.dto';
import { IUser } from './interfaces/user.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Post('updateUserNames')
  async updateUserNames(@Body() dto: UpdateUserNamesDto): Promise<IUser> {
    return await this.userService.updateUserNames(dto);
  }
}
