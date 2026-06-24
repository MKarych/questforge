import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UserRequest } from '../../common/types/user-request.type';
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    create(req: UserRequest, dto: CreateSessionDto): Promise<{
        sessionId: string;
        teamId: string;
        teamName: string;
        currentNode: {
            id: string;
            type: string;
            title: string;
            description: string;
        };
        score: number;
        status: import("../../engine/types/engine.types").TeamStatus;
        startedAt: Date;
    }>;
    submitAnswer(teamId: string, gameId: string, answer: string, nodeId: string): Promise<{
        status: string;
        score: number;
        penalties: number;
        message: string;
        nextNode: {
            id: string;
            type: import("../../engine/types/engine.types").NodeType;
            title: string;
            description: string;
        } | null;
        history: import("../../engine/types/engine.types").SessionHistoryEntry[];
        totalTime: number;
    }>;
    getState(teamId: string): Promise<{
        sessionId: string;
        teamId: string;
        teamName: string;
        currentNodeId: string;
        score: number;
        penalties: number;
        status: import("../../engine/types/engine.types").TeamStatus;
        startedAt: Date;
        finishedAt: Date | undefined;
        history: import("../../engine/types/engine.types").SessionHistoryEntry[];
    }>;
    finish(teamId: string): Promise<{
        id: string;
        version: number;
        createdAt: Date;
        name: string;
        description: string | null;
        city: string | null;
        status: import(".prisma/client").$Enums.TeamStatus;
        finishedAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
        penalties: number;
        score: number;
        slug: string;
        avatar: string | null;
        banner: string | null;
        country: string | null;
        website: string | null;
        socials: import("@prisma/client/runtime/library").JsonValue;
        captainId: string;
        privacy: import(".prisma/client").$Enums.TeamVisibility;
        joinPolicy: import(".prisma/client").$Enums.JoinPolicy;
        tags: string[];
        maxMembers: number;
        maxInvitesPerDay: number;
        maxPendingRequests: number;
        maxChatMessagesPerMinute: number;
    }>;
}
//# sourceMappingURL=sessions.controller.d.ts.map