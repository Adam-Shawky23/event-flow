import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock };
  };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
    };
    jwtService = { signAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
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
    } as any;

    it('throws ConflictException when username is already taken', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 }); // username exists

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException with the correct message when username is taken', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });

      await expect(service.register(dto)).rejects.toThrow(
        'Username already taken',
      );
    });

    it('throws ConflictException when email is already in use', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // username check passes
        .mockResolvedValueOnce({ id: 1 }); // email exists

      await expect(service.register(dto)).rejects.toThrow(
        'Email already in use',
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('hashes the password before storing the user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password_123');
      prisma.user.create.mockResolvedValue({ id: 1 });

      await service.register(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed_password_123',
          }),
        }),
      );
    });

    it('creates a new user with role PARTICIPANT and status PENDING by default', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({ id: 1 });

      await service.register(dto);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'PARTICIPANT',
            status: 'PENDING',
            username: dto.username,
            email: dto.email,
          }),
        }),
      );
    });

    it('returns a pending-approval message on success', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
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

      await expect(service.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(dto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('throws UnauthorizedException when the password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('throws UnauthorizedException when account is PENDING', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        status: 'PENDING',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(dto)).rejects.toThrow(
        'Your account is pending approval',
      );
    });

    it('throws UnauthorizedException when account is REJECTED', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        status: 'REJECTED',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(dto)).rejects.toThrow(
        'Your account has been rejected',
      );
    });

    it('returns an access token and user info on successful login', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
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
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('token');

      const result = await service.login(dto);

      expect(result.user).not.toHaveProperty('password');
    });
  });
});