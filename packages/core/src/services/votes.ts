import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyQuestion, Vote, Profile, QuestionWithResults, VoteResult } from "@my-app/types";

export function createVotesService(supabase: SupabaseClient) {
  return {
    async getTodayQuestion(groupId: string): Promise<DailyQuestion | null> {
      // Look back 48h so yesterday's verdict stays visible until the next question arrives
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("daily_questions")
        .select("*")
        .eq("group_id", groupId)
        .in("status", ["active", "revealed"])
        .gte("created_at", twoDaysAgo)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code === "PGRST116") {
        // No recent question: fall back to most recent question for this group
        const { data: fallback, error: fbErr } = await supabase
          .from("daily_questions")
          .select("*")
          .eq("group_id", groupId)
          .in("status", ["active", "revealed"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (fbErr && fbErr.code === "PGRST116") return null;
        if (fbErr) throw fbErr;
        return fallback as DailyQuestion;
      }
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

    async getQuestionResults(questionId: string): Promise<QuestionWithResults> {
      // 1. Fetch the question with its tag
      const { data: question, error: qErr } = await supabase
        .from("daily_questions")
        .select("*, tags(*)")
        .eq("id", questionId)
        .single();
      if (qErr) throw qErr;

      // 2. Fetch all votes with voter and target profiles
      const { data: votes, error: vErr } = await supabase
        .from("votes")
        .select("*, voter:profiles!votes_voter_id_fkey(*), target:profiles!votes_target_user_id_fkey(*)")
        .eq("question_id", questionId);
      if (vErr) throw vErr;

      const totalVotes = votes?.length ?? 0;

      // 3. Aggregate by target_user_id
      const byTarget = new Map<string, { target: Profile; voters: Profile[]; notes: string[]; count: number }>();
      for (const v of votes ?? []) {
        const existing = byTarget.get(v.target_user_id);
        const note = v.context_note as string | null;
        if (existing) {
          existing.count++;
          existing.voters.push(v.voter as Profile);
          if (note) existing.notes.push(note);
        } else {
          byTarget.set(v.target_user_id, {
            target: v.target as Profile,
            voters: [v.voter as Profile],
            notes: note ? [note] : [],
            count: 1,
          });
        }
      }

      // 4. Build sorted results
      const results = Array.from(byTarget.values())
        .sort((a, b) => b.count - a.count)
        .map((entry) => ({
          target_user_id: entry.target.id,
          target: entry.target,
          vote_count: entry.count,
          percentage: totalVotes > 0 ? Math.round((entry.count / totalVotes) * 100) : 0,
          voters: entry.voters,
          context_notes: entry.notes,
        }));

      // 5. Build individual votes list
      const individualVotes = (votes ?? []).map((v: any) => ({
        voter: v.voter as Profile,
        target: v.target as Profile,
        context_note: (v.context_note as string | null) ?? null,
      }));

      return {
        ...question,
        tag: question.tags ?? null,
        results,
        total_votes: totalVotes,
        votes: individualVotes,
      } as QuestionWithResults & { votes: typeof individualVotes };
    },

  };
}
