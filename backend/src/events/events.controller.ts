import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.eventsService.findAll(query);
  }

  @Get('my')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  findMyEvents(@GetUser() user: any) {
    return this.eventsService.findMyEvents(user.sub);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  create(@Body() dto: CreateEventDto, @GetUser() user: any) {
    return this.eventsService.create(dto, user.sub);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @GetUser() user: any,
  ) {
    return this.eventsService.update(id, dto, user.sub);
  }

  @Patch(':id/publish')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  publish(@Param('id', ParseIntPipe) id: number, @GetUser() user: any) {
    return this.eventsService.publish(id, user.sub);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  cancel(@Param('id', ParseIntPipe) id: number, @GetUser() user: any) {
    return this.eventsService.cancel(id, user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  delete(@Param('id', ParseIntPipe) id: number, @GetUser() user: any) {
    return this.eventsService.delete(id, user.sub);
  }
  @Post(':id/view')
@UseGuards(JwtGuard)
async recordView(
  @Param('id', ParseIntPipe) id: number,
  @GetUser() user: any,
) {
  return this.eventsService.recordView(id, user.sub);
}
}
