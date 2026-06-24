"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bmf_1 = require("./bmf");
describe('BiasedMatrixFactorization', () => {
    describe('isReady', () => {
        it('returns false before training', () => {
            const bmf = new bmf_1.BiasedMatrixFactorization();
            expect(bmf.isReady()).toBe(false);
        });
        it('returns true after training with data', () => {
            const bmf = new bmf_1.BiasedMatrixFactorization();
            bmf.train([
                { userId: 1, eventId: 1, rating: 1 },
                { userId: 1, eventId: 2, rating: -1 },
            ]);
            expect(bmf.isReady()).toBe(true);
        });
        it('does not become ready when trained with an empty array', () => {
            const bmf = new bmf_1.BiasedMatrixFactorization();
            bmf.train([]);
            expect(bmf.isReady()).toBe(false);
        });
    });
    describe('predict', () => {
        it('returns 0 when the model has not been trained', () => {
            const bmf = new bmf_1.BiasedMatrixFactorization();
            expect(bmf.predict(1, 1)).toBe(0);
        });
        it('returns a finite numeric score after training on known interactions', () => {
            const bmf = new bmf_1.BiasedMatrixFactorization(5, 0.05, 0.02, 30);
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
            const bmf = new bmf_1.BiasedMatrixFactorization();
            bmf.train([
                { userId: 1, eventId: 1, rating: 1 },
                { userId: 2, eventId: 1, rating: -1 },
            ]);
            const scoreUnknownUser = bmf.predict(999, 1);
            const scoreUnknownEvent = bmf.predict(1, 999);
            expect(scoreUnknownUser).toBe(0);
            expect(scoreUnknownEvent).toBe(0);
        });
        it('learns to rank a liked event higher than a disliked one for the same user', () => {
            const bmf = new bmf_1.BiasedMatrixFactorization(8, 0.05, 0.01, 60);
            const ratings = [];
            for (let i = 0; i < 20; i++) {
                ratings.push({ userId: 1, eventId: 100, rating: 1 });
                ratings.push({ userId: 1, eventId: 200, rating: -1 });
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
            const bmf = new bmf_1.BiasedMatrixFactorization();
            expect(bmf.getTopNForUser(1, 5, [])).toEqual([]);
        });
        it('excludes events listed in excludeEventIds', () => {
            const bmf = new bmf_1.BiasedMatrixFactorization();
            bmf.train([
                { userId: 1, eventId: 1, rating: 1 },
                { userId: 1, eventId: 2, rating: 1 },
                { userId: 1, eventId: 3, rating: 1 },
            ]);
            const result = bmf.getTopNForUser(1, 10, [2]);
            expect(result).not.toContain(2);
        });
        it('never returns more than n results', () => {
            const bmf = new bmf_1.BiasedMatrixFactorization();
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
            const bmf = new bmf_1.BiasedMatrixFactorization(8, 0.05, 0.01, 50);
            const ratings = [];
            for (let i = 0; i < 15; i++) {
                ratings.push({ userId: 1, eventId: 1, rating: 1 });
                ratings.push({ userId: 1, eventId: 2, rating: -1 });
                ratings.push({ userId: 2, eventId: 1, rating: -1 });
                ratings.push({ userId: 2, eventId: 2, rating: 1 });
            }
            bmf.train(ratings);
            const topForUser1 = bmf.getTopNForUser(1, 2, []);
            expect(topForUser1[0]).toBe(1);
        });
    });
    describe('getPopularEvents', () => {
        it('returns an empty array when the model has not been trained', () => {
            const bmf = new bmf_1.BiasedMatrixFactorization();
            expect(bmf.getPopularEvents(5, [])).toEqual([]);
        });
        it('excludes events listed in excludeEventIds', () => {
            const bmf = new bmf_1.BiasedMatrixFactorization();
            bmf.train([
                { userId: 1, eventId: 1, rating: 1 },
                { userId: 2, eventId: 2, rating: 1 },
                { userId: 3, eventId: 3, rating: -1 },
            ]);
            const result = bmf.getPopularEvents(10, [1]);
            expect(result).not.toContain(1);
        });
        it('ranks events with higher bias (more positive ratings) first', () => {
            const bmf = new bmf_1.BiasedMatrixFactorization(4, 0.05, 0.01, 40);
            const ratings = [];
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
//# sourceMappingURL=bmf.spec.js.map