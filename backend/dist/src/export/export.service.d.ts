import { PrismaService } from '../prisma/prisma.service';
export declare class ExportService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllEventsData(): Promise<({
        bookings: ({
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
        })[];
        organizer: {
            id: number;
            username: string;
        };
        categories: ({
            category: {
                id: number;
                name: string;
            };
        } & {
            eventId: number;
            categoryId: number;
        })[];
        ticketTypes: {
            id: number;
            name: string;
            eventId: number;
            ticketId: string;
            price: number;
            quantity: number;
            available: number;
        }[];
        photos: {
            id: number;
            eventId: number;
            filename: string;
        }[];
    } & {
        id: number;
        address: string;
        city: string;
        country: string;
        geoLat: number | null;
        geoLng: number | null;
        status: import("@prisma/client").$Enums.EventStatus;
        createdAt: Date;
        eventId: string;
        title: string;
        eventType: string;
        venue: string;
        startDateTime: Date;
        endDateTime: Date;
        capacity: number;
        description: string;
        organizerId: number;
    })[]>;
    exportJson(): Promise<({
        bookings: ({
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
        })[];
        organizer: {
            id: number;
            username: string;
        };
        categories: ({
            category: {
                id: number;
                name: string;
            };
        } & {
            eventId: number;
            categoryId: number;
        })[];
        ticketTypes: {
            id: number;
            name: string;
            eventId: number;
            ticketId: string;
            price: number;
            quantity: number;
            available: number;
        }[];
        photos: {
            id: number;
            eventId: number;
            filename: string;
        }[];
    } & {
        id: number;
        address: string;
        city: string;
        country: string;
        geoLat: number | null;
        geoLng: number | null;
        status: import("@prisma/client").$Enums.EventStatus;
        createdAt: Date;
        eventId: string;
        title: string;
        eventType: string;
        venue: string;
        startDateTime: Date;
        endDateTime: Date;
        capacity: number;
        description: string;
        organizerId: number;
    })[]>;
    exportXml(): Promise<string>;
}
