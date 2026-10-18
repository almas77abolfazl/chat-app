import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/create-group.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.model';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createGroup(@Body() dto: CreateGroupDto, @Req() request: RequestWithUser) {
    return this.groupService.createGroup(dto.name, request.user._id as string, dto.members);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/member')
  async addMember(@Param('id') id: string, @Body() dto: AddMemberDto, @Req() request: RequestWithUser) {
    const group = await this.groupService.findById(id);
    if (!group) throw new NotFoundException('Group not found');
    if (group.admin.toString() !== request.user._id.toString()) {
      throw new ForbiddenException('Only group admin can add members');
    }
    return this.groupService.addMember(id, dto.memberId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  async leaveGroup(@Param('id') id: string, @Req() request: RequestWithUser) {
    const group = await this.groupService.findById(id);
    if (!group) throw new NotFoundException('Group not found');
    const userId = request.user._id.toString();
    if (group.admin.toString() === userId) {
      throw new ForbiddenException('Admin cannot leave the group');
    }
    group.members = group.members.filter((m) => m.toString() !== userId);
    group.updatedAt = new Date();
    await group.save();
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getGroup(@Param('id') id: string) {
    const group = await this.groupService.findById(id);
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/member/:memberId')
  async removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @Req() request: RequestWithUser) {
    const group = await this.groupService.findById(id);
    if (!group) throw new NotFoundException('Group not found');
    if (group.admin.toString() !== request.user._id.toString()) {
      throw new ForbiddenException('Only group admin can remove members');
    }
    group.members = group.members.filter((m) => m.toString() !== memberId);
    await group.save();
    return { success: true };
  }
}
