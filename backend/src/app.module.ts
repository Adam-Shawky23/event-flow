import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { BookingsModule } from './bookings/bookings.module';
import { MessagesModule } from './messages/messages.module';
import { ExportModule } from './export/export.module';
import { RecommendationsModule } from './recommendations/recommendations.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    EventsModule,
    BookingsModule,
    MessagesModule,
    ExportModule,
    RecommendationsModule,
  ],
})
export class AppModule {}