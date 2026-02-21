"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, StatusBar, } from "react-native";
import Animated, { SlideInUp } from "react-native-reanimated";
import { getSupabase } from "../../utils/supabase";
import { services } from "@my-app/core";
import { AuroraScreenWrapper, KText, KButton, KAvatar, GlassCard, ErrorBanner, colors, spacing, radii, } from "@repo/ui";
const { createGroupsService } = services;
export function HomeScreen({ profile, onNavigateProfile, onNavigateGroup, onNavigateCreate, onNavigateJoin, }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const fetchGroups = useCallback(async () => {
        try {
            setError(null);
            const service = createGroupsService(getSupabase());
            const data = await service.getMyGroups();
            setGroups(data);
        }
        catch (err) {
            setError(err?.message ?? "Erreur lors du chargement");
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);
    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);
    const onRefresh = () => {
        setRefreshing(true);
        fetchGroups();
    };
    const statusBarHeight = Platform.OS === "android"
        ? StatusBar.currentHeight ?? 0
        : Platform.OS === "ios"
            ? 50
            : 0;
    return (_jsxs(AuroraScreenWrapper, { children: [_jsx(View, { style: {
                    paddingHorizontal: spacing.md,
                    paddingTop: statusBarHeight + spacing.sm,
                    paddingBottom: spacing.md,
                }, children: _jsx(GlassCard, { style: { borderRadius: radii.xl }, children: _jsxs(View, { style: {
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }, children: [_jsx(KText, { variant: "questionLarge", style: { fontSize: 28 }, children: "Kiseki" }), _jsx(TouchableOpacity, { onPress: onNavigateProfile, children: _jsx(KAvatar, { uri: profile?.avatar_url, name: profile?.display_name ?? profile?.username, size: 40 }) })] }) }) }), _jsx(View, { style: {
                    paddingHorizontal: spacing.md,
                    marginBottom: spacing.md,
                }, children: _jsx(GlassCard, { style: { borderRadius: radii.xl }, children: _jsxs(View, { style: {
                            flexDirection: "row",
                            gap: spacing.sm,
                            justifyContent: "center",
                        }, children: [_jsx(KButton, { title: "Rejoindre", onPress: onNavigateJoin, variant: "glass", isPill: true }), _jsx(KButton, { title: "Creer", onPress: onNavigateCreate, isPill: true })] }) }) }), _jsx(ErrorBanner, { message: error }), loading ? (_jsx(View, { style: { flex: 1, justifyContent: "center", alignItems: "center" }, children: _jsx(ActivityIndicator, { size: "large", color: colors.violet.primary }) })) : (_jsx(FlatList, { data: groups, keyExtractor: (item) => item.id, contentContainerStyle: {
                    padding: spacing.md,
                    paddingTop: spacing.xs,
                }, refreshControl: _jsx(RefreshControl, { refreshing: refreshing, onRefresh: onRefresh, tintColor: colors.violet.primary }), ListEmptyComponent: _jsxs(GlassCard, { style: {
                        borderRadius: radii.xl,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 60,
                }, children: [_jsx(KText, { variant: "body", color: colors.textMuted, style: { marginBottom: spacing.sm }, children: "Aucun groupe" }), _jsx(KText, { variant: "bodySmall", color: colors.textMuted, children: "Cree ou rejoins un groupe pour commencer" })] }), renderItem: ({ item, index }) => (_jsx(Animated.View, { entering: SlideInUp.delay(index * 80).duration(400), children: _jsx(TouchableOpacity, { onPress: () => onNavigateGroup?.(item.id), style: { marginBottom: spacing.sm }, children: _jsx(GlassCard, { style: {
                                borderLeftWidth: 3,
                                borderLeftColor: colors.violet.primary,
                                borderRadius: radii.xl,
                            }, children: _jsxs(View, { style: {
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: spacing.sm,
                                }, children: [_jsx(KText, { variant: "h3", style: { flex: 1 }, numberOfLines: 1, children: item.name }), _jsx(View, { style: {
                                            backgroundColor: "rgba(255,255,255,0.2)",
                                            borderRadius: radii.md,
                                            paddingVertical: spacing.xs,
                                            paddingHorizontal: spacing.sm,
                                            minWidth: 88,
                                            alignItems: "center",
                                        }, children: _jsxs(KText, { variant: "caption", color: colors.textPrimary, children: [item.member_count, " membre", item.member_count > 1 ? "s" : ""] }) })] }) }) }) })) }))] }));
}
