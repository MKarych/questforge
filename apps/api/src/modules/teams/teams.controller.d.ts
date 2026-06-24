import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UserRequest } from '../../common/types/user-request.type';
export declare class TeamsController {
    private readonly teamsService;
    constructor(teamsService: TeamsService);
    create(req: UserRequest, dto: CreateTeamDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    findAll(city?: string, search?: string, status?: string, tags?: string, limit?: number, offset?: number): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getMyTeam(req: UserRequest): Promise<{
        success: boolean;
        data: {
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
        } | null;
    }>;
    getMyTeams(req: UserRequest): Promise<{
        success: boolean;
        data: {
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
        }[];
    }>;
    findOne(id: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    findPrivate(req: UserRequest, id: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    update(req: UserRequest, id: string, dto: UpdateTeamDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    delete(req: UserRequest, id: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    getMembers(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            avatarUrl: string | null;
            city: string | null;
            role: import(".prisma/client").$Enums.TeamRole;
            joinedAt: Date;
            lastActiveAt: Date | null;
        }[];
    }>;
    updateMemberRole(req: UserRequest, id: string, userId: string, dto: UpdateMemberRoleDto): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    removeMember(req: UserRequest, id: string, userId: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    createJoinRequest(req: UserRequest, id: string, dto: CreateJoinRequestDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    approveJoinRequest(req: UserRequest, id: string, requestId: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    rejectJoinRequest(req: UserRequest, id: string, requestId: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    leave(req: UserRequest, id: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    invite(req: UserRequest, id: string, dto: InviteUserDto): Promise<{
        success: boolean;
        data: {
            id: string;
            invitedUser: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
            token: string;
            expiresAt: Date;
            message: string;
        };
    }>;
    acceptInvite(req: UserRequest, id: string, inviteId: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    declineInvite(req: UserRequest, id: string, inviteId: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    transferOwnership(req: UserRequest, id: string, dto: TransferOwnershipDto): Promise<{
        success: boolean;
        data: {
            id: string;
            message: string;
            expiresAt: Date;
        };
    }>;
    acceptTransfer(req: UserRequest, id: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    getHistory(id: string): Promise<{
        success: boolean;
        data: {
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
        }[];
    }>;
}
//# sourceMappingURL=teams.controller.d.ts.map