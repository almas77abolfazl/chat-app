import { Body, Controller, Get, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserNamesDto } from './dto/update-user-names.dto';
import { IUser } from './interfaces/user.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/helpers/upload';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Post('updateUserNames')
  async updateUserNames(@Body() dto: UpdateUserNamesDto, @Req() request: RequestWithUser): Promise<IUser> {
    return await this.userService.updateUserNames(dto, request.user._id as string);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('avatar', multerOptions))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() request: RequestWithUser) {
    const userId = request.user._id as string;

    if (!file) {
      throw new Error('No file uploaded!');
    }

    return await this.userService.updateProfilePicture(userId, file.filename);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/avatar')
  async getUserAvatar(@Param('id') id: string): Promise<{ avatar: string }> {
    const avatar = await this.userService.getUserAvatar(id);
    return { avatar };
  }

  @UseGuards(JwtAuthGuard)
  @Get('search/:query')
  async search(@Param('query') query: string, @Req() request: RequestWithUser) {
    return this.userService.findUsersByQuery(query, request.user._id as string);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/status')
  async getUserStatus(@Param('id') id: string) {
    return this.userService.getUserStatus(id);
  }
}
