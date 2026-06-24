import { BiasedMatrixFactorization } from './bmf';

describe('BiasedMatrixFactorization', () => {
  describe('isReady', () => {
    it('returns false before training', () => {
      const bmf = new BiasedMatrixFactorization();
      expect(bmf.isReady()).toBe(false);
    });

    it('returns true after training with data', () => {
      const bmf = new BiasedMatrixFactorization();
      bmf.train([
        { userId: 1, eventId: 1, rating: 1 },
        { userId: 1, eventId: 2, rating: -1 },
      ]);
      expect(bmf.isReady()).toBe(true);
    });

    it('does not become ready when trained with an empty array', () => {
      const bmf = new BiasedMatrixFactorization();
      bmf.train([]);
      expect(bmf.isReady()).toBe(false);
    });
  });

  describe('predict', () => {
    it('returns 0 when the model has not been trained', () => {
      const bmf = new BiasedMatrixFactorization();
      expect(bmf.predict(1, 1)).toBe(0);
    });

    it('returns a finite numeric score after training on known interactions', () => {
      const bmf = new BiasedMatrixFactorization(5, 0.05, 0.02, 30);
      bmf.train([
        { userId: 1, eventId: 1, rating: 1 },
        { userId: 1, eventId: 2, rating: -1 },
        { userId: 2, eventId: 1, rating: 1 },
        { userId: 2, eventId: 2, rating: 1 },
      ]);

      const score = bmf.predict(1, 1);
      expect(typeof score).toBe('number');
      expect(Number.isFinite(score)).toBe(true);
    });

    it('falls back to globalBias for an unknown user or event', () => {
      const bmf = new BiasedMatrixFactorization();
      bmf.train([
        { userId: 1, eventId: 1, rating: 1 },
        { userId: 2, eventId: 1, rating: -1 },
      ]);

      // global bias = (1 + -1) / 2 = 0
      const scoreUnknownUser = bmf.predict(999, 1);
      const scoreUnknownEvent = bmf.predict(1, 999);

      expect(scoreUnknownUser).toBe(0);
      expect(scoreUnknownEvent).toBe(0);
    });

    it('learns to rank a liked event higher than a disliked one for the same user', () => {
      // Train with a clear, repeated signal: user 1 likes event A, dislikes event B
      const bmf = new BiasedMatrixFactorization(8, 0.05, 0.01, 60);
      const ratings: { userId: number; eventId: number; rating: number }[] = [];
      for (let i = 0; i < 20; i++) {
        ratings.push({ userId: 1, eventId: 100, rating: 1 }); // liked
        ratings.push({ userId: 1, eventId: 200, rating: -1 }); // disliked
        // a second user gives the opposite signal so the model can't just
        // learn a trivial global bias and has to rely on user/event factors
        ratings.push({ userId: 2, eventId: 100, rating: -1 });
        ratings.push({ userId: 2, eventId: 200, rating: 1 });
      }

      bmf.train(ratings);

      const scoreLiked = bmf.predict(1, 100);
      const scoreDisliked = bmf.predict(1, 200);

      expect(scoreLiked).toBeGreaterThan(scoreDisliked);
    });
  });

  describe('getTopNForUser', () => {
    it('returns an empty array when the model has not been trained', () => {
      const bmf = new BiasedMatrixFactorization();
      expect(bmf.getTopNForUser(1, 5, [])).toEqual([]);
    });

    it('excludes events listed in excludeEventIds', () => {
      const bmf = new BiasedMatrixFactorization();
      bmf.train([
        { userId: 1, eventId: 1, rating: 1 },
        { userId: 1, eventId: 2, rating: 1 },
        { userId: 1, eventId: 3, rating: 1 },
      ]);

      const result = bmf.getTopNForUser(1, 10, [2]);

      expect(result).not.toContain(2);
    });

    it('never returns more than n results', () => {
      const bmf = new BiasedMatrixFactorization();
      bmf.train([
        { userId: 1, eventId: 1, rating: 1 },
        { userId: 1, eventId: 2, rating: 1 },
        { userId: 1, eventId: 3, rating: 1 },
        { userId: 1, eventId: 4, rating: 1 },
      ]);

      const result = bmf.getTopNForUser(1, 2, []);

      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('returns results sorted by descending predicted score', () => {
      const bmf = new BiasedMatrixFactorization(8, 0.05, 0.01, 50);
      const ratings: { userId: number; eventId: number; rating: number }[] = [];
      for (let i = 0; i < 15; i++) {
        ratings.push({ userId: 1, eventId: 1, rating: 1 }); // strongly liked
        ratings.push({ userId: 1, eventId: 2, rating: -1 }); // strongly disliked
        ratings.push({ userId: 2, eventId: 1, rating: -1 });
        ratings.push({ userId: 2, eventId: 2, rating: 1 });
      }
      bmf.train(ratings);

      const topForUser1 = bmf.getTopNForUser(1, 2, []);

      // event 1 should rank above event 2 for user 1
      expect(topForUser1[0]).toBe(1);
    });
  });

  describe('getPopularEvents', () => {
    it('returns an empty array when the model has not been trained', () => {
      const bmf = new BiasedMatrixFactorization();
      expect(bmf.getPopularEvents(5, [])).toEqual([]);
    });

    it('excludes events listed in excludeEventIds', () => {
      const bmf = new BiasedMatrixFactorization();
      bmf.train([
        { userId: 1, eventId: 1, rating: 1 },
        { userId: 2, eventId: 2, rating: 1 },
        { userId: 3, eventId: 3, rating: -1 },
      ]);

      const result = bmf.getPopularEvents(10, [1]);

      expect(result).not.toContain(1);
    });

    it('ranks events with higher bias (more positive ratings) first', () => {
      const bmf = new BiasedMatrixFactorization(4, 0.05, 0.01, 40);
      const ratings: { userId: number; eventId: number; rating: number }[] = [];
      // event 1 is consistently liked by many users -> should get a higher bias
      for (let i = 0; i < 10; i++) {
        ratings.push({ userId: i, eventId: 1, rating: 1 });
        ratings.push({ userId: i, eventId: 2, rating: -1 });
      }
      bmf.train(ratings);

      const popular = bmf.getPopularEvents(2, []);

      expect(popular[0]).toBe(1);
    });
  });
});