"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { KeyboardAvoidingView, Platform, } from "react-native";
/**
 * Screen content wrapper with keyboard handling.
 * AuroraBackground is rendered once at the layout level (persistent).
 */
export function AuroraScreenWrapper({ children, style }) {
    return (_jsx(KeyboardAvoidingView, { behavior: Platform.OS === "ios" ? "padding" : "height", style: [{ flex: 1 }, style], children: children }));
}
