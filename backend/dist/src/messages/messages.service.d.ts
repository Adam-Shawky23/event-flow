import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
export declare class MessagesService {
    private prisma;
    constructor(prisma: PrismaService);
    send(dto: CreateMessageDto, senderId: number): Promise<{
        sender: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
        };
        receiver: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: number;
        createdAt: Date;
        subject: string;
        body: string;
        isReadByReceiver: boolean;
        deletedBySender: boolean;
        deletedByReceiver: boolean;
        senderId: number;
        receiverId: number;
    }>;
    getInbox(userId: number): Promise<({
        sender: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: number;
        createdAt: Date;
        subject: string;
        body: string;
        isReadByReceiver: boolean;
        deletedBySender: boolean;
        deletedByReceiver: boolean;
        senderId: number;
        receiverId: number;
    })[]>;
    getSent(userId: number): Promise<({
        receiver: {
            id: number;
            username: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: number;
        createdAt: Date;
        subject: string;
        body: string;
        isReadByReceiver: boolean;
        deletedBySender: boolean;
        deletedByReceiver: boolean;
        senderId: number;
        receiverId: number;
    })[]>;
    markAsRead(messageId: number, userId: number): Promise<{
        id: number;
        createdAt: Date;
        subject: string;
        body: string;
        isReadByReceiver: boolean;
        deletedBySender: boolean;
        deletedByReceiver: boolean;
        senderId: number;
        receiverId: number;
    }>;
    deleteFromInbox(messageId: number, userId: number): Promise<{
        id: number;
        createdAt: Date;
        subject: string;
        body: string;
        isReadByReceiver: boolean;
        deletedBySender: boolean;
        deletedByReceiver: boolean;
        senderId: number;
        receiverId: number;
    }>;
    deleteFromSent(messageId: number, userId: number): Promise<{
        id: number;
        createdAt: Date;
        subject: string;
        body: string;
        isReadByReceiver: boolean;
        deletedBySender: boolean;
        deletedByReceiver: boolean;
        senderId: number;
        receiverId: number;
    }>;
    getUnreadCount(userId: number): Promise<{
        unreadCount: number;
    }>;
    notifyEventCancellation(eventId: number, organizerId: number): Promise<{
        message: string;
    }>;
}
