import { type TextInputProps, type ViewStyle } from "react-native";
type Props = TextInputProps & {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
};
export declare function KInput({ label, error, containerStyle, style, onFocus, onBlur, ...props }: Props): import("react/jsx-runtime").JSX.Element;
export {};
