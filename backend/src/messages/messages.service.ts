import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async send(dto: CreateMessageDto, senderId: number) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverId },
    });
    if (!receiver) throw new NotFoundException('Receiver not found');

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

  async getInbox(userId: number) {
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

  async getSent(userId: number) {
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

  async markAsRead(messageId: number, userId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.receiverId !== userId)
      throw new ForbiddenException('Not your message');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isReadByReceiver: true },
    });
  }

  async deleteFromInbox(messageId: number, userId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.receiverId !== userId)
      throw new ForbiddenException('Not your message');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedByReceiver: true },
    });
  }

  async deleteFromSent(messageId: number, userId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId)
      throw new ForbiddenException('Not your message');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedBySender: true },
    });
  }

  async getUnreadCount(userId: number) {
    const count = await this.prisma.message.count({
      where: {
        receiverId: userId,
        isReadByReceiver: false,
        deletedByReceiver: false,
      },
    });
    return { unreadCount: count };
  }

  async notifyEventCancellation(eventId: number, organizerId: number) {
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

    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== organizerId)
      throw new ForbiddenException('Not your event');

    const uniqueAttendeeIds = [
      ...new Set(event.bookings.map((b) => b.attendee.id)),
    ];

    await Promise.all(
      uniqueAttendeeIds.map((receiverId) =>
        this.prisma.message.create({
          data: {
            subject: `Event Cancelled: ${event.title}`,
            body: `We regret to inform you that the event "${event.title}" scheduled for ${event.startDateTime.toDateString()} has been cancelled. We apologize for any inconvenience.`,
            senderId: organizerId,
            receiverId,
          },
        }),
      ),
    );

    return { message: `Notified ${uniqueAttendeeIds.length} attendees` };
  }
}