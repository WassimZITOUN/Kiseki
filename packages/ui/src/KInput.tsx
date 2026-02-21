"use client";

import React, { useState } from "react";
import {
  TextInput,
  View,
  Platform,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { colors, radii, spacing } from "./tokens";
import { KText } from "./KText";

type Props = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
};

const AnimatedView = Animated.createAnimatedComponent(View);

export function KInput({
  label,
  error,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const isWeb = Platform.OS === "web";
  const [focused, setFocused] = useState(false);
  const borderOpacity = useSharedValue(0.3);

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: `rgba(149, 114, 207, ${borderOpacity.value})`,
  }), []);

  const handleFocus = (e: any) => {
    setFocused(true);
    borderOpacity.value = withTiming(0.8, { duration: 200 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    borderOpacity.value = withTiming(0.3, { duration: 200 });
    onBlur?.(e);
  };

  return (
    <View style={containerStyle}>
      {label && (
        <KText
          variant="caption"
          color={colors.textSecondary}
          style={{ marginBottom: spacing.xs }}
        >
          {label}
        </KText>
      )}
      <AnimatedView
        style={[
          {
            backgroundColor: isWeb
              ? "var(--app-input-bg)"
              : colors.glass.background,
            borderWidth: 1,
            borderRadius: radii.md,
            overflow: "hidden",
            ...(isWeb && focused
              ? {
                  // @ts-ignore web-only
                  boxShadow: "0 0 0 2px rgba(139, 92, 246, 0.35)",
                }
              : {}),
          },
          animatedBorder,
        ]}
      >
        <TextInput
          placeholderTextColor={
            isWeb ? "var(--app-text-muted)" : colors.textMuted
          }
          {...props}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            {
              padding: spacing.md,
              fontSize: 16,
              color: isWeb ? "var(--app-text-primary)" : colors.textPrimary,
            },
            style,
          ]}
        />
      </AnimatedView>
      {error && (
        <KText
          variant="caption"
          color={colors.error}
          style={{ marginTop: spacing.xs }}
        >
          {error}
        </KText>
      )}
    </View>
  );
}
