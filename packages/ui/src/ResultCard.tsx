"use client";

import { useState } from "react";
import {
  View,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { GlassCard } from "./GlassCard";
import { KAvatar } from "./KAvatar";
import { KText } from "./KText";
import { colors, spacing, radii } from "./tokens";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type ResultItem = {
  userId: string;
  name: string;
  avatarUri?: string | null;
  voteCount: number;
  percentage: number;
  comments: string[];
};

type Props = {
  item: ResultItem;
  rank: number;
  delay?: number;
};

export function ResultCard({ item, rank, delay = 0 }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasComments = item.comments.length > 0;

  const handlePress = () => {
    if (!hasComments) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(400)}
      style={{ marginBottom: spacing.sm }}
    >
      <Pressable onPress={handlePress} disabled={!hasComments}>
        <GlassCard style={{ borderRadius: radii.lg, padding: 0 }}>
          {/* Progress bar background */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: radii.lg,
                overflow: "hidden",
              },
            ]}
          >
            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${item.percentage}%`,
                backgroundColor: colors.success,
                opacity: 0.2,
              }}
            />
          </View>

          {/* Main row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: spacing.md,
              minHeight: 60,
            }}
          >
            {/* Rank */}
            <KText
              variant="bodySmall"
              color={colors.textMuted}
              style={{ width: 24, fontWeight: "600" }}
            >
              {rank}
            </KText>

            {/* Avatar */}
            <KAvatar uri={item.avatarUri} name={item.name} size={36} />

            {/* Name */}
            <KText
              variant="body"
              color={colors.textPrimary}
              style={{ flex: 1, marginLeft: spacing.sm, fontWeight: "500" }}
            >
              {item.name}
            </KText>

            {/* Vote count badge */}
            <View
              style={{
                backgroundColor: "rgba(139, 92, 246, 0.2)",
                borderRadius: radii.full,
                paddingHorizontal: 10,
                paddingVertical: 3,
              }}
            >
              <KText
                variant="caption"
                color={colors.violet[300]}
                style={{ fontWeight: "600" }}
              >
                {item.voteCount} vote{item.voteCount > 1 ? "s" : ""}
              </KText>
            </View>

            {/* Expand indicator */}
            {hasComments && (
              <KText
                variant="caption"
                color={colors.textMuted}
                style={{ marginLeft: spacing.sm }}
              >
                {expanded ? "▲" : "▼"}
              </KText>
            )}
          </View>

          {/* Expanded comments */}
          {expanded && (
            <View
              style={{
                paddingHorizontal: spacing.md,
                paddingBottom: spacing.md,
                paddingTop: spacing.xs,
                borderTopWidth: 1,
                borderTopColor: colors.glass.border,
              }}
            >
              {item.comments.map((comment, i) => (
                <KText
                  key={i}
                  variant="bodySmall"
                  color={colors.textSecondary}
                  style={{
                    fontStyle: "italic",
                    marginBottom: i < item.comments.length - 1 ? spacing.xs : 0,
                  }}
                >
                  "{comment}"
                </KText>
              ))}
            </View>
          )}
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}
