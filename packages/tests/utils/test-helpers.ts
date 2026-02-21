import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Crée un groupe de test et retourne son ID
 */
export async function createTestGroup(
  client: SupabaseClient,
  name: string,
  options?: {
    maxMembers?: number;
    questionTime?: string;
    revealTime?: string;
    allowedIntensities?: string[];
  }
): Promise<string> {
  const { data, error } = await client.rpc("create_group", {
    p_name: name,
    p_max_members: options?.maxMembers ?? 12,
    p_question_time: options?.questionTime ?? "09:00",
    p_reveal_time: options?.revealTime ?? "20:00",
    p_allowed_intensities: options?.allowedIntensities ?? ["normal"],
  });

  if (error) {
    throw new Error(`Failed to create group: ${error.message}`);
  }

  return data.id;
}

/**
 * Rejoindre un groupe avec un code d'invitation
 */
export async function joinGroupByCode(
  client: SupabaseClient,
  inviteCode: string
): Promise<string> {
  const { data, error } = await client.rpc("join_group_by_code", {
    p_invite_code: inviteCode,
  });

  if (error) {
    throw new Error(`Failed to join group: ${error.message}`);
  }

  return data;
}

/**
 * Obtenir le prochain slot d'un utilisateur
 */
export async function getMyNextSlot(
  client: SupabaseClient,
  groupId: string
): Promise<any> {
  const { data, error } = await client.rpc("get_my_next_slot", {
    p_group_id: groupId,
  });

  if (error) {
    throw new Error(`Failed to get next slot: ${error.message}`);
  }

  return data;
}

/**
 * Soumettre une question pour un slot
 */
export async function submitQuestion(
  client: SupabaseClient,
  slotId: string,
  groupId: string,
  questionText: string | null,
  options?: {
    intensity?: "normal" | "epice";
    tagId?: string;
    chooseBank?: boolean;
  }
): Promise<void> {
  const { data: user } = await client.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { error } = await client.from("user_submissions").insert({
    slot_id: slotId,
    group_id: groupId,
    submitted_by: user.user.id,
    question_text: options?.chooseBank ? null : questionText,
    choose_bank: options?.chooseBank ?? false,
    intensity: options?.intensity ?? "normal",
    tag_id: options?.tagId ?? null,
  });

  if (error) {
    throw new Error(`Failed to submit question: ${error.message}`);
  }
}

/**
 * Activer les slots quotidiens (simuler le cron)
 */
export async function activateDailySlots(client: SupabaseClient): Promise<void> {
  const { error } = await client.rpc("activate_daily_slots" as any);

  if (error) {
    throw new Error(`Failed to activate daily slots: ${error.message}`);
  }
}

/**
 * Révéler les questions dues (simuler le cron)
 */
export async function revealDueQuestions(client: SupabaseClient): Promise<void> {
  const { error } = await client.rpc("reveal_due_questions" as any);

  if (error) {
    throw new Error(`Failed to reveal due questions: ${error.message}`);
  }
}

/**
 * Obtenir la question du jour pour un groupe
 */
export async function getTodayQuestion(
  client: SupabaseClient,
  groupId: string
): Promise<any> {
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from("daily_questions")
    .select("*")
    .eq("group_id", groupId)
    .in("status", ["active", "revealed"])
    .gte("created_at", twoDaysAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get today question: ${error.message}`);
  }

  return data;
}

/**
 * Voter pour un membre sur une question
 */
export async function submitVote(
  client: SupabaseClient,
  questionId: string,
  targetUserId: string,
  contextNote?: string
): Promise<void> {
  const { data: user } = await client.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { error } = await client.from("votes").insert({
    question_id: questionId,
    voter_id: user.user.id,
    target_user_id: targetUserId,
    context_note: contextNote ?? null,
  });

  if (error) {
    throw new Error(`Failed to submit vote: ${error.message}`);
  }
}

/**
 * Obtenir les détails d'un groupe avec invite_code
 */
export async function getGroupDetails(
  client: SupabaseClient,
  groupId: string
): Promise<any> {
  const { data, error } = await client
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (error) {
    throw new Error(`Failed to get group details: ${error.message}`);
  }

  return data;
}

/**
 * Obtenir tous les slots d'un groupe
 */
export async function getGroupSlots(
  client: SupabaseClient,
  groupId: string
): Promise<any[]> {
  const { data, error } = await client
    .from("daily_slots")
    .select("*")
    .eq("group_id", groupId)
    .order("target_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to get group slots: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Obtenir toutes les soumissions d'un cycle
 */
export async function getCycleSubmissions(
  client: SupabaseClient,
  groupId: string,
  cycleNumber: number
): Promise<any[]> {
  const { data, error } = await client
    .from("user_submissions")
    .select(`
      *,
      daily_slots!inner(cycle_number)
    `)
    .eq("group_id", groupId)
    .eq("daily_slots.cycle_number", cycleNumber);

  if (error) {
    throw new Error(`Failed to get cycle submissions: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Remplacer une question (admin)
 */
export async function adminReplaceQuestion(
  client: SupabaseClient,
  groupId: string,
  dailyQuestionId: string
): Promise<void> {
  const { error } = await client.rpc("admin_replace_question", {
    p_group_id: groupId,
    p_daily_question_id: dailyQuestionId,
  });

  if (error) {
    throw new Error(`Failed to replace question: ${error.message}`);
  }
}

/**
 * Attendre X millisecondes (helper pour simuler les délais)
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
