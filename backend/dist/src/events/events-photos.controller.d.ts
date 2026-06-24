import { PrismaService } from '../prisma/prisma.service';
export declare class EventPhotosController {
    private prisma;
    constructor(prisma: PrismaService);
    uploadPhoto(id: number, file: Express.Multer.File, user: any): Promise<{
        id: number;
        eventId: number;
        filename: string;
    }>;
    deletePhoto(id: number, photoId: number, user: any): Promise<{
        id: number;
        eventId: number;
        filename: string;
    }>;
}
