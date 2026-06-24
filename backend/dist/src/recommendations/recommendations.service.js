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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RecommendationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bmf_1 = require("./bmf");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let RecommendationsService = RecommendationsService_1 = class RecommendationsService {
    prisma;
    logger = new common_1.Logger(RecommendationsService_1.name);
    bmf;
    datasetUserToInternal = new Map();
    datasetEventToInternal = new Map();
    constructor(prisma) {
        this.prisma = prisma;
        this.bmf = new bmf_1.BiasedMatrixFactorization(10, 0.01, 0.02, 20);
    }
    async onModuleInit() {
        await this.trainModel();
    }
    async trainModel() {
        try {
            const csvPath = path.join(process.cwd(), 'event_interest.csv');
            if (!fs.existsSync(csvPath)) {
                this.logger.warn('event_interest.csv not found, skipping BMF training');
                return;
            }
            this.logger.log('Loading ratings from CSV...');
            const ratings = (0, bmf_1.loadRatingsFromCsv)(csvPath);
            this.logger.log(`Loaded ${ratings.length} ratings, training BMF...`);
            this.bmf.train(ratings);
            this.logger.log('BMF training complete');
        }
        catch (err) {
            this.logger.error('BMF training failed', err);
        }
    }
    async getRecommendations(userId, limit = 6) {
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
        if (publishedEvents.length === 0)
            return [];
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
        const eventScores = [];
        for (const event of publishedEvents) {
            if (bookedEventIds.includes(event.id))
                continue;
            let score;
            if (hasHistory) {
                score = this.bmf.predict(userId % 37000, event.id % 300000);
            }
            else {
                score = this.bmf.predict(0, event.id % 300000);
            }
            eventScores.push({ event, score });
        }
        if (eventScores.length === 0)
            return publishedEvents.slice(0, limit);
        return eventScores
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((s) => s.event);
    }
};
exports.RecommendationsService = RecommendationsService;
exports.RecommendationsService = RecommendationsService = RecommendationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecommendationsService);
//# sourceMappingURL=recommendations.service.js.map