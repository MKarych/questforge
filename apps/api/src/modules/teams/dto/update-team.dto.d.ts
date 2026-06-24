import { TeamVisibility, JoinPolicy } from '../types/team-types';
export declare class UpdateTeamDto {
    name?: string;
    description?: string;
    avatar?: string;
    banner?: string;
    city?: string;
    country?: string;
    website?: string;
    socials?: Record<string, string>;
    privacy?: TeamVisibility;
    joinPolicy?: JoinPolicy;
    tags?: string[];
    maxMembers?: number;
}
//# sourceMappingURL=update-team.dto.d.ts.map