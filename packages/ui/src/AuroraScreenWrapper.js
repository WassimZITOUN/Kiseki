"use client";
import React from "react";
import { KeyboardAvoidingView, Platform, } from "react-native";
/**
 * Screen content wrapper with keyboard handling.
 * AuroraBackground is rendered once at the layout level (persistent).
 */
export function AuroraScreenWrapper({ children, style }) {
    return (<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[{ flex: 1 }, style]}>
      {children}
    </KeyboardAvoidingView>);
}
