import type { SupabaseClient } from "@supabase/supabase-js";
import type { MyNextSlotResponse, QuestionIntensity } from "@my-app/types";
export declare function createSubmissionsService(supabase: SupabaseClient): {
    getMyNextSlot(groupId: string): Promise<MyNextSlotResponse>;
    submitQuestion(slotId: string, groupId: string, questionText: string | null, options?: {
        intensity?: QuestionIntensity;
        tagId?: string;
        chooseBank?: boolean;
    }): Promise<any>;
    adminReplaceQuestion(groupId: string, dailyQuestionId: string): Promise<void>;
    hasAdminReplacedToday(groupId: string): Promise<boolean>;
};
