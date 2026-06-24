import { RecommendationsService } from './recommendations.service';
export declare class RecommendationsController {
    private recommendationsService;
    constructor(recommendationsService: RecommendationsService);
    getRecommendations(user: any): Promise<any[]>;
    getPublicRecommendations(): Promise<any[]>;
}
