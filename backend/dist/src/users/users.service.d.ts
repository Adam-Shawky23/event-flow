import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        address: string;
        city: string;
        country: string;
        vatNumber: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        address: string;
        city: string;
        country: string;
        geoLat: number | null;
        geoLng: number | null;
        vatNumber: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
    }>;
    approveUser(id: number): Promise<{
        id: number;
        username: string;
        status: import("@prisma/client").$Enums.UserStatus;
    }>;
    rejectUser(id: number): Promise<{
        id: number;
        username: string;
        status: import("@prisma/client").$Enums.UserStatus;
    }>;
    updateRole(id: number, role: string): Promise<{
        id: number;
        username: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
}
