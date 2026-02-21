import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyQuestion, Vote, QuestionWithResults } from "@my-app/types";
export declare function createVotesService(supabase: SupabaseClient): {
    getTodayQuestion(groupId: string): Promise<DailyQuestion | null>;
    getMyVote(questionId: string): Promise<Vote | null>;
    submitVote(questionId: string, targetUserId: string, contextNote?: string): Promise<Vote>;
    getQuestionResults(questionId: string): Promise<QuestionWithResults>;
};
