import { Body, Controller, Delete, Get, Param, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserNamesDto } from './dto/update-user-names.dto';
import { AddContactByPhoneDto } from './dto/add-contact-by-phone.dto';
import { CreateFolderDto, UpdateFolderDto } from './dto/create-folder.dto';
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
    return await this.userService.updateUserNames(dto, request.user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('avatar', multerOptions))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() request: RequestWithUser) {
    const userId = request.user._id.toString();

    if (!file) {
      throw new Error('No file uploaded!');
    }

    return await this.userService.updateProfilePicture(userId, file.filename);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('avatar/:filename')
  async deleteAvatar(@Req() request: RequestWithUser, @Param('filename') filename: string) {
    return this.userService.deleteAvatar(request.user._id.toString(), filename);
  }

  @UseGuards(JwtAuthGuard)
  @Get('folders')
  async getFolders(@Req() request: RequestWithUser) {
    return this.userService.getFolders(request.user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Post('folders')
  async createFolder(@Body() dto: CreateFolderDto, @Req() request: RequestWithUser) {
    return this.userService.createFolder(request.user._id.toString(), dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('folders/:folderId')
  async updateFolder(@Param('folderId') folderId: string, @Body() dto: UpdateFolderDto, @Req() request: RequestWithUser) {
    return this.userService.updateFolder(request.user._id.toString(), folderId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('folders/:folderId')
  async deleteFolder(@Param('folderId') folderId: string, @Req() request: RequestWithUser) {
    return this.userService.deleteFolder(request.user._id.toString(), folderId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/avatar')
  async getUserAvatar(@Param('id') id: string, @Req() request: RequestWithUser): Promise<{ avatar: string | null }> {
    const avatar = await this.userService.getUserAvatar(id, request.user._id.toString());
    return { avatar };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/avatars')
  async getUserAvatars(@Param('id') id: string, @Req() request: RequestWithUser): Promise<string[]> {
    return this.userService.getUserAvatars(id, request.user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/profile')
  async getUserProfile(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.userService.getUserProfile(id, request.user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Get('search/:query')
  async search(@Param('query') query: string, @Req() request: RequestWithUser) {
    return this.userService.findUsersByQuery(query, request.user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Get('blocked')
  async getBlockedUsers(@Req() request: RequestWithUser) {
    return this.userService.getBlockedUsers(request.user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Post('block/:targetId')
  async blockUser(@Req() request: RequestWithUser, @Param('targetId') targetId: string) {
    return this.userService.blockUser(request.user._id.toString(), targetId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('block/:targetId')
  async unblockUser(@Req() request: RequestWithUser, @Param('targetId') targetId: string) {
    return this.userService.unblockUser(request.user._id.toString(), targetId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('is-blocked/:targetId')
  async isUserBlocked(@Req() request: RequestWithUser, @Param('targetId') targetId: string) {
    const isBlocked = await this.userService.isUserBlocked(request.user._id.toString(), targetId);
    return { isBlocked };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/status')
  async getUserStatus(@Param('id') id: string, @Req() request: RequestWithUser) {
    return this.userService.getUserStatus(id, request.user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Get('privacy')
  async getPrivacySettings(@Req() request: RequestWithUser) {
    return this.userService.getPrivacySettings(request.user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Post('privacy')
  async updatePrivacySettings(@Body() body: any, @Req() request: RequestWithUser) {
    return this.userService.updatePrivacySettings(request.user._id.toString(), body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('contacts')
  async getContacts(@Req() request: RequestWithUser) {
    return this.userService.getContacts(request.user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Post('contacts/by-phone')
  async addContactByPhone(@Req() request: RequestWithUser, @Body() dto: AddContactByPhoneDto) {
    return this.userService.addContactByPhone(request.user._id.toString(), dto.phoneNumber, dto.firstName, dto.lastName);
  }

  @UseGuards(JwtAuthGuard)
  @Post('contacts/:contactId')
  async addContact(@Req() request: RequestWithUser, @Param('contactId') contactId: string) {
    return this.userService.addContact(request.user._id.toString(), contactId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('contacts/:contactId')
  async removeContact(@Req() request: RequestWithUser, @Param('contactId') contactId: string) {
    return this.userService.removeContact(request.user._id.toString(), contactId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('notifications')
  async getNotificationSettings(@Req() request: RequestWithUser) {
    return this.userService.getNotificationSettings(request.user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Post('notifications')
  async updateNotificationSettings(@Body() body: { enabled: boolean }, @Req() request: RequestWithUser) {
    return this.userService.updateNotificationSettings(request.user._id.toString(), body.enabled);
  }
}
