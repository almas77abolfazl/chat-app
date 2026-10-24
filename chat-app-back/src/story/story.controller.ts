import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { StoryService } from './story.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';

const storiesUploadDir = './uploads/stories';
if (!fs.existsSync(storiesUploadDir)) {
  fs.mkdirSync(storiesUploadDir, { recursive: true });
}

const storyMulterOptions = {
  storage: diskStorage({
    destination: storiesUploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(file.originalname);
      cb(null, `story-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
};

@Controller('story')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  async getActiveStories(@Req() request: RequestWithUser) {
    return this.storyService.getActiveStories(request.user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('media', storyMulterOptions))
  async createStory(@Req() request: RequestWithUser, @Body() dto: CreateStoryDto, @UploadedFile() file?: Express.Multer.File) {
    return this.storyService.createStory(request.user._id.toString(), dto, file?.filename);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/view')
  async viewStory(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.storyService.viewStory(id, request.user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/viewers')
  async getStoryViewers(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.storyService.getStoryViewers(id, request.user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteStory(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.storyService.deleteStory(id, request.user._id.toString());
  }
}
