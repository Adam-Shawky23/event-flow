import { Controller, Get, Param, Patch, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/approve')
  @Roles('ADMIN')
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.approveUser(id);
  }

  @Patch(':id/reject')
  @Roles('ADMIN')
  reject(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.rejectUser(id);
  }

  @Patch(':id/role')
  @Roles('ADMIN')
    updateRole(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: { role: string },
  ) {
  return this.usersService.updateRole(id, body.role);
  }
}