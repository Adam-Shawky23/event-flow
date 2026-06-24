import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class RecommendationsService implements OnModuleInit {
    private prisma;
    private readonly logger;
    private bmf;
    private datasetUserToInternal;
    private datasetEventToInternal;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    private trainModel;
    getRecommendations(userId: number, limit?: number): Promise<any[]>;
}
