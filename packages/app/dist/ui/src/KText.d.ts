import { type TextProps } from "react-native";
import { typography } from "./tokens";
type Variant = keyof typeof typography;
type Props = TextProps & {
    variant?: Variant;
    color?: string;
};
export declare function KText({ variant, color, style, ...props }: Props): import("react/jsx-runtime").JSX.Element;
export {};
