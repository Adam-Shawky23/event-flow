import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventPhotosController } from './events-photos.controller';

@Module({
  imports: [
    MulterModule.register({ dest: './uploads' }),
  ],
  providers: [EventsService],
  controllers: [EventsController, EventPhotosController],
})
export class EventsModule {}