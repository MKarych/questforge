"use strict";
// ============================================================
// Team Module — Domain Types & Events
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamCapability = exports.TeamDomainEvent = exports.TransferStatus = exports.JoinRequestStatus = exports.InviteStatus = exports.MemberStatus = exports.TeamRole = exports.JoinPolicy = exports.TeamVisibility = exports.TeamStatus = void 0;
// === Enums (дублируются из Prisma для type-safe использования) ===
var TeamStatus;
(function (TeamStatus) {
    TeamStatus["ACTIVE"] = "ACTIVE";
    TeamStatus["RECRUITING"] = "RECRUITING";
    TeamStatus["INACTIVE"] = "INACTIVE";
    TeamStatus["ARCHIVED"] = "ARCHIVED";
    TeamStatus["DELETED"] = "DELETED";
})(TeamStatus || (exports.TeamStatus = TeamStatus = {}));
var TeamVisibility;
(function (TeamVisibility) {
    TeamVisibility["PUBLIC"] = "PUBLIC";
    TeamVisibility["UNLISTED"] = "UNLISTED";
    TeamVisibility["PRIVATE"] = "PRIVATE";
    TeamVisibility["ARCHIVED"] = "ARCHIVED";
})(TeamVisibility || (exports.TeamVisibility = TeamVisibility = {}));
var JoinPolicy;
(function (JoinPolicy) {
    JoinPolicy["OPEN"] = "OPEN";
    JoinPolicy["APPROVAL"] = "APPROVAL";
    JoinPolicy["INVITE_ONLY"] = "INVITE_ONLY";
})(JoinPolicy || (exports.JoinPolicy = JoinPolicy = {}));
var TeamRole;
(function (TeamRole) {
    TeamRole["CAPTAIN"] = "CAPTAIN";
    TeamRole["VICE_CAPTAIN"] = "VICE_CAPTAIN";
    TeamRole["MEMBER"] = "MEMBER";
    TeamRole["RECRUIT"] = "RECRUIT";
})(TeamRole || (exports.TeamRole = TeamRole = {}));
var MemberStatus;
(function (MemberStatus) {
    MemberStatus["ACTIVE"] = "ACTIVE";
    MemberStatus["PENDING"] = "PENDING";
    MemberStatus["LEFT"] = "LEFT";
    MemberStatus["KICKED"] = "KICKED";
})(MemberStatus || (exports.MemberStatus = MemberStatus = {}));
var InviteStatus;
(function (InviteStatus) {
    InviteStatus["PENDING"] = "PENDING";
    InviteStatus["ACCEPTED"] = "ACCEPTED";
    InviteStatus["DECLINED"] = "DECLINED";
    InviteStatus["EXPIRED"] = "EXPIRED";
    InviteStatus["REVOKED"] = "REVOKED";
})(InviteStatus || (exports.InviteStatus = InviteStatus = {}));
var JoinRequestStatus;
(function (JoinRequestStatus) {
    JoinRequestStatus["PENDING"] = "PENDING";
    JoinRequestStatus["APPROVED"] = "APPROVED";
    JoinRequestStatus["REJECTED"] = "REJECTED";
    JoinRequestStatus["CANCELLED"] = "CANCELLED";
})(JoinRequestStatus || (exports.JoinRequestStatus = JoinRequestStatus = {}));
var TransferStatus;
(function (TransferStatus) {
    TransferStatus["PENDING"] = "PENDING";
    TransferStatus["APPROVED"] = "APPROVED";
    TransferStatus["REJECTED"] = "REJECTED";
    TransferStatus["CANCELLED"] = "CANCELLED";
    TransferStatus["EXPIRED"] = "EXPIRED";
})(TransferStatus || (exports.TransferStatus = TransferStatus = {}));
// === Domain Events ===
var TeamDomainEvent;
(function (TeamDomainEvent) {
    TeamDomainEvent["TeamCreated"] = "team.created";
    TeamDomainEvent["TeamUpdated"] = "team.updated";
    TeamDomainEvent["TeamArchived"] = "team.archived";
    TeamDomainEvent["TeamRestored"] = "team.restored";
    TeamDomainEvent["TeamDeleted"] = "team.deleted";
    TeamDomainEvent["MemberJoined"] = "team.member.joined";
    TeamDomainEvent["MemberLeft"] = "team.member.left";
    TeamDomainEvent["MemberKicked"] = "team.member.kicked";
    TeamDomainEvent["MemberPromoted"] = "team.member.promoted";
    TeamDomainEvent["MemberDemoted"] = "team.member.demoted";
    TeamDomainEvent["CaptainChanged"] = "team.captain.changed";
    TeamDomainEvent["OwnershipTransferred"] = "team.ownership.transferred";
    TeamDomainEvent["InviteSent"] = "team.invite.sent";
    TeamDomainEvent["InviteAccepted"] = "team.invite.accepted";
    TeamDomainEvent["InviteDeclined"] = "team.invite.declined";
    TeamDomainEvent["InviteRevoked"] = "team.invite.revoked";
    TeamDomainEvent["JoinRequestCreated"] = "team.join.request.created";
    TeamDomainEvent["JoinRequestApproved"] = "team.join.request.approved";
    TeamDomainEvent["JoinRequestRejected"] = "team.join.request.rejected";
    TeamDomainEvent["SettingsChanged"] = "team.settings.changed";
    TeamDomainEvent["VisibilityChanged"] = "team.visibility.changed";
    TeamDomainEvent["StatsUpdated"] = "team.stats.updated";
})(TeamDomainEvent || (exports.TeamDomainEvent = TeamDomainEvent = {}));
// === Team Capabilities ===
var TeamCapability;
(function (TeamCapability) {
    TeamCapability["PARTICIPATE_GAMES"] = "PARTICIPATE_GAMES";
    TeamCapability["HOST_GAMES"] = "HOST_GAMES";
    TeamCapability["PUBLISH_SCENARIOS"] = "PUBLISH_SCENARIOS";
    TeamCapability["MARKETPLACE"] = "MARKETPLACE";
    TeamCapability["VERIFIED_TEAM"] = "VERIFIED_TEAM";
    TeamCapability["PREMIUM"] = "PREMIUM";
    TeamCapability["TOURNAMENT"] = "TOURNAMENT";
})(TeamCapability || (exports.TeamCapability = TeamCapability = {}));
//# sourceMappingURL=team-types.js.map