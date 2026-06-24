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
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExportService = class ExportService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllEventsData() {
        return this.prisma.event.findMany({
            include: {
                categories: { include: { category: true } },
                ticketTypes: true,
                bookings: {
                    include: {
                        attendee: { select: { id: true, username: true } },
                        ticketType: true,
                    },
                },
                organizer: { select: { id: true, username: true } },
                photos: true,
            },
        });
    }
    async exportJson() {
        const events = await this.getAllEventsData();
        return events;
    }
    async exportXml() {
        const events = await this.getAllEventsData();
        const xmlEvents = events.map((event) => {
            const categories = event.categories
                .map((c) => `    <Category>${c.category.name}</Category>`)
                .join('\n');
            const ticketTypes = event.ticketTypes
                .map((t) => `      <TicketType TicketTypeID="${t.ticketId}">
        <Name>${t.name}</Name>
        <Price>${t.price}</Price>
        <Quantity>${t.quantity}</Quantity>
        <Available>${t.available}</Available>
      </TicketType>`)
                .join('\n');
            const bookings = event.bookings
                .map((b) => `      <Booking BookingID="${b.bookingId}">
        <Attendee UserID="${b.attendee.username}"/>
        <Time>${b.time.toISOString()}</Time>
        <TicketTypeRef>${b.ticketType.ticketId}</TicketTypeRef>
        <NumberOfTickets>${b.numberOfTickets}</NumberOfTickets>
        <TotalCost>${b.totalCost}</TotalCost>
        <BookingStatus>${b.status}</BookingStatus>
      </Booking>`)
                .join('\n');
            const photos = event.photos
                .map((p) => `    <Photo>${p.filename}</Photo>`)
                .join('\n');
            const geoLocation = event.geoLat && event.geoLng
                ? `    <GeoLocation Latitude="${event.geoLat}" Longitude="${event.geoLng}"/>`
                : '';
            return `  <Event EventID="${event.eventId}">
    <Title>${event.title}</Title>
${categories}
    <EventType>${event.eventType}</EventType>
    <Venue>${event.venue}</Venue>
    <Address>${event.address}</Address>
    <City>${event.city}</City>
    <Country>${event.country}</Country>
${geoLocation}
    <StartDateTime>${event.startDateTime.toISOString()}</StartDateTime>
    <EndDateTime>${event.endDateTime.toISOString()}</EndDateTime>
    <Capacity>${event.capacity}</Capacity>
    <TicketTypes>
${ticketTypes}
    </TicketTypes>
    <Bookings>
${bookings}
    </Bookings>
    <Organizer UserID="${event.organizer.username}"/>
    <Status>${event.status}</Status>
    <Description>${event.description}</Description>
    <Media>
${photos}
    </Media>
  </Event>`;
        });
        return `<?xml version="1.0" encoding="UTF-8"?>
<Events>
${xmlEvents.join('\n')}
</Events>`;
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExportService);
//# sourceMappingURL=export.service.js.map