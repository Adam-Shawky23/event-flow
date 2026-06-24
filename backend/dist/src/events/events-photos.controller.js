"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventPhotosController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const get_user_decorator_1 = require("../auth/get-user.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
let EventPhotosController = class EventPhotosController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async uploadPhoto(id, file, user) {
        const event = await this.prisma.event.findUnique({ where: { id } });
        if (!event)
            throw new common_1.BadRequestException('Event not found');
        if (event.organizerId !== user.sub)
            throw new common_1.BadRequestException('Not your event');
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        return this.prisma.eventPhoto.create({
            data: { filename: file.filename, eventId: id },
        });
    }
    async deletePhoto(id, photoId, user) {
        const event = await this.prisma.event.findUnique({ where: { id } });
        if (!event)
            throw new common_1.BadRequestException('Event not found');
        if (event.organizerId !== user.sub)
            throw new common_1.BadRequestException('Not your event');
        return this.prisma.eventPhoto.delete({ where: { id: photoId } });
    }
};
exports.EventPhotosController = EventPhotosController;
__decorate([
    (0, common_1.Post)(':id/photos'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, uniqueSuffix + (0, path_1.extname)(file.originalname));
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return cb(new common_1.BadRequestException('Only image files are allowed'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], EventPhotosController.prototype, "uploadPhoto", null);
__decorate([
    (0, common_1.Delete)(':id/photos/:photoId'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('photoId', common_1.ParseIntPipe)),
    __param(2, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], EventPhotosController.prototype, "deletePhoto", null);
exports.EventPhotosController = EventPhotosController = __decorate([
    (0, common_1.Controller)('events'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ORGANIZER', 'ADMIN'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventPhotosController);
//# sourceMappingURL=events-photos.controller.js.map