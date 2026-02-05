"use client";

import React from "react";
import { View, TouchableOpacity, Modal, Platform, ScrollView, StyleSheet } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, spacing } from "./tokens";

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

function SheetContent({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") {
    return (
      <Animated.View
        entering={SlideInDown.duration(300).springify().damping(18)}
        exiting={SlideOutDown.duration(200)}
        style={{
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          overflow: "hidden",
          padding: spacing.lg,
          maxHeight: "80%",
          // @ts-ignore web-only
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          boxShadow: "0 -8px 32px rgba(162, 155, 254, 0.15)",
        }}
      >
        {/* Glass gradient surface */}
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.4)",
            "rgba(255,255,255,0.1)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            StyleSheet.absoluteFill,
            {
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: colors.glass.border,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
            },
          ]}
        />
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.textMuted,
            alignSelf: "center",
            marginBottom: spacing.md,
          }}
        />
        <ScrollView>{children}</ScrollView>
      </Animated.View>
    );
  }

  const BlurView = require("expo-blur").BlurView;

  return (
    <Animated.View
      entering={SlideInDown.duration(300).springify().damping(18)}
      exiting={SlideOutDown.duration(200)}
      style={{
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
        maxHeight: "80%",
        padding: spacing.lg,
        shadowColor: colors.shadow.color,
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
      }}
    >
      {/* Glass layers */}
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          overflow: "hidden",
        }}
      >
        <BlurView
          intensity={80}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.4)",
            "rgba(255,255,255,0.1)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            StyleSheet.absoluteFill,
            {
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: colors.glass.border,
            },
          ]}
        />
      </View>
      <View
        style={{
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.textMuted,
          alignSelf: "center",
          marginBottom: spacing.md,
        }}
      />
      <ScrollView>{children}</ScrollView>
    </Animated.View>
  );
}

export function GlassBottomSheet({ visible, onClose, children }: Props) {
  if (Platform.OS === "web") {
    if (!visible) return null;

    return (
      <View
        style={{
          position: "fixed" as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.overlay,
          }}
        />
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <SheetContent>{children}</SheetContent>
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="none" transparent>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: colors.overlay,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={{ flex: 1 }}
        />
        <SheetContent>{children}</SheetContent>
      </View>
    </Modal>
  );
}
