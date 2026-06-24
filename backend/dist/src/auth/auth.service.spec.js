"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const auth_service_1 = require("./auth.service");
const prisma_service_1 = require("../prisma/prisma.service");
jest.mock('bcrypt');
describe('AuthService', () => {
    let service;
    let prisma;
    let jwtService;
    beforeEach(async () => {
        prisma = {
            user: { findUnique: jest.fn(), create: jest.fn() },
        };
        jwtService = { signAsync: jest.fn() };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: prisma_service_1.PrismaService, useValue: prisma },
                { provide: jwt_1.JwtService, useValue: jwtService },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('register', () => {
        const dto = {
            username: 'newuser',
            password: 'plainpassword',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '123456789',
            address: 'Some street',
            city: 'Athens',
            country: 'Greece',
            vatNumber: '123456789',
            geoLat: 37.98,
            geoLng: 23.72,
        };
        it('throws ConflictException when username is already taken', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 1 });
            await expect(service.register(dto)).rejects.toThrow(common_1.ConflictException);
            expect(prisma.user.create).not.toHaveBeenCalled();
        });
        it('throws ConflictException with the correct message when username is taken', async () => {
            prisma.user.findUnique.mockResolvedValue({ id: 1 });
            await expect(service.register(dto)).rejects.toThrow('Username already taken');
        });
        it('throws ConflictException when email is already in use', async () => {
            prisma.user.findUnique
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id: 1 });
            await expect(service.register(dto)).rejects.toThrow('Email already in use');
            expect(prisma.user.create).not.toHaveBeenCalled();
        });
        it('hashes the password before storing the user', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed_password_123');
            prisma.user.create.mockResolvedValue({ id: 1 });
            await service.register(dto);
            expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
            expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    password: 'hashed_password_123',
                }),
            }));
        });
        it('creates a new user with role PARTICIPANT and status PENDING by default', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed');
            prisma.user.create.mockResolvedValue({ id: 1 });
            await service.register(dto);
            expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    role: 'PARTICIPANT',
                    status: 'PENDING',
                    username: dto.username,
                    email: dto.email,
                }),
            }));
        });
        it('returns a pending-approval message on success', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed');
            prisma.user.create.mockResolvedValue({ id: 1 });
            const result = await service.register(dto);
            expect(result).toEqual({
                message: 'Registration successful. Awaiting admin approval.',
            });
        });
    });
    describe('login', () => {
        const dto = { username: 'johndoe', password: 'plainpassword' };
        const baseUser = {
            id: 1,
            username: 'johndoe',
            password: 'hashed_password',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'PARTICIPANT',
            status: 'APPROVED',
        };
        it('throws UnauthorizedException when the user does not exist', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            await expect(service.login(dto)).rejects.toThrow(common_1.UnauthorizedException);
            await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
        });
        it('throws UnauthorizedException when the password does not match', async () => {
            prisma.user.findUnique.mockResolvedValue(baseUser);
            bcrypt.compare.mockResolvedValue(false);
            await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
        });
        it('throws UnauthorizedException when account is PENDING', async () => {
            prisma.user.findUnique.mockResolvedValue({
                ...baseUser,
                status: 'PENDING',
            });
            bcrypt.compare.mockResolvedValue(true);
            await expect(service.login(dto)).rejects.toThrow('Your account is pending approval');
        });
        it('throws UnauthorizedException when account is REJECTED', async () => {
            prisma.user.findUnique.mockResolvedValue({
                ...baseUser,
                status: 'REJECTED',
            });
            bcrypt.compare.mockResolvedValue(true);
            await expect(service.login(dto)).rejects.toThrow('Your account has been rejected');
        });
        it('returns an access token and user info on successful login', async () => {
            prisma.user.findUnique.mockResolvedValue(baseUser);
            bcrypt.compare.mockResolvedValue(true);
            jwtService.signAsync.mockResolvedValue('signed.jwt.token');
            const result = await service.login(dto);
            expect(jwtService.signAsync).toHaveBeenCalledWith({
                sub: baseUser.id,
                username: baseUser.username,
                role: baseUser.role,
            });
            expect(result).toEqual({
                access_token: 'signed.jwt.token',
                user: {
                    id: baseUser.id,
                    username: baseUser.username,
                    firstName: baseUser.firstName,
                    lastName: baseUser.lastName,
                    email: baseUser.email,
                    role: baseUser.role,
                },
            });
        });
        it('never exposes the password hash in the returned user object', async () => {
            prisma.user.findUnique.mockResolvedValue(baseUser);
            bcrypt.compare.mockResolvedValue(true);
            jwtService.signAsync.mockResolvedValue('token');
            const result = await service.login(dto);
            expect(result.user).not.toHaveProperty('password');
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map