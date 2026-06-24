import {
  Controller, Post, Delete, Param,
  UseGuards, UseInterceptors, UploadedFile,
  ParseIntPipe, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('events')
@UseGuards(JwtGuard, RolesGuard)
@Roles('ORGANIZER', 'ADMIN')
export class EventPhotosController {
  constructor(private prisma: PrismaService) {}

  @Post(':id/photos')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: any,
  ) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new BadRequestException('Event not found');
    if (event.organizerId !== user.sub)
      throw new BadRequestException('Not your event');
    if (!file) throw new BadRequestException('No file uploaded');

    return this.prisma.eventPhoto.create({
      data: { filename: file.filename, eventId: id },
    });
  }

  @Delete(':id/photos/:photoId')
  async deletePhoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
    @GetUser() user: any,
  ) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new BadRequestException('Event not found');
    if (event.organizerId !== user.sub)
      throw new BadRequestException('Not your event');

    return this.prisma.eventPhoto.delete({ where: { id: photoId } });
  }
}