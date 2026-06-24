import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOrganizerApplicationDto } from './dto/create-organizer-application.dto';
export declare class OrganizerService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    apply(userId: string, dto: CreateOrganizerApplicationDto): Promise<{
        id: string;
        createdAt: Date;
        city: string;
        status: string;
        updatedAt: Date;
        telegram: string | null;
        userId: string;
        phone: string;
        experience: string | null;
        rejectionReason: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    }>;
    getStatus(userId: string): Promise<{
        organizerStatus: import(".prisma/client").$Enums.OrganizerStatus;
        organizerApprovedAt: Date | null;
        application: {
            id: string;
            city: string;
            status: string;
            telegram: string | null;
            phone: string;
            rejectionReason: string | null;
            reviewedAt: Date | null;
        } | null;
    }>;
    findAllApplications(): Promise<({
        user: {
            id: string;
            name: string;
            email: string;
            gamesCreated: number;
            scenariosCreated: number;
        };
    } & {
        id: string;
        createdAt: Date;
        city: string;
        status: string;
        updatedAt: Date;
        telegram: string | null;
        userId: string;
        phone: string;
        experience: string | null;
        rejectionReason: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    })[]>;
    reviewApplication(applicationId: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string, reviewedBy?: string): Promise<{
        id: string;
        createdAt: Date;
        city: string;
        status: string;
        updatedAt: Date;
        telegram: string | null;
        userId: string;
        phone: string;
        experience: string | null;
        rejectionReason: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    }>;
}
//# sourceMappingURL=organizer.service.d.ts.map