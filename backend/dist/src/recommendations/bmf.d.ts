interface Rating {
    userId: number;
    eventId: number;
    rating: number;
}
export declare class BiasedMatrixFactorization {
    private numFactors;
    private learningRate;
    private regularization;
    private epochs;
    private model;
    constructor(numFactors?: number, learningRate?: number, regularization?: number, epochs?: number);
    private randomVector;
    train(ratings: Rating[]): void;
    predict(userId: number, eventId: number): number;
    getTopNForUser(userId: number, n: number, excludeEventIds: number[]): number[];
    getPopularEvents(n: number, excludeEventIds: number[]): number[];
    isReady(): boolean;
}
export declare function loadRatingsFromCsv(filePath: string): Rating[];
export {};
