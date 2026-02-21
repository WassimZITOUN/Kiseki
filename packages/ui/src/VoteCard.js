"use client";
import React from "react";
import { View, TouchableOpacity, Platform, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, } from "react-native-reanimated";
import { colors, radii, spacing } from "./tokens";
import { KAvatar } from "./KAvatar";
import { KText } from "./KText";
import { getWebGlassStyle } from "./webGlass";
// iOS Premium Spring — snappy, no jelly
const SNAPPY_SPRING = {
    damping: 40,
    stiffness: 350,
    mass: 1,
    overshootClamping: true,
};
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const isWeb = Platform.OS === "web";
export function VoteCard({ userId, name, avatarUri, selected = false, onPress, disabled = false, compact = false, }) {
    const avatarSize = compact ? 40 : 60;
    const cardPadding = compact ? spacing.md : spacing.lg;
    const cardMinHeight = compact ? 88 : 120;
    const scale = useSharedValue(1);
    const animatedScale = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }), []);
    const handlePressIn = () => {
        scale.value = withSpring(0.95, SNAPPY_SPRING);
        if (!isWeb) {
            try {
                const Haptics = require("expo-haptics");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            catch { }
        }
    };
    const handlePressOut = () => {
        scale.value = withSpring(1, SNAPPY_SPRING);
    };
    const borderColor = selected ? colors.violet[300] : colors.glass.border;
    const resolvedRadius = radii.superEllipse;
    if (isWeb) {
        return (<AnimatedTouchable onPress={() => onPress?.(userId)} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled} activeOpacity={0.95} style={[
                {
                    borderRadius: resolvedRadius,
                    overflow: "hidden",
                    backgroundColor: selected
                        ? colors.violet[200]
                        : colors.glass.background,
                    borderWidth: 1,
                    borderColor,
                    minHeight: cardMinHeight,
                    ...getWebGlassStyle({
                        blur: 8,
                        tintAlpha: selected ? 0.22 : 0.08,
                        borderAlpha: selected ? 0.42 : 0.3,
                        shadow: selected
                            ? "0 14px 34px rgba(38, 20, 76, 0.34)"
                            : "0 10px 24px rgba(0, 0, 0, 0.2)",
                    }),
                    backgroundColor: selected
                        ? "rgba(192, 161, 255, 0.28)"
                        : "rgba(255,255,255,0.08)",
                    borderColor: selected ? "rgba(213,194,255,0.52)" : borderColor,
                },
                animatedScale,
            ]}>
        <View style={{
                padding: cardPadding,
                alignItems: "center",
                justifyContent: "center",
            }}>
          <KAvatar uri={avatarUri} name={name} size={avatarSize}/>
          <KText variant="bodySmall" color={selected ? colors.violet[800] : colors.textPrimary} style={{
                marginTop: spacing.xs,
                textAlign: "center",
                fontWeight: "500",
            }}>
            {name}
          </KText>
        </View>
      </AnimatedTouchable>);
    }
    // Native — glassmorphism layers
    const BlurView = require("expo-blur").BlurView;
    return (<AnimatedTouchable onPress={() => onPress?.(userId)} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled} activeOpacity={0.95} style={[
            {
                borderRadius: resolvedRadius,
                minHeight: cardMinHeight,
                shadowColor: colors.shadow.color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: selected ? 0.4 : 0.15,
                shadowRadius: 12,
                elevation: selected ? 8 : 4,
            },
            animatedScale,
        ]}>
      {/* Layer 1: Blur */}
      <View style={[
            StyleSheet.absoluteFill,
            { borderRadius: resolvedRadius, overflow: "hidden" },
        ]}>
        <BlurView intensity={30} tint="dark" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill}/>
      </View>

      {/* Layer 2: Border + background */}
      <View style={[
            StyleSheet.absoluteFill,
            {
                borderRadius: resolvedRadius,
                borderWidth: 1,
                borderColor,
                backgroundColor: selected
                    ? "rgba(149,114,207,0.2)"
                    : colors.glass.background,
            },
        ]}/>

      {/* Layer 3: Content */}
      <View style={{
            padding: spacing.lg,
            alignItems: "center",
            justifyContent: "center",
        }}>
        <KAvatar uri={avatarUri} name={name} size={60}/>
        <KText variant="bodySmall" color={selected ? colors.violet[200] : colors.textPrimary} style={{
            marginTop: spacing.xs,
            textAlign: "center",
            fontWeight: "500",
        }}>
          {name}
        </KText>
      </View>
    </AnimatedTouchable>);
}
