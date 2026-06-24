import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
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
    approve(id: number): Promise<{
        id: number;
        username: string;
        status: import("@prisma/client").$Enums.UserStatus;
    }>;
    reject(id: number): Promise<{
        id: number;
        username: string;
        status: import("@prisma/client").$Enums.UserStatus;
    }>;
    updateRole(id: number, body: {
        role: string;
    }): Promise<{
        id: number;
        username: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
}
