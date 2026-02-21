import React from "react";
import { type ViewStyle } from "react-native";
type Props = {
    children: React.ReactNode;
    style?: ViewStyle;
    intensity?: number;
};
/**
 * GlassCard — Deep Glass Dark Theme
 *
 * Architecture:
 * 1. Shadow layer (soft depth, no colored glow)
 * 2. Blur layer (expo-blur with experimentalBlurMethod, tint="dark")
 * 3. Refraction border (subtle white edge)
 * 4. Content
 *
 * Dark mode optimized — neutral glass depth
 */
export declare function GlassCard({ children, style, intensity }: Props): import("react/jsx-runtime").JSX.Element;
export {};
