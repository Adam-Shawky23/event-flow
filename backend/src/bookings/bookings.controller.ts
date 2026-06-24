import {
  Controller, Get, Post, Body, Param,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';

@Controller('bookings')
@UseGuards(JwtGuard)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('PARTICIPANT', 'ORGANIZER', 'ADMIN')
  create(@Body() dto: CreateBookingDto, @GetUser() user: any) {
    return this.bookingsService.create(dto, user.sub);
  }

  @Get('my')
  findMyBookings(@GetUser() user: any) {
    return this.bookingsService.findMyBookings(user.sub);
  }

  @Get('event/:eventId')
  @UseGuards(RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  findEventBookings(
    @Param('eventId', ParseIntPipe) eventId: number,
    @GetUser() user: any,
  ) {
    return this.bookingsService.findEventBookings(eventId, user.sub);
  }
}