import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyQuestion, Vote } from "@my-app/types";

export function createVotesService(supabase: SupabaseClient) {
  return {
    async getTodayQuestion(groupId: string): Promise<DailyQuestion | null> {
      const today = new Date().toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("daily_questions")
        .select("*")
        .eq("group_id", groupId)
        .eq("status", "active")
        .gte("created_at", today)
        .single();

      if (error && error.code === "PGRST116") return null; // no rows
      if (error) throw error;
      return data as DailyQuestion;
    },

    async getMyVote(questionId: string): Promise<Vote | null> {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("votes")
        .select("*")
        .eq("question_id", questionId)
        .eq("voter_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Vote | null;
    },

    async submitVote(
      questionId: string,
      targetUserId: string,
      contextNote?: string
    ): Promise<Vote> {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("votes")
        .insert({
          question_id: questionId,
          voter_id: user.id,
          target_user_id: targetUserId,
          context_note: contextNote ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Vote;
    },

  };
}
