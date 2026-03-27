import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post()
  create(@Body() dto: CreateGroupDto, @Request() req) {
    return this.groupsService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.groupsService.findUserGroups(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.groupsService.findById(id, req.user.id);
  }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto, @Request() req) {
    return this.groupsService.addMember(id, dto.email, req.user.id);
  }
}
