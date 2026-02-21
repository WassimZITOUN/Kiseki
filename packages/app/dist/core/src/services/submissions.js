export function createSubmissionsService(supabase) {
    return {
        async getMyNextSlot(groupId) {
            const { data, error } = await supabase.rpc("get_my_next_slot", {
                p_group_id: groupId,
            });
            if (error)
                throw error;
            return (data ?? { has_upcoming_slot: false });
        },
        async submitQuestion(slotId, groupId, questionText, options) {
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user)
                throw new Error("Non authentifie");
            const chooseBank = options?.chooseBank ?? false;
            const { data, error } = await supabase
                .from("user_submissions")
                .insert({
                slot_id: slotId,
                group_id: groupId,
                submitted_by: user.id,
                question_text: chooseBank ? null : (questionText ?? "").trim(),
                choose_bank: chooseBank,
                intensity: options?.intensity ?? "normal",
                tag_id: options?.tagId ?? null,
                updated_at: new Date().toISOString(),
            })
                .select()
                .single();
            if (error)
                throw error;
            return data;
        },
        async adminReplaceQuestion(groupId, dailyQuestionId) {
            const { error } = await supabase.rpc("admin_replace_question", {
                p_group_id: groupId,
                p_daily_question_id: dailyQuestionId,
            });
            if (error)
                throw error;
        },
        async hasAdminReplacedToday(groupId) {
            const { count, error } = await supabase
                .from("daily_slots")
                .select("*", { count: "exact", head: true })
                .eq("group_id", groupId)
                .gte("admin_replaced_at", new Date().toISOString().split("T")[0]);
            if (error)
                throw error;
            return (count ?? 0) >= 1;
        },
    };
}
