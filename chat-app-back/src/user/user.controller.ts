import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserNamesDto } from './dto/update-user-names.dto';
import { IUser } from './interfaces/user.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Post('updateUserNames')
  async updateUserNames(
    @Body() dto: UpdateUserNamesDto,
    @Req() request: RequestWithUser,
  ): Promise<IUser> {
    return await this.userService.updateUserNames(
      dto,
      request.user._id as string,
    );
  }
}
