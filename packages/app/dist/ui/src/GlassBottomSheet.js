"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View, TouchableOpacity, Modal, Platform, ScrollView, StyleSheet } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { colors, radii, spacing } from "./tokens";
import { getWebGlassStyle } from "./webGlass";
// iOS Premium Spring — snappy, no jelly
const SNAPPY_SPRING_CONFIG = {
    damping: 40,
    stiffness: 350,
    overshootClamping: true,
};
function SheetContent({ children }) {
    if (Platform.OS === "web") {
        return (_jsxs(Animated.View, { entering: SlideInDown.duration(250).springify().damping(40).stiffness(350), exiting: SlideOutDown.duration(150), style: {
                borderTopLeftRadius: radii.xl,
                borderTopRightRadius: radii.xl,
                overflow: "hidden",
                padding: spacing.lg,
                maxHeight: "80%",
                ...getWebGlassStyle({
                    blur: 10,
                    tintAlpha: 0.08,
                    borderAlpha: 0.32,
                    shadow: "0 -18px 50px rgba(0, 0, 0, 0.34)",
                }),
                borderBottomWidth: 0,
            }, children: [_jsx(View, { style: {
                        width: 36,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: colors.textMuted,
                        alignSelf: "center",
                        marginBottom: spacing.md,
                    } }), _jsx(ScrollView, { showsVerticalScrollIndicator: false, children: children })] }));
    }
    const BlurView = require("expo-blur").BlurView;
    return (_jsxs(Animated.View, { entering: SlideInDown.duration(250).springify().damping(40).stiffness(350), exiting: SlideOutDown.duration(150), style: {
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            maxHeight: "80%",
            shadowColor: colors.shadow.color,
            shadowOffset: { width: 0, height: -12 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 16,
        }, children: [_jsx(View, { style: {
                    ...StyleSheet.absoluteFillObject,
                    borderTopLeftRadius: radii.xl,
                    borderTopRightRadius: radii.xl,
                    overflow: "hidden",
                }, children: _jsx(BlurView, { intensity: 60, tint: "dark", experimentalBlurMethod: "dimezisBlurView", style: StyleSheet.absoluteFill }) }), _jsx(View, { style: {
                    ...StyleSheet.absoluteFillObject,
                    borderTopLeftRadius: radii.xl,
                    borderTopRightRadius: radii.xl,
                    borderWidth: 1,
                    borderBottomWidth: 0,
                    borderColor: colors.glass.border,
                    backgroundColor: colors.glass.background,
                } }), _jsxs(View, { style: { padding: spacing.lg }, children: [_jsx(View, { style: {
                            width: 36,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: colors.textMuted,
                            alignSelf: "center",
                            marginBottom: spacing.md,
                        } }), _jsx(ScrollView, { showsVerticalScrollIndicator: false, children: children })] })] }));
}
export function GlassBottomSheet({ visible, onClose, children }) {
    if (Platform.OS === "web") {
        if (!visible)
            return null;
        return (_jsxs(View, { style: {
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000,
            }, children: [_jsx(TouchableOpacity, { activeOpacity: 1, onPress: onClose, style: {
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: colors.overlay,
                    } }), _jsx(View, { style: { flex: 1, justifyContent: "flex-end" }, children: _jsx(SheetContent, { children: children }) })] }));
    }
    return (_jsx(Modal, { visible: visible, animationType: "none", transparent: true, children: _jsxs(View, { style: {
                flex: 1,
                justifyContent: "flex-end",
                backgroundColor: colors.overlay,
            }, children: [_jsx(TouchableOpacity, { activeOpacity: 1, onPress: onClose, style: { flex: 1 } }), _jsx(SheetContent, { children: children })] }) }));
}
