"use client";
import { View, TouchableOpacity, Alert, Platform } from "react-native";
import { GlassBottomSheet, KText, KButton, KAvatar, colors, spacing, radii, } from "@repo/ui";
export function GroupMenu({ visible, onClose, members, group, leaving, onLeave, onCopyCode, codeCopied, currentUserId, onRemoveMember, }) {
    if (!group)
        return null;
    const currentMember = members.find((m) => m.user_id === currentUserId);
    const isAdmin = currentMember?.role === "admin";
    const handleRemove = (member) => {
        const name = member.profiles?.display_name ??
            member.profiles?.username ??
            "Inconnu";
        if (Platform.OS === "web") {
            if (window.confirm(`Exclure ${name} du groupe ?`)) {
                onRemoveMember?.(member.user_id, name);
            }
        }
        else {
            Alert.alert("Exclure un membre", `Exclure ${name} du groupe ?`, [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Exclure",
                    style: "destructive",
                    onPress: () => onRemoveMember?.(member.user_id, name),
                },
            ]);
        }
    };
    const handleLeave = () => {
        if (Platform.OS === "web") {
            if (window.confirm("Quitter ce groupe ?")) {
                onLeave();
            }
        }
        else {
            Alert.alert("Quitter le groupe", "Es-tu sur de vouloir quitter ce groupe ?", [
                { text: "Annuler", style: "cancel" },
                { text: "Quitter", style: "destructive", onPress: onLeave },
            ]);
        }
    };
    return (<GlassBottomSheet visible={visible} onClose={onClose}>
      {/* Header */}
      <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: spacing.md,
        }}>
        <KText variant="h3">{group.name}</KText>
        <TouchableOpacity onPress={onClose} style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: radii.full,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
        }}>
          <KText variant="bodySmall" color={colors.textMuted}>
            Fermer
          </KText>
        </TouchableOpacity>
      </View>

      {/* Group info pills */}
      <View style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.xs,
            marginBottom: spacing.md,
        }}>
        <View style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.15)",
            borderRadius: radii.full,
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
        }}>
          <KText variant="caption" color={colors.textSecondary}>
            Question : {group.question_time}
          </KText>
        </View>
        <View style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.15)",
            borderRadius: radii.full,
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
        }}>
          <KText variant="caption" color={colors.textSecondary}>
            Reveal : {group.reveal_time}
          </KText>
        </View>
        <View style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.15)",
            borderRadius: radii.full,
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
        }}>
          <KText variant="caption" color={colors.textSecondary}>
            Max : {group.max_members}
          </KText>
        </View>
      </View>

      {/* Copy code button */}
      <KButton title={codeCopied
            ? "Code copié !"
            : `Copier le code : ${group.invite_code.toUpperCase()}`} onPress={onCopyCode} variant="glass" style={{ marginBottom: spacing.md }}/>

      {/* Members section */}
      <KText variant="body" style={{
            fontWeight: "600",
            marginBottom: spacing.sm,
        }}>
        Membres ({members.length}/{group.max_members})
      </KText>

      {/* Members list */}
      {members.map((item, index) => (<View key={item.id} style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: spacing.sm,
                borderBottomWidth: index < members.length - 1 ? 1 : 0,
                borderBottomColor: "rgba(255,255,255,0.1)",
            }}>
          <KAvatar uri={item.profiles?.avatar_url} name={item.profiles?.display_name ??
                item.profiles?.username} size={36} style={{ marginRight: spacing.sm }}/>
          <View style={{ flex: 1 }}>
            <KText variant="bodySmall" style={{ fontWeight: "500" }}>
              {item.profiles?.display_name ??
                item.profiles?.username ??
                "Inconnu"}
            </KText>
          </View>
          {item.role === "admin" && (<View style={{
                    backgroundColor: "rgba(149, 114, 207, 0.15)",
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 3,
                    borderRadius: radii.full,
                    borderWidth: 1,
                    borderColor: "rgba(149, 114, 207, 0.3)",
                }}>
              <KText variant="caption" color={colors.violet.primary}>
                Admin
              </KText>
            </View>)}
          {isAdmin && item.user_id !== currentUserId && (<TouchableOpacity onPress={() => handleRemove(item)} style={{
                    marginLeft: spacing.sm,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: radii.full,
                    backgroundColor: "rgba(229, 62, 62, 0.1)",
                    borderWidth: 1,
                    borderColor: "rgba(229, 62, 62, 0.2)",
                }}>
              <KText variant="caption" color={colors.error}>
                Exclure
              </KText>
            </TouchableOpacity>)}
        </View>))}

      {/* Leave button */}
      <KButton title={leaving ? "Départ..." : "Quitter le groupe"} onPress={handleLeave} disabled={leaving} variant="ghost" style={{ marginTop: spacing.lg }}/>
    </GlassBottomSheet>);
}
