"use client";

import { View, TouchableOpacity, Image, Alert, Platform } from "react-native";
import type { Group, GroupMemberWithProfile } from "@my-app/types";
import {
  GlassBottomSheet,
  KText,
  KButton,
  KAvatar,
  colors,
  spacing,
  radii,
} from "@repo/ui";

type Props = {
  visible: boolean;
  onClose: () => void;
  members: GroupMemberWithProfile[];
  group: Group | null;
  leaving: boolean;
  onLeave: () => void;
  onCopyCode: () => void;
  codeCopied: boolean;
  currentUserId: string | null;
  onRemoveMember?: (userId: string, displayName: string) => void;
};

export function GroupMenu({
  visible,
  onClose,
  members,
  group,
  leaving,
  onLeave,
  onCopyCode,
  codeCopied,
  currentUserId,
  onRemoveMember,
}: Props) {
  if (!group) return null;

  const currentMember = members.find((m) => m.user_id === currentUserId);
  const isAdmin = currentMember?.role === "admin";

  const handleRemove = (member: GroupMemberWithProfile) => {
    const name =
      member.profiles?.display_name ??
      member.profiles?.username ??
      "Inconnu";
    if (Platform.OS === "web") {
      if (window.confirm(`Exclure ${name} du groupe ?`)) {
        onRemoveMember?.(member.user_id, name);
      }
    } else {
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
    } else {
      Alert.alert(
        "Quitter le groupe",
        "Es-tu sur de vouloir quitter ce groupe ?",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Quitter", style: "destructive", onPress: onLeave },
        ]
      );
    }
  };

  return (
    <GlassBottomSheet visible={visible} onClose={onClose}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing.md,
        }}
      >
        <KText variant="h3">{group.name}</KText>
        <TouchableOpacity onPress={onClose}>
          <KText variant="body" color={colors.textMuted}>
            Fermer
          </KText>
        </TouchableOpacity>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <KText variant="caption" color={colors.textSecondary}>
          Question : {group.question_time}
        </KText>
        <KText variant="caption" color={colors.textSecondary}>
          Reveal : {group.reveal_time}
        </KText>
        <KText variant="caption" color={colors.textSecondary}>
          Max : {group.max_members}
        </KText>
      </View>

      <KButton
        title={
          codeCopied
            ? "Code copie !"
            : `Copier le code : ${group.invite_code.toUpperCase()}`
        }
        onPress={onCopyCode}
        variant="glass"
        style={{ marginBottom: spacing.md }}
      />

      <KText
        variant="body"
        style={{
          fontWeight: "600",
          marginBottom: spacing.sm,
        }}
      >
        Membres ({members.length}/{group.max_members})
      </KText>

      {members.map((item) => (
        <View
          key={item.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.2)",
          }}
        >
          <KAvatar
            uri={item.profiles?.avatar_url}
            name={
              item.profiles?.display_name ??
              item.profiles?.username
            }
            size={32}
            style={{ marginRight: spacing.sm }}
          />
          <View style={{ flex: 1 }}>
            <KText variant="bodySmall" style={{ fontWeight: "500" }}>
              {item.profiles?.display_name ??
                item.profiles?.username ??
                "Inconnu"}
            </KText>
          </View>
          {item.role === "admin" && (
            <View
              style={{
                backgroundColor: colors.violet[100],
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: radii.full,
              }}
            >
              <KText variant="caption" color={colors.violet.primary}>
                Admin
              </KText>
            </View>
          )}
          {isAdmin && item.user_id !== currentUserId && (
            <TouchableOpacity
              onPress={() => handleRemove(item)}
              style={{
                marginLeft: spacing.sm,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: 4,
                backgroundColor: "rgba(229, 62, 62, 0.1)",
              }}
            >
              <KText variant="caption" color={colors.error}>
                Exclure
              </KText>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <KButton
        title={leaving ? "Depart..." : "Quitter le groupe"}
        onPress={handleLeave}
        disabled={leaving}
        variant="ghost"
        style={{ marginTop: spacing.md }}
      />
    </GlassBottomSheet>
  );
}
