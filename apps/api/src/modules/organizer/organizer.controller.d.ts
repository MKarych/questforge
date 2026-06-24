import { OrganizerService } from './organizer.service';
import { CreateOrganizerApplicationDto } from './dto/create-organizer-application.dto';
import { UserRequest } from '../../common/types/user-request.type';
export declare class OrganizerController {
    private readonly organizerService;
    constructor(organizerService: OrganizerService);
    apply(req: UserRequest, dto: CreateOrganizerApplicationDto): Promise<{
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
    getStatus(req: UserRequest): Promise<{
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
    reviewApplication(id: string, body: {
        status: 'APPROVED' | 'REJECTED';
        rejectionReason?: string;
    }, req: UserRequest): Promise<{
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
//# sourceMappingURL=organizer.controller.d.ts.map