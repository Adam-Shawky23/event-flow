import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  private generateEventId(): string {
    return 'EV' + Date.now();
  }

  private generateTicketId(): string {
    return 'T' + Date.now() + Math.floor(Math.random() * 1000);
  }

  async create(dto: CreateEventDto, organizerId: number) {
    // Validate total ticket quantity vs capacity
    const totalTickets = dto.ticketTypes.reduce((sum, t) => sum + t.quantity, 0);
    if (totalTickets > dto.capacity) {
      throw new BadRequestException(
        'Total ticket quantities cannot exceed event capacity',
      );
    }

    // Ensure all categories exist or create them
    const categoryIds = await Promise.all(
      dto.categories.map(async (name) => {
        const category = await this.prisma.category.upsert({
          where: { name },
          update: {},
          create: { name },
        });
        return category.id;
      }),
    );

    const event = await this.prisma.event.create({
      data: {
        eventId: this.generateEventId(),
        title: dto.title,
        eventType: dto.eventType,
        venue: dto.venue,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        geoLat: dto.geoLat,
        geoLng: dto.geoLng,
        startDateTime: new Date(dto.startDateTime),
        endDateTime: new Date(dto.endDateTime),
        capacity: dto.capacity,
        description: dto.description,
        status: 'DRAFT',
        organizerId,
        categories: {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
        ticketTypes: {
          create: dto.ticketTypes.map((t) => ({
            ticketId: this.generateTicketId(),
            name: t.name,
            price: t.price,
            quantity: t.quantity,
            available: t.quantity,
          })),
        },
      },
      include: {
        categories: { include: { category: true } },
        ticketTypes: true,
        photos: true,
      },
    });

    return event;
  }

  async findAll(query: any) {
    const {
      category,
      title,
      description,
      startDate,
      endDate,
      minPrice,
      maxPrice,
      city,
      page = 1,
      limit = 10,
    } = query;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (title) {
      where.title = { contains: title, mode: 'insensitive' };
    }

    if (description) {
      where.description = { contains: description, mode: 'insensitive' };
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (startDate || endDate) {
      where.startDateTime = {};
      if (startDate) where.startDateTime.gte = new Date(startDate);
      if (endDate) where.startDateTime.lte = new Date(endDate);
    }

    if (category) {
      where.categories = {
        some: {
          category: {
            name: { contains: category, mode: 'insensitive' },
          },
        },
      };
    }

    if (minPrice || maxPrice) {
      where.ticketTypes = {
        some: {
          price: {
            ...(minPrice && { gte: Number(minPrice) }),
            ...(maxPrice && { lte: Number(maxPrice) }),
          },
        },
      };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await this.prisma.event.count({ where });

    const events = await this.prisma.event.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        categories: { include: { category: true } },
        ticketTypes: true,
        photos: true,
        organizer: {
          select: { id: true, username: true, firstName: true, lastName: true },
        },
      },
      orderBy: { startDateTime: 'asc' },
    });

    return {
      data: events,
      total,
      page: Number(page),
      lastPage: Math.ceil(total / Number(limit)),
    };
  }

  async findOne(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        categories: { include: { category: true } },
        ticketTypes: true,
        photos: true,
        organizer: {
          select: { id: true, username: true, firstName: true, lastName: true },
        },
        bookings: {
          include: {
            attendee: {
              select: { id: true, username: true, firstName: true, lastName: true },
            },
            ticketType: true,
          },
        },
      },
    });

    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async findMyEvents(organizerId: number) {
    return this.prisma.event.findMany({
      where: { organizerId },
      include: {
        categories: { include: { category: true } },
        ticketTypes: true,
        photos: true,
        bookings: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async publish(id: number, organizerId: number) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== organizerId)
      throw new ForbiddenException('Not your event');
    if (event.status !== 'DRAFT')
      throw new BadRequestException('Only DRAFT events can be published');

    return this.prisma.event.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
  }

  async update(id: number, dto: UpdateEventDto, organizerId: number) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== organizerId)
      throw new ForbiddenException('Not your event');
    if (event.status === 'CANCELLED')
      throw new BadRequestException('Cannot update a cancelled event');

    return this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.eventType && { eventType: dto.eventType }),
        ...(dto.venue && { venue: dto.venue }),
        ...(dto.address && { address: dto.address }),
        ...(dto.city && { city: dto.city }),
        ...(dto.country && { country: dto.country }),
        ...(dto.geoLat !== undefined && { geoLat: dto.geoLat }),
        ...(dto.geoLng !== undefined && { geoLng: dto.geoLng }),
        ...(dto.startDateTime && { startDateTime: new Date(dto.startDateTime) }),
        ...(dto.endDateTime && { endDateTime: new Date(dto.endDateTime) }),
        ...(dto.capacity && { capacity: dto.capacity }),
        ...(dto.description && { description: dto.description }),
      },
    });
  }

  async cancel(id: number, organizerId: number) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== organizerId)
      throw new ForbiddenException('Not your event');
    if (event.status !== 'PUBLISHED')
      throw new BadRequestException('Only PUBLISHED events can be cancelled');

    return this.prisma.event.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async delete(id: number, organizerId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { bookings: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== organizerId)
      throw new ForbiddenException('Not your event');
    if (event.status === 'PUBLISHED' && event.bookings.length > 0)
      throw new BadRequestException(
        'Cannot delete event with existing bookings',
      );
    if (event.status === 'CANCELLED')
      throw new BadRequestException('Cannot delete a cancelled event');

    return this.prisma.event.delete({ where: { id } });
  }

  async recordView(eventId: number, userId: number) {
  // Only record if not already viewed in last 24 hours
  const existing = await this.prisma.eventView.findFirst({
    where: {
      eventId,
      userId,
      viewedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (!existing) {
    await this.prisma.eventView.create({
      data: { eventId, userId },
    });
  }
  return { recorded: true };
}
}