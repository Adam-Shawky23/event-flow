"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const bookings_service_1 = require("./bookings.service");
const prisma_service_1 = require("../prisma/prisma.service");
describe('BookingsService', () => {
    let service;
    let prisma;
    beforeEach(async () => {
        prisma = {
            event: { findUnique: jest.fn() },
            ticketType: { findUnique: jest.fn(), update: jest.fn() },
            booking: { create: jest.fn(), findMany: jest.fn() },
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                bookings_service_1.BookingsService,
                { provide: prisma_service_1.PrismaService, useValue: prisma },
            ],
        }).compile();
        service = module.get(bookings_service_1.BookingsService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('create', () => {
        const dto = { eventId: 1, ticketTypeId: 10, numberOfTickets: 2 };
        const attendeeId = 99;
        const baseEvent = {
            id: 1,
            status: 'PUBLISHED',
            capacity: 100,
            bookings: [],
        };
        const baseTicketType = {
            id: 10,
            eventId: 1,
            price: 25,
            available: 50,
            quantity: 50,
        };
        it('throws NotFoundException when the event does not exist', async () => {
            prisma.event.findUnique.mockResolvedValue(null);
            await expect(service.create(dto, attendeeId)).rejects.toThrow(common_1.NotFoundException);
            expect(prisma.ticketType.findUnique).not.toHaveBeenCalled();
        });
        it('throws BadRequestException when the event is not PUBLISHED', async () => {
            prisma.event.findUnique.mockResolvedValue({
                ...baseEvent,
                status: 'DRAFT',
            });
            await expect(service.create(dto, attendeeId)).rejects.toThrow(common_1.BadRequestException);
        });
        it('throws NotFoundException when the ticket type does not exist', async () => {
            prisma.event.findUnique.mockResolvedValue(baseEvent);
            prisma.ticketType.findUnique.mockResolvedValue(null);
            await expect(service.create(dto, attendeeId)).rejects.toThrow(common_1.NotFoundException);
        });
        it('throws BadRequestException when the ticket type does not belong to the event', async () => {
            prisma.event.findUnique.mockResolvedValue(baseEvent);
            prisma.ticketType.findUnique.mockResolvedValue({
                ...baseTicketType,
                eventId: 999,
            });
            await expect(service.create(dto, attendeeId)).rejects.toThrow('Ticket type does not belong to this event');
        });
        it('throws BadRequestException when not enough tickets are available', async () => {
            prisma.event.findUnique.mockResolvedValue(baseEvent);
            prisma.ticketType.findUnique.mockResolvedValue({
                ...baseTicketType,
                available: 1,
            });
            await expect(service.create(dto, attendeeId)).rejects.toThrow('Not enough tickets available');
        });
        it('throws BadRequestException when booking would exceed event capacity', async () => {
            prisma.event.findUnique.mockResolvedValue({
                ...baseEvent,
                capacity: 10,
                bookings: [
                    { status: 'CONFIRMED', numberOfTickets: 9 },
                ],
            });
            prisma.ticketType.findUnique.mockResolvedValue(baseTicketType);
            await expect(service.create(dto, attendeeId)).rejects.toThrow('Event capacity exceeded');
        });
        it('ignores CANCELLED bookings when computing total capacity used', async () => {
            prisma.event.findUnique.mockResolvedValue({
                ...baseEvent,
                capacity: 10,
                bookings: [
                    { status: 'CANCELLED', numberOfTickets: 8 },
                ],
            });
            prisma.ticketType.findUnique.mockResolvedValue(baseTicketType);
            prisma.booking.create.mockResolvedValue({ id: 1, ...dto });
            prisma.ticketType.update.mockResolvedValue({});
            await expect(service.create(dto, attendeeId)).resolves.toBeDefined();
        });
        it('creates a booking and decrements ticket availability on success', async () => {
            prisma.event.findUnique.mockResolvedValue(baseEvent);
            prisma.ticketType.findUnique.mockResolvedValue(baseTicketType);
            prisma.booking.create.mockResolvedValue({
                id: 1,
                bookingId: 'B123',
                numberOfTickets: 2,
                totalCost: 50,
                status: 'CONFIRMED',
            });
            prisma.ticketType.update.mockResolvedValue({});
            const result = await service.create(dto, attendeeId);
            expect(result).toEqual(expect.objectContaining({ totalCost: 50, status: 'CONFIRMED' }));
            expect(prisma.booking.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    totalCost: 50,
                    numberOfTickets: 2,
                    attendeeId,
                    eventId: dto.eventId,
                    ticketTypeId: dto.ticketTypeId,
                    status: 'CONFIRMED',
                }),
            }));
            expect(prisma.ticketType.update).toHaveBeenCalledWith({
                where: { id: dto.ticketTypeId },
                data: { available: 48 },
            });
        });
        it('generates a unique bookingId prefixed with "B"', async () => {
            prisma.event.findUnique.mockResolvedValue(baseEvent);
            prisma.ticketType.findUnique.mockResolvedValue(baseTicketType);
            prisma.booking.create.mockResolvedValue({ id: 1 });
            prisma.ticketType.update.mockResolvedValue({});
            await service.create(dto, attendeeId);
            const createCallArgs = prisma.booking.create.mock.calls[0][0];
            expect(createCallArgs.data.bookingId).toMatch(/^B\d+/);
        });
    });
    describe('findMyBookings', () => {
        it('queries bookings filtered by attendeeId ordered by most recent', async () => {
            const attendeeId = 7;
            const expected = [{ id: 1 }, { id: 2 }];
            prisma.booking.findMany.mockResolvedValue(expected);
            const result = await service.findMyBookings(attendeeId);
            expect(prisma.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { attendeeId },
                orderBy: { time: 'desc' },
            }));
            expect(result).toBe(expected);
        });
    });
    describe('findEventBookings', () => {
        it('throws NotFoundException when the event does not exist', async () => {
            prisma.event.findUnique.mockResolvedValue(null);
            await expect(service.findEventBookings(1, 99)).rejects.toThrow(common_1.NotFoundException);
        });
        it('throws BadRequestException when the requester is not the organizer', async () => {
            prisma.event.findUnique.mockResolvedValue({
                id: 1,
                organizerId: 5,
            });
            await expect(service.findEventBookings(1, 99)).rejects.toThrow('Not your event');
        });
        it('returns bookings when the requester is the organizer', async () => {
            prisma.event.findUnique.mockResolvedValue({
                id: 1,
                organizerId: 5,
            });
            const expected = [{ id: 1 }];
            prisma.booking.findMany.mockResolvedValue(expected);
            const result = await service.findEventBookings(1, 5);
            expect(result).toBe(expected);
            expect(prisma.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { eventId: 1 } }));
        });
    });
});
//# sourceMappingURL=bookings.service.spec.js.map