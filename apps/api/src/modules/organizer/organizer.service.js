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
var OrganizerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
let OrganizerService = OrganizerService_1 = class OrganizerService {
    prisma;
    logger = new common_1.Logger(OrganizerService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async apply(userId, dto) {
        // Check if user already has an application
        const existingApplication = await this.prisma.organizerApplication.findUnique({
            where: { userId },
        });
        if (existingApplication) {
            throw new common_1.ConflictException('Заявка уже подана. Дождитесь решения.');
        }
        // Check if user is already an organizer
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        if (user.organizerStatus === client_1.OrganizerStatus.APPROVED || user.role === client_1.Role.ORGANIZER) {
            throw new common_1.ConflictException('Вы уже являетесь организатором');
        }
        // Create application
        const application = await this.prisma.organizerApplication.create({
            data: {
                ...dto,
                userId,
            },
        });
        // Update user status
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                organizerStatus: client_1.OrganizerStatus.PENDING,
                organizerApplicationId: application.id,
            },
        });
        this.logger.log(`Organizer application created: ${application.id} by user ${userId}`);
        return application;
    }
    async getStatus(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                organizerStatus: true,
                organizerApprovedAt: true,
                organizerApplication: {
                    select: {
                        id: true,
                        status: true,
                        rejectionReason: true,
                        reviewedAt: true,
                        city: true,
                        phone: true,
                        telegram: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        return {
            organizerStatus: user.organizerStatus,
            organizerApprovedAt: user.organizerApprovedAt,
            application: user.organizerApplication,
        };
    }
    async findAllApplications() {
        const applications = await this.prisma.organizerApplication.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        gamesCreated: true,
                        scenariosCreated: true,
                    },
                },
            },
        });
        return applications;
    }
    async reviewApplication(applicationId, status, rejectionReason, reviewedBy) {
        const application = await this.prisma.organizerApplication.findUnique({
            where: { id: applicationId },
        });
        if (!application) {
            throw new common_1.NotFoundException('Заявка не найдена');
        }
        if (application.status !== 'PENDING') {
            throw new common_1.ConflictException('Заявка уже рассмотрена');
        }
        // Update application
        const updatedApplication = await this.prisma.organizerApplication.update({
            where: { id: applicationId },
            data: {
                status,
                rejectionReason,
                reviewedBy,
                reviewedAt: new Date(),
            },
        });
        // Update user
        if (status === 'APPROVED') {
            await this.prisma.user.update({
                where: { id: application.userId },
                data: {
                    organizerStatus: client_1.OrganizerStatus.APPROVED,
                    role: client_1.Role.ORGANIZER,
                    organizerApprovedAt: new Date(),
                },
            });
            this.logger.log(`Application ${applicationId} approved. User ${application.userId} is now ORGANIZER`);
        }
        else {
            await this.prisma.user.update({
                where: { id: application.userId },
                data: {
                    organizerStatus: client_1.OrganizerStatus.REJECTED,
                },
            });
            this.logger.log(`Application ${applicationId} rejected. Reason: ${rejectionReason}`);
        }
        return updatedApplication;
    }
};
exports.OrganizerService = OrganizerService;
exports.OrganizerService = OrganizerService = OrganizerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizerService);
//# sourceMappingURL=organizer.service.js.map