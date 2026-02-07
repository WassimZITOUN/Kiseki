"use client";

import { View, TouchableOpacity } from "react-native";
import {
  GlassBottomSheet,
  KText,
  KAvatar,
  colors,
  spacing,
  radii,
} from "@repo/ui";
import type { Profile } from "@my-app/types";

type IndividualVote = {
  voter: Profile;
  target: Profile;
  context_note: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  votes: IndividualVote[];
  question: string;
};

export function VoteDetailsSheet({
  visible,
  onClose,
  votes,
  question,
}: Props) {
  // Group votes by target, sorted by vote count descending
  const grouped = votes.reduce<Map<string, IndividualVote[]>>((acc, vote) => {
    const key = vote.target.id;
    const list = acc.get(key) ?? [];
    list.push(vote);
    acc.set(key, list);
    return acc;
  }, new Map());

  const sortedGroups = Array.from(grouped.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  return (
    <GlassBottomSheet visible={visible} onClose={onClose}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing.sm,
        }}
      >
        <KText variant="h3" style={{ flex: 1 }}>
          Detail des votes
        </KText>
        <TouchableOpacity
          onPress={onClose}
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: radii.full,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <KText variant="bodySmall" color={colors.textPrimary}>
            Fermer
          </KText>
        </TouchableOpacity>
      </View>

      {/* Question */}
      <KText
        variant="bodySmall"
        color={colors.textPrimary}
        style={{
          fontStyle: "italic",
          marginBottom: spacing.md,
          fontWeight: "700",
        }}
      >
        {question}
      </KText>

      {/* Votes grouped by target */}
      {sortedGroups.map(([targetId, targetVotes], groupIndex) => {
        const target = targetVotes[0].target;
        const targetName = target.display_name ?? target.username;

        return (
          <View key={targetId}>
            {/* Target section header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: spacing.sm,
                marginTop: groupIndex > 0 ? spacing.sm : 0,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(139,92,246,0.2)",
              }}
            >
              <KAvatar
                uri={target.avatar_url}
                name={targetName}
                size={28}
              />
              <KText
                color={colors.violet[500]}
                variant="body"
                style={{
                  marginLeft: spacing.xs,
                  fontWeight: "700",
                  flex: 1,
                  textShadowColor: colors.violet[900],
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 3,
                }}
              >
                {targetName}
              </KText>
              <View
                style={{
                  backgroundColor: "rgba(139, 92, 246, 0.2)",
                  borderRadius: radii.full,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <KText
                  variant="caption"
                  color={colors.violet[300]}
                  style={{ fontWeight: "600" }}
                >
                  {targetVotes.length} vote{targetVotes.length > 1 ? "s" : ""}
                </KText>
              </View>
            </View>

            {/* Individual votes for this target */}
            {targetVotes.map((vote, voteIndex) => {
              const voterName = vote.voter.display_name ?? vote.voter.username;
              return (
                <View
                  key={`${vote.voter.id}-${voteIndex}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    paddingVertical: spacing.sm,
                    paddingLeft: spacing.md,
                    borderBottomWidth: voteIndex < targetVotes.length - 1 ? 1 : 0,
                    borderBottomColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <KAvatar
                    uri={vote.voter.avatar_url}
                    name={voterName}
                    size={24}
                  />
                  <View style={{ marginLeft: spacing.xs, flex: 1 }}>
                    <KText 
                    variant="bodySmall" 
                    color={colors.violet[300]}
                    style={{ fontWeight: "500" }}>
                      {voterName}
                    </KText>
                    {vote.context_note && (
                      <KText
                        variant="caption"
                        color={colors.textPrimary}
                        style={{ fontStyle: "italic", marginTop: 2 }}
                      >
                        "{vote.context_note}"
                      </KText>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}

      {votes.length === 0 && (
        <KText
          variant="body"
          color={colors.textMuted}
          style={{ textAlign: "center", paddingVertical: spacing.lg }}
        >
          Aucun vote
        </KText>
      )}
    </GlassBottomSheet>
  );
}
