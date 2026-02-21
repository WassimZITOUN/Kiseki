import type { SupabaseClient } from "@supabase/supabase-js";
import type { Group, GroupMemberWithProfile, GroupWithMemberCount, QuestionIntensity } from "@my-app/types";
export declare function createGroupsService(supabase: SupabaseClient): {
    createGroup(name: string, options?: {
        maxMembers?: number;
        questionTime?: string;
        revealTime?: string;
        allowedIntensities?: QuestionIntensity[];
    }): Promise<Group>;
    joinGroupByCode(inviteCode: string): Promise<string>;
    getMyGroups(): Promise<GroupWithMemberCount[]>;
    getGroupDetail(groupId: string): Promise<{
        group: Group;
        members: GroupMemberWithProfile[];
    }>;
    leaveGroup(groupId: string): Promise<void>;
    removeMember(groupId: string, userId: string): Promise<void>;
};
