"use client";

import React from "react";
import { View, TouchableOpacity, Modal, Platform, ScrollView, StyleSheet } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { colors, radii, spacing } from "./tokens";

// iOS Premium Spring — snappy, no jelly
const SNAPPY_SPRING_CONFIG = {
  damping: 40,
  stiffness: 350,
  overshootClamping: true,
};

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

function SheetContent({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") {
    return (
      <Animated.View
        entering={SlideInDown.duration(250).springify().damping(40).stiffness(350)}
        exiting={SlideOutDown.duration(150)}
        style={{
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          overflow: "hidden",
          padding: spacing.lg,
          maxHeight: "80%",
          backgroundColor: colors.glass.background,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: colors.glass.border,
          // @ts-ignore web-only
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          boxShadow: "0 -12px 40px rgba(162, 155, 254, 0.2)",
        }}
      >
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
        <ScrollView showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </Animated.View>
    );
  }

  const BlurView = require("expo-blur").BlurView;

  return (
    <Animated.View
      entering={SlideInDown.duration(250).springify().damping(40).stiffness(350)}
      exiting={SlideOutDown.duration(150)}
      style={{
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
        maxHeight: "80%",
        shadowColor: colors.shadow.color,
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 16,
      }}
    >
      {/* Blur layer */}
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          overflow: "hidden",
        }}
      >
        <BlurView
          intensity={60}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Refraction border */}
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: colors.glass.border,
          backgroundColor: colors.glass.background,
        }}
      />

      {/* Content */}
      <View style={{ padding: spacing.lg }}>
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
        <ScrollView showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
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
