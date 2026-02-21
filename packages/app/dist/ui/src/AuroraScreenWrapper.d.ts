import React from "react";
import { type ViewStyle } from "react-native";
type Props = {
    children: React.ReactNode;
    style?: ViewStyle;
};
/**
 * Screen content wrapper with keyboard handling.
 * AuroraBackground is rendered once at the layout level (persistent).
 */
export declare function AuroraScreenWrapper({ children, style }: Props): import("react/jsx-runtime").JSX.Element;
export {};
