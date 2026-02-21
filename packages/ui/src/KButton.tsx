"use client";

import React from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { colors, radii } from "./tokens";
import { KText } from "./KText";
import { getWebGlassStyle } from "./webGlass";

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
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const isWeb = Platform.OS === "web";

export function KButton({
  title,
  onPress,
  variant = "solid",
  loading = false,
  disabled = false,
  isPill = false,
  leftIcon,
  style,
}: Props) {
  const [focused, setFocused] = React.useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }), []);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, SNAPPY_SPRING);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SNAPPY_SPRING);
  };

  const resolvedRadius = isPill ? radii.full : radii.md;

  const textColor =
    variant === "solid"
      ? "#fff"
      : variant === "glass"
        ? colors.textPrimary
        : colors.violet.primary;

  const content = loading ? (
    <ActivityIndicator color={textColor} />
  ) : leftIcon ? (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      {leftIcon}
      <KText variant="button" color={textColor}>
        {title}
      </KText>
    </View>
  ) : (
    <KText variant="button" color={textColor}>
      {title}
    </KText>
  );

  const basePadding: ViewStyle = {
    paddingVertical: isPill ? 12 : 14,
    paddingHorizontal: isPill ? 28 : 24,
    alignItems: "center",
    justifyContent: "center",
  };
  const webFocusStyle =
    isWeb && focused
      ? ({
          // @ts-ignore web-only
          boxShadow: "0 0 0 2px rgba(139, 92, 246, 0.42)",
        } as ViewStyle)
      : null;
  const webCompactStyle =
    isWeb
      ? ({
          alignSelf: "center",
        } as ViewStyle)
      : null;

  // ── Solid variant with glass effect ──
  if (variant === "solid") {
    if (isWeb) {
      return (
        <AnimatedTouchable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled || loading}
          activeOpacity={0.9}
          style={[
            {
              borderRadius: resolvedRadius,
              opacity: disabled ? 0.5 : 1,
              ...getWebGlassStyle({
                blur: 7,
                tintAlpha: 0.18,
                borderAlpha: 0.36,
                shadow: "none",
              }),
              backgroundColor: "rgba(139, 92, 246, 0.28)",
              borderColor: "rgba(213, 194, 255, 0.46)",
            },
            webCompactStyle,
            basePadding,
            webFocusStyle,
            animatedStyle,
            style,
          ]}
        >
          {content}
        </AnimatedTouchable>
      );
    }

    // Native solid + glass
    const BlurView = require("expo-blur").BlurView;

    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[
          {
            borderRadius: resolvedRadius,
            opacity: disabled ? 0.5 : 1,
            shadowColor: colors.violet[600],
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 6,
          },
          webCompactStyle,
          webFocusStyle,
          animatedStyle,
          style,
        ]}
      >
        {/* Layer 1: Blur */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: resolvedRadius, overflow: "hidden" },
          ]}
        >
          <BlurView
            intensity={15}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Layer 2: Violet fill + glass border */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: resolvedRadius,
              backgroundColor: "rgba(139, 92, 246, 0.85)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
            },
          ]}
        />

        {/* Layer 3: Content */}
        <View style={basePadding}>{content}</View>
      </AnimatedTouchable>
    );
  }

  // ── Glass & Ghost variants (unchanged layout) ──
  const bg: ViewStyle =
    variant === "glass"
      ? {
              ...(isWeb
                ? (getWebGlassStyle({
                    blur: 8,
                    tintAlpha: 0.08,
                    borderAlpha: 0.34,
                    shadow: "none",
                  }) as any)
                : {
                    backgroundColor: colors.glass.background,
                    borderWidth: 1,
                    borderColor: colors.glass.border,
                  }),
          }
      : { backgroundColor: "transparent" };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={disabled || loading}
      activeOpacity={0.9}
      style={[
        {
          borderRadius: resolvedRadius,
          opacity: disabled ? 0.5 : 1,
        },
        webCompactStyle,
        basePadding,
        bg,
        webFocusStyle,
        animatedStyle,
        style,
      ]}
    >
      {content}
    </AnimatedTouchable>
  );
}
