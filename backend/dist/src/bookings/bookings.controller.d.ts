import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
export declare class BookingsController {
    private bookingsService;
    constructor(bookingsService: BookingsService);
    create(dto: CreateBookingDto, user: any): Promise<{
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
    findMyBookings(user: any): Promise<({
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
    findEventBookings(eventId: number, user: any): Promise<({
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
