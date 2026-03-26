import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    return { id: user.id, email: user.email, name: user.name };
  }

  @Get('search')
  search(@Query('email') email: string) {
    return this.usersService.searchByEmail(email || '');
  }
}
