import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BiasedMatrixFactorization, loadRatingsFromCsv } from './bmf';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class RecommendationsService implements OnModuleInit {
  private readonly logger = new Logger(RecommendationsService.name);
  private bmf: BiasedMatrixFactorization;
  private datasetUserToInternal = new Map<number, number>();
  private datasetEventToInternal = new Map<number, number>();

  constructor(private prisma: PrismaService) {
    this.bmf = new BiasedMatrixFactorization(10, 0.01, 0.02, 20);
  }

  async onModuleInit() {
    await this.trainModel();
  }

  private async trainModel() {
    try {
      const csvPath = path.join(process.cwd(), 'event_interest.csv');
      if (!fs.existsSync(csvPath)) {
        this.logger.warn('event_interest.csv not found, skipping BMF training');
        return;
      }

      this.logger.log('Loading ratings from CSV...');
      const ratings = loadRatingsFromCsv(csvPath);
      this.logger.log(`Loaded ${ratings.length} ratings, training BMF...`);

      this.bmf.train(ratings);
      this.logger.log('BMF training complete');
    } catch (err) {
      this.logger.error('BMF training failed', err);
    }
  }

  async getRecommendations(userId: number, limit = 6): Promise<any[]> {
  const publishedEvents = await this.prisma.event.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      categories: { include: { category: true } },
      ticketTypes: true,
      organizer: {
        select: { id: true, username: true, firstName: true, lastName: true },
      },
    },
  });

  if (publishedEvents.length === 0) return [];

  const userBookings = await this.prisma.booking.findMany({
    where: { attendeeId: userId },
    select: { eventId: true },
  });

  const userViews = await this.prisma.eventView.findMany({
    where: { userId },
    select: { eventId: true },
  });

  const bookedEventIds = userBookings.map((b) => b.eventId);
  const viewedEventIds = userViews.map((v) => v.eventId);
  const interactedEventIds = [...new Set([...bookedEventIds, ...viewedEventIds])];

  if (!this.bmf.isReady()) {
    return publishedEvents
      .filter((e) => !bookedEventIds.includes(e.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  const hasHistory = interactedEventIds.length > 0;

  const eventScores: { event: any; score: number }[] = [];

  for (const event of publishedEvents) {
    if (bookedEventIds.includes(event.id)) continue;

    let score: number;
    if (hasHistory) {
      score = this.bmf.predict(userId % 37000, event.id % 300000);
    } else {
      // Cold start: use global bias + event bias only
      score = this.bmf.predict(0, event.id % 300000);
    }
    eventScores.push({ event, score });
  }

  if (eventScores.length === 0) return publishedEvents.slice(0, limit);

  return eventScores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.event);
}
}