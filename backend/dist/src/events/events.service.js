"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EventsService = class EventsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateEventId() {
        return 'EV' + Date.now();
    }
    generateTicketId() {
        return 'T' + Date.now() + Math.floor(Math.random() * 1000);
    }
    async create(dto, organizerId) {
        const totalTickets = dto.ticketTypes.reduce((sum, t) => sum + t.quantity, 0);
        if (totalTickets > dto.capacity) {
            throw new common_1.BadRequestException('Total ticket quantities cannot exceed event capacity');
        }
        const categoryIds = await Promise.all(dto.categories.map(async (name) => {
            const category = await this.prisma.category.upsert({
                where: { name },
                update: {},
                create: { name },
            });
            return category.id;
        }));
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
    async findAll(query) {
        const { category, title, description, startDate, endDate, minPrice, maxPrice, city, page = 1, limit = 10, } = query;
        const where = {
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
            if (startDate)
                where.startDateTime.gte = new Date(startDate);
            if (endDate)
                where.startDateTime.lte = new Date(endDate);
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
    async findOne(id) {
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
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        return event;
    }
    async findMyEvents(organizerId) {
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
    async publish(id, organizerId) {
        const event = await this.prisma.event.findUnique({ where: { id } });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.organizerId !== organizerId)
            throw new common_1.ForbiddenException('Not your event');
        if (event.status !== 'DRAFT')
            throw new common_1.BadRequestException('Only DRAFT events can be published');
        return this.prisma.event.update({
            where: { id },
            data: { status: 'PUBLISHED' },
        });
    }
    async update(id, dto, organizerId) {
        const event = await this.prisma.event.findUnique({ where: { id } });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.organizerId !== organizerId)
            throw new common_1.ForbiddenException('Not your event');
        if (event.status === 'CANCELLED')
            throw new common_1.BadRequestException('Cannot update a cancelled event');
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
    async cancel(id, organizerId) {
        const event = await this.prisma.event.findUnique({ where: { id } });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.organizerId !== organizerId)
            throw new common_1.ForbiddenException('Not your event');
        if (event.status !== 'PUBLISHED')
            throw new common_1.BadRequestException('Only PUBLISHED events can be cancelled');
        return this.prisma.event.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
    }
    async delete(id, organizerId) {
        const event = await this.prisma.event.findUnique({
            where: { id },
            include: { bookings: true },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.organizerId !== organizerId)
            throw new common_1.ForbiddenException('Not your event');
        if (event.status === 'PUBLISHED' && event.bookings.length > 0)
            throw new common_1.BadRequestException('Cannot delete event with existing bookings');
        if (event.status === 'CANCELLED')
            throw new common_1.BadRequestException('Cannot delete a cancelled event');
        return this.prisma.event.delete({ where: { id } });
    }
    async recordView(eventId, userId) {
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
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventsService);
//# sourceMappingURL=events.service.js.map