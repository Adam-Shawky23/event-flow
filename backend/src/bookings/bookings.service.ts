import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  private generateBookingId(): string {
    return 'B' + Date.now() + Math.floor(Math.random() * 1000);
  }

  async create(dto: CreateBookingDto, attendeeId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      include: { ticketTypes: true, bookings: true },
    });

    if (!event) throw new NotFoundException('Event not found');
    if (event.status !== 'PUBLISHED')
      throw new BadRequestException('Event is not available for booking');

    const ticketType = await this.prisma.ticketType.findUnique({
      where: { id: dto.ticketTypeId },
    });

    if (!ticketType) throw new NotFoundException('Ticket type not found');
    if (ticketType.eventId !== dto.eventId)
      throw new BadRequestException('Ticket type does not belong to this event');
    if (ticketType.available < dto.numberOfTickets)
      throw new BadRequestException('Not enough tickets available');

    // Check total capacity
    const totalBooked = event.bookings
      .filter((b) => b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + b.numberOfTickets, 0);

    if (totalBooked + dto.numberOfTickets > event.capacity)
      throw new BadRequestException('Event capacity exceeded');

    const totalCost = ticketType.price * dto.numberOfTickets;

    const booking = await this.prisma.booking.create({
      data: {
        bookingId: this.generateBookingId(),
        numberOfTickets: dto.numberOfTickets,
        totalCost,
        status: 'CONFIRMED',
        attendeeId,
        eventId: dto.eventId,
        ticketTypeId: dto.ticketTypeId,
      },
      include: {
        event: { select: { id: true, title: true } },
        ticketType: true,
      },
    });

    // Update available tickets
    await this.prisma.ticketType.update({
      where: { id: dto.ticketTypeId },
      data: { available: ticketType.available - dto.numberOfTickets },
    });

    return booking;
  }

  async findMyBookings(attendeeId: number) {
    return this.prisma.booking.findMany({
      where: { attendeeId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDateTime: true,
            endDateTime: true,
            venue: true,
            city: true,
            status: true,
          },
        },
        ticketType: true,
      },
      orderBy: { time: 'desc' },
    });
  }

  async findEventBookings(eventId: number, organizerId: number) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== organizerId)
      throw new BadRequestException('Not your event');

    return this.prisma.booking.findMany({
      where: { eventId },
      include: {
        attendee: {
          select: { id: true, username: true, firstName: true, lastName: true, email: true },
        },
        ticketType: true,
      },
      orderBy: { time: 'desc' },
    });
  }
}