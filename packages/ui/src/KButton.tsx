"use client";

import React from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
  type ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { colors, radii } from "./tokens";
import { KText } from "./KText";

// iOS Premium Spring — snappy, no jelly
const SNAPPY_SPRING = {
  damping: 40,
  stiffness: 350,
  mass: 1,
  overshootClamping: true,
};

type Variant = "solid" | "glass" | "ghost";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  isPill?: boolean;
  style?: ViewStyle;
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function KButton({
  title,
  onPress,
  variant = "solid",
  loading = false,
  disabled = false,
  isPill = false,
  style,
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, SNAPPY_SPRING);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SNAPPY_SPRING);
  };

  const solidShadow: ViewStyle =
    variant === "solid"
      ? {
          shadowColor: colors.violet[600],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 4,
        }
      : {};

  const bg: ViewStyle =
    variant === "solid"
      ? { backgroundColor: colors.violet.primary, ...solidShadow }
      : variant === "glass"
        ? {
            backgroundColor: colors.glass.background,
            borderWidth: 1,
            borderColor: colors.glass.border,
          }
        : { backgroundColor: "transparent" };

  const textColor =
    variant === "solid"
      ? "#fff"
      : variant === "glass"
        ? colors.textPrimary
        : colors.violet.primary;

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.9}
      style={[
        {
          borderRadius: isPill ? radii.full : radii.md,
          paddingVertical: isPill ? 12 : 14,
          paddingHorizontal: isPill ? 28 : 24,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.5 : 1,
        },
        bg,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <KText variant="button" color={textColor}>
          {title}
        </KText>
      )}
    </AnimatedTouchable>
  );
}
