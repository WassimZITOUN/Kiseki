import React from "react";
import { type ViewStyle } from "react-native";
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
export declare function KButton({ title, onPress, variant, loading, disabled, isPill, leftIcon, style, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
