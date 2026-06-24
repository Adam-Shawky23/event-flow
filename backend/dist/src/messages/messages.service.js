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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MessagesService = class MessagesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async send(dto, senderId) {
        const receiver = await this.prisma.user.findUnique({
            where: { id: dto.receiverId },
        });
        if (!receiver)
            throw new common_1.NotFoundException('Receiver not found');
        return this.prisma.message.create({
            data: {
                subject: dto.subject,
                body: dto.body,
                senderId,
                receiverId: dto.receiverId,
            },
            include: {
                sender: { select: { id: true, username: true, firstName: true, lastName: true } },
                receiver: { select: { id: true, username: true, firstName: true, lastName: true } },
            },
        });
    }
    async getInbox(userId) {
        return this.prisma.message.findMany({
            where: {
                receiverId: userId,
                deletedByReceiver: false,
            },
            include: {
                sender: { select: { id: true, username: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getSent(userId) {
        return this.prisma.message.findMany({
            where: {
                senderId: userId,
                deletedBySender: false,
            },
            include: {
                receiver: { select: { id: true, username: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async markAsRead(messageId, userId) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        if (message.receiverId !== userId)
            throw new common_1.ForbiddenException('Not your message');
        return this.prisma.message.update({
            where: { id: messageId },
            data: { isReadByReceiver: true },
        });
    }
    async deleteFromInbox(messageId, userId) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        if (message.receiverId !== userId)
            throw new common_1.ForbiddenException('Not your message');
        return this.prisma.message.update({
            where: { id: messageId },
            data: { deletedByReceiver: true },
        });
    }
    async deleteFromSent(messageId, userId) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        if (message.senderId !== userId)
            throw new common_1.ForbiddenException('Not your message');
        return this.prisma.message.update({
            where: { id: messageId },
            data: { deletedBySender: true },
        });
    }
    async getUnreadCount(userId) {
        const count = await this.prisma.message.count({
            where: {
                receiverId: userId,
                isReadByReceiver: false,
                deletedByReceiver: false,
            },
        });
        return { unreadCount: count };
    }
    async notifyEventCancellation(eventId, organizerId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                bookings: {
                    where: { status: 'CONFIRMED' },
                    include: {
                        attendee: { select: { id: true } },
                    },
                },
            },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.organizerId !== organizerId)
            throw new common_1.ForbiddenException('Not your event');
        const uniqueAttendeeIds = [
            ...new Set(event.bookings.map((b) => b.attendee.id)),
        ];
        await Promise.all(uniqueAttendeeIds.map((receiverId) => this.prisma.message.create({
            data: {
                subject: `Event Cancelled: ${event.title}`,
                body: `We regret to inform you that the event "${event.title}" scheduled for ${event.startDateTime.toDateString()} has been cancelled. We apologize for any inconvenience.`,
                senderId: organizerId,
                receiverId,
            },
        })));
        return { message: `Notified ${uniqueAttendeeIds.length} attendees` };
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map