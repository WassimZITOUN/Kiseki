"use client";

import React, { useState } from "react";
import {
  TextInput,
  View,
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
  const [focused, setFocused] = useState(false);
  const borderOpacity = useSharedValue(0.3);

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: `rgba(149, 114, 207, ${borderOpacity.value})`,
  }));

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
            backgroundColor: colors.glass.background,
            borderWidth: 1,
            borderRadius: radii.md,
            overflow: "hidden",
          },
          animatedBorder,
        ]}
      >
        <TextInput
          placeholderTextColor={colors.textMuted}
          {...props}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            {
              padding: spacing.md,
              fontSize: 16,
              color: colors.textPrimary,
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
