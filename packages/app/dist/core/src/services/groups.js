export function createGroupsService(supabase) {
    return {
        async createGroup(name, options) {
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user)
                throw new Error("Non authentifié");
            const { data, error } = await supabase.rpc("create_group", {
                p_name: name,
                p_max_members: options?.maxMembers ?? 12,
                p_question_time: options?.questionTime ?? "09:00",
                p_reveal_time: options?.revealTime ?? "20:00",
                p_allowed_intensities: options?.allowedIntensities ?? ["normal"],
            });
            if (error)
                throw error;
            return data;
        },
        async joinGroupByCode(inviteCode) {
            const { data, error } = await supabase.rpc("join_group_by_code", {
                p_invite_code: inviteCode.toLowerCase().trim(),
            });
            if (error)
                throw error;
            return data;
        },
        async getMyGroups() {
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user)
                throw new Error("Non authentifié");
            const { data: memberships, error: memberError } = await supabase
                .from("group_members")
                .select("group_id")
                .eq("user_id", user.id);
            if (memberError)
                throw memberError;
            if (!memberships || memberships.length === 0)
                return [];
            const ids = memberships.map((m) => m.group_id);
            const { data: groups, error: groupError } = await supabase
                .from("groups")
                .select("*, group_members(count)")
                .in("id", ids);
            if (groupError)
                throw groupError;
            return (groups ?? []).map((g) => ({
                ...g,
                member_count: g.group_members?.[0]?.count ?? 0,
            }));
        },
        async getGroupDetail(groupId) {
            const [groupResult, membersResult] = await Promise.all([
                supabase.from("groups").select("*").eq("id", groupId).single(),
                supabase
                    .from("group_members")
                    .select("*, profiles(*)")
                    .eq("group_id", groupId),
            ]);
            if (groupResult.error)
                throw groupResult.error;
            if (membersResult.error)
                throw membersResult.error;
            return {
                group: groupResult.data,
                members: (membersResult.data ?? []),
            };
        },
        async leaveGroup(groupId) {
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user)
                throw new Error("Non authentifié");
            const { error } = await supabase
                .from("group_members")
                .delete()
                .match({ group_id: groupId, user_id: user.id });
            if (error)
                throw error;
        },
        async removeMember(groupId, userId) {
            const { error } = await supabase
                .from("group_members")
                .delete()
                .match({ group_id: groupId, user_id: userId });
            if (error)
                throw error;
        },
    };
}
