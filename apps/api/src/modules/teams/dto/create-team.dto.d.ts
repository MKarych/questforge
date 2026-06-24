import { TeamVisibility, JoinPolicy } from '../types/team-types';
export declare class CreateTeamDto {
    name: string;
    description?: string;
    slug?: string;
    city?: string;
    country?: string;
    website?: string;
    socials?: Record<string, string>;
    privacy?: TeamVisibility;
    joinPolicy?: JoinPolicy;
    tags?: string[];
}
//# sourceMappingURL=create-team.dto.d.ts.map