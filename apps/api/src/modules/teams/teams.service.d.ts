import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { TeamStatus } from './types/team-types';
export declare class TeamsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateTeamDto): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        captain: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        members: {
            id: string;
            name: string;
            avatarUrl: string | null;
            role: import(".prisma/client").$Enums.TeamRole;
            joinedAt: Date;
        }[];
        membersCount: number;
        createdAt: Date;
    }>;
    findAll(query: {
        city?: string;
        status?: TeamStatus;
        search?: string;
        tags?: string[];
        limit?: number;
        offset?: number;
    }): Promise<{
        items: {
            id: string;
            name: string;
            slug: string;
            avatar: string | null;
            description: string | null;
            city: string | null;
            captain: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
            membersCount: number;
            status: import(".prisma/client").$Enums.TeamStatus;
            tags: string[];
            createdAt: Date;
        }[];
        total: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        avatar: string | null;
        banner: string | null;
        description: string | null;
        city: string | null;
        country: string | null;
        website: string | null;
        socials: import("@prisma/client/runtime/library").JsonValue;
        captain: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        members: {
            id: string;
            name: string;
            avatarUrl: string | null;
            role: import(".prisma/client").$Enums.TeamRole;
            joinedAt: Date;
        }[];
        membersCount: number;
        status: import(".prisma/client").$Enums.TeamStatus;
        privacy: import(".prisma/client").$Enums.TeamVisibility;
        joinPolicy: import(".prisma/client").$Enums.JoinPolicy;
        tags: string[];
        createdAt: Date;
    }>;
    findPrivate(id: string, userId: string): Promise<{
        id: string;
        name: string;
        slug: string;
        avatar: string | null;
        banner: string | null;
        description: string | null;
        city: string | null;
        country: string | null;
        website: string | null;
        socials: import("@prisma/client/runtime/library").JsonValue;
        captain: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        members: {
            id: string;
            name: string;
            avatarUrl: string | null;
            role: import(".prisma/client").$Enums.TeamRole;
            joinedAt: Date;
        }[];
        membersCount: number;
        status: import(".prisma/client").$Enums.TeamStatus;
        privacy: import(".prisma/client").$Enums.TeamVisibility;
        joinPolicy: import(".prisma/client").$Enums.JoinPolicy;
        tags: string[];
        settings: {
            privacy: import(".prisma/client").$Enums.TeamVisibility;
            joinPolicy: import(".prisma/client").$Enums.JoinPolicy;
            limits: {
                maxMembers: number;
                maxInvitesPerDay: number;
                maxPendingRequests: number;
                maxChatMessagesPerMinute: number;
            };
        };
        invites: {
            id: string;
            invitedUser: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
            status: import(".prisma/client").$Enums.InviteStatus;
            createdAt: Date;
            expiresAt: Date;
        }[];
        joinRequests: {
            id: string;
            user: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
            message: string | null;
            status: import(".prisma/client").$Enums.JoinRequestStatus;
            createdAt: Date;
        }[];
        createdAt: Date;
    }>;
    update(actorId: string, teamId: string, dto: UpdateTeamDto): Promise<{
        id: string;
        name: string;
        slug: string;
        avatar: string | null;
        banner: string | null;
        description: string | null;
        city: string | null;
        country: string | null;
        website: string | null;
        socials: import("@prisma/client/runtime/library").JsonValue;
        captain: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        members: {
            id: string;
            name: string;
            avatarUrl: string | null;
            role: import(".prisma/client").$Enums.TeamRole;
            joinedAt: Date;
        }[];
        membersCount: number;
        status: import(".prisma/client").$Enums.TeamStatus;
        privacy: import(".prisma/client").$Enums.TeamVisibility;
        joinPolicy: import(".prisma/client").$Enums.JoinPolicy;
        tags: string[];
        createdAt: Date;
    }>;
    delete(actorId: string, teamId: string): Promise<{
        message: string;
    }>;
    addMember(actorId: string, teamId: string, userId: string): Promise<{
        id: string;
        name: string;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.TeamRole;
        joinedAt: Date;
    }>;
    removeMember(actorId: string, teamId: string, targetUserId: string): Promise<{
        message: string;
    }>;
    updateMemberRole(actorId: string, teamId: string, targetUserId: string, dto: UpdateMemberRoleDto): Promise<{
        message: string;
    }>;
    leave(userId: string, teamId: string): Promise<{
        message: string;
    }>;
    getMyTeam(userId: string): Promise<{
        id: string;
        name: string;
        slug: string;
        avatar: string | null;
        description: string | null;
        captain: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        members: {
            id: string;
            name: string;
            avatarUrl: string | null;
            role: import(".prisma/client").$Enums.TeamRole;
            joinedAt: Date;
        }[];
        membersCount: number;
        myRole: import(".prisma/client").$Enums.TeamRole;
        joinedAt: Date;
    } | null>;
    getMyTeams(userId: string): Promise<{
        id: string;
        name: string;
        slug: string;
        avatar: string | null;
        description: string | null;
        captain: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        membersCount: number;
        myRole: import(".prisma/client").$Enums.TeamRole;
        joinedAt: Date;
    }[]>;
    getMembers(teamId: string): Promise<{
        id: string;
        name: string;
        avatarUrl: string | null;
        city: string | null;
        role: import(".prisma/client").$Enums.TeamRole;
        joinedAt: Date;
        lastActiveAt: Date | null;
    }[]>;
    getHistory(teamId: string): Promise<{
        id: string;
        action: string;
        actor: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        oldValue: import("@prisma/client/runtime/library").JsonValue;
        newValue: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
    }[]>;
    invite(actorId: string, teamId: string, dto: InviteUserDto): Promise<{
        id: string;
        invitedUser: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
        token: string;
        expiresAt: Date;
        message: string;
    }>;
    acceptInvite(userId: string, teamId: string, inviteId: string): Promise<{
        message: string;
    }>;
    declineInvite(userId: string, teamId: string, inviteId: string): Promise<{
        message: string;
    }>;
    createJoinRequest(userId: string, teamId: string, dto: CreateJoinRequestDto): Promise<{
        status: string;
        message: string;
        member: {
            id: string;
            name: string;
            avatarUrl: string | null;
            role: import(".prisma/client").$Enums.TeamRole;
            joinedAt: Date;
        };
        id?: undefined;
    } | {
        id: string;
        status: string;
        message: string;
        member?: undefined;
    }>;
    approveJoinRequest(actorId: string, teamId: string, requestId: string): Promise<{
        message: string;
    }>;
    rejectJoinRequest(actorId: string, teamId: string, requestId: string): Promise<{
        message: string;
    }>;
    transferOwnership(actorId: string, teamId: string, dto: TransferOwnershipDto): Promise<{
        id: string;
        message: string;
        expiresAt: Date;
    }>;
    acceptTransfer(userId: string, teamId: string): Promise<{
        message: string;
    }>;
    private getActiveTeam;
    private ensureCaptain;
    private createAuditLog;
}
//# sourceMappingURL=teams.service.d.ts.map