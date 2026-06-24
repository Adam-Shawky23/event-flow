import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
export declare class EventsController {
    private eventsService;
    constructor(eventsService: EventsService);
    findAll(query: any): Promise<{
        data: ({
            organizer: {
                id: number;
                username: string;
                firstName: string;
                lastName: string;
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
        })[];
        total: number;
        page: number;
        lastPage: number;
    }>;
    findMyEvents(user: any): Promise<({
        bookings: {
            id: number;
            status: import("@prisma/client").$Enums.BookingStatus;
            eventId: number;
            bookingId: string;
            numberOfTickets: number;
            totalCost: number;
            time: Date;
            attendeeId: number;
            ticketTypeId: number;
        }[];
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
    findOne(id: number): Promise<{
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
        })[];
        organizer: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
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
    }>;
    create(dto: CreateEventDto, user: any): Promise<{
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
    }>;
    update(id: number, dto: UpdateEventDto, user: any): Promise<{
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
    }>;
    publish(id: number, user: any): Promise<{
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
    }>;
    cancel(id: number, user: any): Promise<{
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
    }>;
    delete(id: number, user: any): Promise<{
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
    }>;
    recordView(id: number, user: any): Promise<{
        recorded: boolean;
    }>;
}
