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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BookingsService = class BookingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateBookingId() {
        return 'B' + Date.now() + Math.floor(Math.random() * 1000);
    }
    async create(dto, attendeeId) {
        const event = await this.prisma.event.findUnique({
            where: { id: dto.eventId },
            include: { ticketTypes: true, bookings: true },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.status !== 'PUBLISHED')
            throw new common_1.BadRequestException('Event is not available for booking');
        const ticketType = await this.prisma.ticketType.findUnique({
            where: { id: dto.ticketTypeId },
        });
        if (!ticketType)
            throw new common_1.NotFoundException('Ticket type not found');
        if (ticketType.eventId !== dto.eventId)
            throw new common_1.BadRequestException('Ticket type does not belong to this event');
        if (ticketType.available < dto.numberOfTickets)
            throw new common_1.BadRequestException('Not enough tickets available');
        const totalBooked = event.bookings
            .filter((b) => b.status !== 'CANCELLED')
            .reduce((sum, b) => sum + b.numberOfTickets, 0);
        if (totalBooked + dto.numberOfTickets > event.capacity)
            throw new common_1.BadRequestException('Event capacity exceeded');
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
        await this.prisma.ticketType.update({
            where: { id: dto.ticketTypeId },
            data: { available: ticketType.available - dto.numberOfTickets },
        });
        return booking;
    }
    async findMyBookings(attendeeId) {
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
    async findEventBookings(eventId, organizerId) {
        const event = await this.prisma.event.findUnique({ where: { id: eventId } });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.organizerId !== organizerId)
            throw new common_1.BadRequestException('Not your event');
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
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map