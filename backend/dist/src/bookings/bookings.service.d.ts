import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
export declare class BookingsService {
    private prisma;
    constructor(prisma: PrismaService);
    private generateBookingId;
    create(dto: CreateBookingDto, attendeeId: number): Promise<{
        event: {
            id: number;
            title: string;
        };
        ticketType: {
            id: number;
            name: string;
            eventId: number;
            ticketId: string;
            price: number;
            quantity: number;
            available: number;
        };
    } & {
        id: number;
        status: import("@prisma/client").$Enums.BookingStatus;
        eventId: number;
        bookingId: string;
        numberOfTickets: number;
        totalCost: number;
        time: Date;
        attendeeId: number;
        ticketTypeId: number;
    }>;
    findMyBookings(attendeeId: number): Promise<({
        event: {
            id: number;
            city: string;
            status: import("@prisma/client").$Enums.EventStatus;
            title: string;
            venue: string;
            startDateTime: Date;
            endDateTime: Date;
        };
        ticketType: {
            id: number;
            name: string;
            eventId: number;
            ticketId: string;
            price: number;
            quantity: number;
            available: number;
        };
    } & {
        id: number;
        status: import("@prisma/client").$Enums.BookingStatus;
        eventId: number;
        bookingId: string;
        numberOfTickets: number;
        totalCost: number;
        time: Date;
        attendeeId: number;
        ticketTypeId: number;
    })[]>;
    findEventBookings(eventId: number, organizerId: number): Promise<({
        ticketType: {
            id: number;
            name: string;
            eventId: number;
            ticketId: string;
            price: number;
            quantity: number;
            available: number;
        };
        attendee: {
            id: number;
            username: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: number;
        status: import("@prisma/client").$Enums.BookingStatus;
        eventId: number;
        bookingId: string;
        numberOfTickets: number;
        totalCost: number;
        time: Date;
        attendeeId: number;
        ticketTypeId: number;
    })[]>;
}
