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
exports.BiasedMatrixFactorization = void 0;
exports.loadRatingsFromCsv = loadRatingsFromCsv;
const fs = __importStar(require("fs"));
class BiasedMatrixFactorization {
    numFactors;
    learningRate;
    regularization;
    epochs;
    model = null;
    constructor(numFactors = 10, learningRate = 0.01, regularization = 0.02, epochs = 20) {
        this.numFactors = numFactors;
        this.learningRate = learningRate;
        this.regularization = regularization;
        this.epochs = epochs;
    }
    randomVector(size) {
        return Array.from({ length: size }, () => (Math.random() - 0.5) * 0.1);
    }
    train(ratings) {
        if (ratings.length === 0)
            return;
        const userIds = [...new Set(ratings.map((r) => r.userId))];
        const eventIds = [...new Set(ratings.map((r) => r.eventId))];
        const globalBias = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        const userFactors = new Map();
        const eventFactors = new Map();
        const userBiases = new Map();
        const eventBiases = new Map();
        for (const uid of userIds) {
            userFactors.set(uid, this.randomVector(this.numFactors));
            userBiases.set(uid, 0);
        }
        for (const eid of eventIds) {
            eventFactors.set(eid, this.randomVector(this.numFactors));
            eventBiases.set(eid, 0);
        }
        for (let epoch = 0; epoch < this.epochs; epoch++) {
            const shuffled = [...ratings].sort(() => Math.random() - 0.5);
            for (const r of shuffled) {
                const uf = userFactors.get(r.userId);
                const ef = eventFactors.get(r.eventId);
                const ub = userBiases.get(r.userId);
                const eb = eventBiases.get(r.eventId);
                const dot = uf.reduce((sum, val, i) => sum + val * ef[i], 0);
                const predicted = globalBias + ub + eb + dot;
                const error = r.rating - predicted;
                userBiases.set(r.userId, ub + this.learningRate * (error - this.regularization * ub));
                eventBiases.set(r.eventId, eb + this.learningRate * (error - this.regularization * eb));
                const newUf = uf.map((val, i) => val +
                    this.learningRate * (error * ef[i] - this.regularization * val));
                const newEf = ef.map((val, i) => val +
                    this.learningRate * (error * uf[i] - this.regularization * val));
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
    predict(userId, eventId) {
        if (!this.model)
            return 0;
        const uf = this.model.userFactors.get(userId);
        const ef = this.model.eventFactors.get(eventId);
        const ub = this.model.userBiases.get(userId) ?? 0;
        const eb = this.model.eventBiases.get(eventId) ?? 0;
        if (!uf || !ef)
            return this.model.globalBias;
        const dot = uf.reduce((sum, val, i) => sum + val * ef[i], 0);
        return this.model.globalBias + ub + eb + dot;
    }
    getTopNForUser(userId, n, excludeEventIds) {
        if (!this.model)
            return [];
        const scores = [];
        for (const eventId of this.model.eventIndex) {
            if (excludeEventIds.includes(eventId))
                continue;
            scores.push({ eventId, score: this.predict(userId, eventId) });
        }
        return scores
            .sort((a, b) => b.score - a.score)
            .slice(0, n)
            .map((s) => s.eventId);
    }
    getPopularEvents(n, excludeEventIds) {
        if (!this.model)
            return [];
        const scores = [];
        for (const eventId of this.model.eventIndex) {
            if (excludeEventIds.includes(eventId))
                continue;
            const eb = this.model.eventBiases.get(eventId) ?? 0;
            scores.push({ eventId, score: this.model.globalBias + eb });
        }
        return scores
            .sort((a, b) => b.score - a.score)
            .slice(0, n)
            .map((s) => s.eventId);
    }
    isReady() {
        return this.model !== null;
    }
}
exports.BiasedMatrixFactorization = BiasedMatrixFactorization;
function loadRatingsFromCsv(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').slice(1);
    const ratings = [];
    for (const line of lines) {
        if (!line.trim())
            continue;
        const parts = line.split(',');
        const userId = parseInt(parts[0]);
        const eventId = parseInt(parts[1]);
        const interested = parseInt(parts[4]) || 0;
        const notInterested = parseInt(parts[5]) || 0;
        if (isNaN(userId) || isNaN(eventId))
            continue;
        let rating = 0;
        if (interested === 1)
            rating = 1;
        else if (notInterested === 1)
            rating = -1;
        else
            continue;
        ratings.push({ userId, eventId, rating });
    }
    return ratings;
}
//# sourceMappingURL=bmf.js.map