export declare enum TeamStatus {
    ACTIVE = "ACTIVE",
    RECRUITING = "RECRUITING",
    INACTIVE = "INACTIVE",
    ARCHIVED = "ARCHIVED",
    DELETED = "DELETED"
}
export declare enum TeamVisibility {
    PUBLIC = "PUBLIC",
    UNLISTED = "UNLISTED",
    PRIVATE = "PRIVATE",
    ARCHIVED = "ARCHIVED"
}
export declare enum JoinPolicy {
    OPEN = "OPEN",
    APPROVAL = "APPROVAL",
    INVITE_ONLY = "INVITE_ONLY"
}
export declare enum TeamRole {
    CAPTAIN = "CAPTAIN",
    VICE_CAPTAIN = "VICE_CAPTAIN",
    MEMBER = "MEMBER",
    RECRUIT = "RECRUIT"
}
export declare enum MemberStatus {
    ACTIVE = "ACTIVE",
    PENDING = "PENDING",
    LEFT = "LEFT",
    KICKED = "KICKED"
}
export declare enum InviteStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    DECLINED = "DECLINED",
    EXPIRED = "EXPIRED",
    REVOKED = "REVOKED"
}
export declare enum JoinRequestStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED"
}
export declare enum TransferStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED",
    EXPIRED = "EXPIRED"
}
export declare enum TeamDomainEvent {
    TeamCreated = "team.created",
    TeamUpdated = "team.updated",
    TeamArchived = "team.archived",
    TeamRestored = "team.restored",
    TeamDeleted = "team.deleted",
    MemberJoined = "team.member.joined",
    MemberLeft = "team.member.left",
    MemberKicked = "team.member.kicked",
    MemberPromoted = "team.member.promoted",
    MemberDemoted = "team.member.demoted",
    CaptainChanged = "team.captain.changed",
    OwnershipTransferred = "team.ownership.transferred",
    InviteSent = "team.invite.sent",
    InviteAccepted = "team.invite.accepted",
    InviteDeclined = "team.invite.declined",
    InviteRevoked = "team.invite.revoked",
    JoinRequestCreated = "team.join.request.created",
    JoinRequestApproved = "team.join.request.approved",
    JoinRequestRejected = "team.join.request.rejected",
    SettingsChanged = "team.settings.changed",
    VisibilityChanged = "team.visibility.changed",
    StatsUpdated = "team.stats.updated"
}
export interface TeamEventPayload {
    teamId: string;
    timestamp: Date;
    actorId: string;
}
export interface TeamCreatedPayload extends TeamEventPayload {
    name: string;
    slug: string;
    captainId: string;
}
export interface TeamMemberEventPayload extends TeamEventPayload {
    userId: string;
    role: TeamRole;
}
export interface TeamInviteEventPayload extends TeamEventPayload {
    inviteId: string;
    invitedUserId: string;
}
export interface TeamJoinRequestEventPayload extends TeamEventPayload {
    requestId: string;
    userId: string;
}
export interface TeamTransferEventPayload extends TeamEventPayload {
    transferId: string;
    fromUserId: string;
    toUserId: string;
}
export interface TeamLimits {
    maxMembers: number;
    maxInvitesPerDay: number;
    maxPendingRequests: number;
    maxChatMessagesPerMinute: number;
}
export interface TeamSettings {
    privacy: TeamVisibility;
    joinPolicy: JoinPolicy;
    limits: TeamLimits;
}
export interface TeamProfile {
    name: string;
    avatar: string | null;
    banner: string | null;
    description: string | null;
    city: string | null;
    country: string | null;
    website: string | null;
    socials: Record<string, string>;
}
export interface TeamStats {
    score: number;
    penalties: number;
    gamesPlayed: number;
    gamesWon: number;
    rating: number;
    trustScore: number;
}
export declare enum TeamCapability {
    PARTICIPATE_GAMES = "PARTICIPATE_GAMES",
    HOST_GAMES = "HOST_GAMES",
    PUBLISH_SCENARIOS = "PUBLISH_SCENARIOS",
    MARKETPLACE = "MARKETPLACE",
    VERIFIED_TEAM = "VERIFIED_TEAM",
    PREMIUM = "PREMIUM",
    TOURNAMENT = "TOURNAMENT"
}
export interface TeamAuditLogEntry {
    id: string;
    teamId: string;
    actorId: string;
    action: string;
    entity: string;
    entityId: string;
    oldValue: Record<string, unknown> | null;
    newValue: Record<string, unknown> | null;
    createdAt: Date;
}
//# sourceMappingURL=team-types.d.ts.map