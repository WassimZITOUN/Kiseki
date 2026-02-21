"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Text, Platform } from "react-native";
import { typography, colors } from "./tokens";
function resolveWebTextColor(input) {
    if (Platform.OS !== "web")
        return input;
    if (input === colors.textPrimary)
        return "#16254A";
    if (input === colors.textSecondary)
        return "#365181";
    if (input === colors.textMuted)
        return "#4F6796";
    return input;
}
export function KText({ variant = "body", color, style, ...props }) {
    const t = typography[variant];
    const isSerif = variant === "questionLarge";
    const resolvedColor = resolveWebTextColor(color ?? colors.textPrimary);
    return (_jsx(Text, { ...props, style: [
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
        ] }));
}
