import type { Response } from 'express';
import { ExportService } from './export.service';
export declare class ExportController {
    private exportService;
    constructor(exportService: ExportService);
    exportJson(res: Response): Promise<void>;
    exportXml(res: Response): Promise<void>;
}
