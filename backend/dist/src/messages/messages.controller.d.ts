import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
export declare class MessagesController {
    private messagesService;
    constructor(messagesService: MessagesService);
    send(dto: CreateMessageDto, user: any): Promise<{
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
    getInbox(user: any): Promise<({
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
    getSent(user: any): Promise<({
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
    getUnreadCount(user: any): Promise<{
        unreadCount: number;
    }>;
    markAsRead(id: number, user: any): Promise<{
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
    deleteFromInbox(id: number, user: any): Promise<{
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
    deleteFromSent(id: number, user: any): Promise<{
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
    notifyEventCancellation(eventId: number, user: any): Promise<{
        message: string;
    }>;
}
