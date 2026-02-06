"use client";

import React from "react";
import { TouchableOpacity, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { colors, radii, spacing } from "./tokens";
import { KAvatar } from "./KAvatar";
import { KText } from "./KText";

// iOS Premium Spring — snappy, no jelly
const SNAPPY_SPRING = {
  damping: 40,
  stiffness: 350,
  mass: 1,
  overshootClamping: true,
};

type Props = {
  userId: string;
  name: string;
  avatarUri?: string | null;
  selected?: boolean;
  onPress?: (userId: string) => void;
  disabled?: boolean;
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function VoteCard({
  userId,
  name,
  avatarUri,
  selected = false,
  onPress,
  disabled = false,
}: Props) {
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(selected ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor:
      bgOpacity.value > 0.5
        ? colors.violet[200]
        : colors.glass.background, // 5% opacity — zero-fill
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, SNAPPY_SPRING);
    bgOpacity.value = withTiming(1, { duration: 100 });

    if (Platform.OS !== "web") {
      try {
        const Haptics = require("expo-haptics");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SNAPPY_SPRING);
    if (!selected) {
      bgOpacity.value = withTiming(0, { duration: 100 });
    }
  };

  return (
    <AnimatedTouchable
      onPress={() => onPress?.(userId)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.95}
      style={[
        {
          borderRadius: radii.superEllipse,
          padding: spacing.lg,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: selected ? colors.violet[300] : colors.glass.border,
          minHeight: 120,
        },
        animatedStyle,
      ]}
    >
      <KAvatar uri={avatarUri} name={name} size={60} />
      <KText
        variant="bodySmall"
        color={selected ? colors.violet[800] : colors.textPrimary}
        style={{ marginTop: spacing.xs, textAlign: "center", fontWeight: "500" }}
      >
        {name}
      </KText>
    </AnimatedTouchable>
  );
}
