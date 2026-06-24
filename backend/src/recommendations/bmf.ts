import * as fs from 'fs';
import * as path from 'path';

interface Rating {
  userId: number;
  eventId: number;
  rating: number; // 1 = interested, -1 = not interested
}

interface BMFModel {
  userFactors: Map<number, number[]>;
  eventFactors: Map<number, number[]>;
  userBiases: Map<number, number>;
  eventBiases: Map<number, number>;
  globalBias: number;
  userIndex: number[];
  eventIndex: number[];
}

export class BiasedMatrixFactorization {
  private numFactors: number;
  private learningRate: number;
  private regularization: number;
  private epochs: number;
  private model: BMFModel | null = null;

  constructor(
    numFactors = 10,
    learningRate = 0.01,
    regularization = 0.02,
    epochs = 20,
  ) {
    this.numFactors = numFactors;
    this.learningRate = learningRate;
    this.regularization = regularization;
    this.epochs = epochs;
  }

  private randomVector(size: number): number[] {
    return Array.from(
      { length: size },
      () => (Math.random() - 0.5) * 0.1
    );
  }

  train(ratings: Rating[]): void {
    if (ratings.length === 0) return;

    const userIds = [...new Set(ratings.map((r) => r.userId))];
    const eventIds = [...new Set(ratings.map((r) => r.eventId))];

    const globalBias =
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    const userFactors = new Map<number, number[]>();
    const eventFactors = new Map<number, number[]>();
    const userBiases = new Map<number, number>();
    const eventBiases = new Map<number, number>();

    for (const uid of userIds) {
      userFactors.set(uid, this.randomVector(this.numFactors));
      userBiases.set(uid, 0);
    }
    for (const eid of eventIds) {
      eventFactors.set(eid, this.randomVector(this.numFactors));
      eventBiases.set(eid, 0);
    }

    // SGD training
    for (let epoch = 0; epoch < this.epochs; epoch++) {
      // Shuffle ratings
      const shuffled = [...ratings].sort(() => Math.random() - 0.5);

      for (const r of shuffled) {
        const uf = userFactors.get(r.userId)!;
        const ef = eventFactors.get(r.eventId)!;
        const ub = userBiases.get(r.userId)!;
        const eb = eventBiases.get(r.eventId)!;

        // Dot product
        const dot = uf.reduce((sum, val, i) => sum + val * ef[i], 0);
        const predicted = globalBias + ub + eb + dot;
        const error = r.rating - predicted;

        // Update biases
        userBiases.set(
          r.userId,
          ub + this.learningRate * (error - this.regularization * ub)
        );
        eventBiases.set(
          r.eventId,
          eb + this.learningRate * (error - this.regularization * eb)
        );

        // Update factors
        const newUf = uf.map(
          (val, i) =>
            val +
            this.learningRate * (error * ef[i] - this.regularization * val)
        );
        const newEf = ef.map(
          (val, i) =>
            val +
            this.learningRate * (error * uf[i] - this.regularization * val)
        );

        userFactors.set(r.userId, newUf);
        eventFactors.set(r.eventId, newEf);
      }
    }

    this.model = {
      userFactors,
      eventFactors,
      userBiases,
      eventBiases,
      globalBias,
      userIndex: userIds,
      eventIndex: eventIds,
    };
  }

  predict(userId: number, eventId: number): number {
    if (!this.model) return 0;

    const uf = this.model.userFactors.get(userId);
    const ef = this.model.eventFactors.get(eventId);
    const ub = this.model.userBiases.get(userId) ?? 0;
    const eb = this.model.eventBiases.get(eventId) ?? 0;

    if (!uf || !ef) return this.model.globalBias;

    const dot = uf.reduce((sum, val, i) => sum + val * ef[i], 0);
    return this.model.globalBias + ub + eb + dot;
  }

  getTopNForUser(userId: number, n: number, excludeEventIds: number[]): number[] {
    if (!this.model) return [];

    const scores: { eventId: number; score: number }[] = [];

    for (const eventId of this.model.eventIndex) {
      if (excludeEventIds.includes(eventId)) continue;
      scores.push({ eventId, score: this.predict(userId, eventId) });
    }

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map((s) => s.eventId);
  }

  // Get top events by average score (for cold start)
  getPopularEvents(n: number, excludeEventIds: number[]): number[] {
    if (!this.model) return [];

    const scores: { eventId: number; score: number }[] = [];
    for (const eventId of this.model.eventIndex) {
      if (excludeEventIds.includes(eventId)) continue;
      const eb = this.model.eventBiases.get(eventId) ?? 0;
      scores.push({ eventId, score: this.model.globalBias + eb });
    }

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map((s) => s.eventId);
  }

  isReady(): boolean {
    return this.model !== null;
  }
}

export function loadRatingsFromCsv(filePath: string): Rating[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').slice(1); // skip header
  const ratings: Rating[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(',');
    const userId = parseInt(parts[0]);
    const eventId = parseInt(parts[1]);
    const interested = parseInt(parts[4]) || 0;
    const notInterested = parseInt(parts[5]) || 0;

    if (isNaN(userId) || isNaN(eventId)) continue;

    let rating = 0;
    if (interested === 1) rating = 1;
    else if (notInterested === 1) rating = -1;
    else continue; // skip neutral

    ratings.push({ userId, eventId, rating });
  }

  return ratings;
}