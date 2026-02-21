"use client";
import React from "react";
import { Text, Platform } from "react-native";
import { typography, colors } from "./tokens";
function resolveWebTextColor(input) {
    if (Platform.OS !== "web")
        return input;
    if (input === colors.textPrimary)
        return "var(--app-text-primary)";
    if (input === colors.textSecondary)
        return "var(--app-text-secondary)";
    if (input === colors.textMuted)
        return "var(--app-text-muted)";
    return input;
}
export function KText({ variant = "body", color, style, ...props }) {
    const t = typography[variant];
    const isSerif = variant === "questionLarge";
    const resolvedColor = resolveWebTextColor(color ?? colors.textPrimary);
    return (<Text {...props} style={[
            {
                fontSize: t.fontSize,
                lineHeight: t.lineHeight,
                fontWeight: t.fontWeight,
                color: resolvedColor,
                ...(isSerif
                    ? {
                        fontFamily: Platform.OS === "web"
                            ? "var(--font-dm-serif), DMSerifDisplay, serif"
                            : "DMSerifDisplay",
                    }
                    : {}),
            },
            style,
        ]}/>);
}
