"use client";
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
    return (<AuroraScreenWrapper>
      {/* Header */}
      <View style={{
            paddingHorizontal: spacing.md,
            paddingTop: statusBarHeight + spacing.sm,
            paddingBottom: spacing.md,
        }}>
        <GlassCard style={{ borderRadius: radii.xl }}>
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        }}>
            <KText variant="questionLarge" style={{ fontSize: 28 }}>
              Kiseki
            </KText>
            <TouchableOpacity onPress={onNavigateProfile}>
              <KAvatar uri={profile?.avatar_url} name={profile?.display_name ?? profile?.username} size={40}/>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>

      {/* Action buttons */}
      <View style={{
            paddingHorizontal: spacing.md,
            marginBottom: spacing.md,
        }}>
        <GlassCard style={{ borderRadius: radii.xl }}>
          <View style={{
            flexDirection: "row",
            gap: spacing.sm,
            justifyContent: "center",
        }}>
            <KButton title="Rejoindre" onPress={onNavigateJoin} variant="glass" isPill/>
            <KButton title="Creer" onPress={onNavigateCreate} isPill/>
          </View>
        </GlassCard>
      </View>

      <ErrorBanner message={error}/>

      {loading ? (<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.violet.primary}/>
        </View>) : (<FlatList data={groups} keyExtractor={(item) => item.id} contentContainerStyle={{
                padding: spacing.md,
                paddingTop: spacing.xs,
            }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.violet.primary}/>} ListEmptyComponent={<GlassCard style={{
                    borderRadius: radii.xl,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 60,
                }}>
              <KText variant="body" color={colors.textMuted} style={{ marginBottom: spacing.sm }}>
                Aucun groupe
              </KText>
              <KText variant="bodySmall" color={colors.textMuted}>
                Cree ou rejoins un groupe pour commencer
              </KText>
            </GlassCard>} renderItem={({ item, index }) => (<Animated.View entering={SlideInUp.delay(index * 80).duration(400)}>
              <TouchableOpacity onPress={() => onNavigateGroup?.(item.id)} style={{ marginBottom: spacing.sm }}>
                <GlassCard style={{
                    borderLeftWidth: 3,
                    borderLeftColor: colors.violet.primary,
                    borderRadius: radii.xl,
                }}>
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: spacing.sm,
                }}>
                    <KText variant="h3" style={{ flex: 1 }} numberOfLines={1}>
                      {item.name}
                    </KText>
                    <View style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: radii.md,
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.sm,
                    minWidth: 88,
                    alignItems: "center",
                }}>
                      <KText variant="caption" color={colors.textPrimary}>
                        {item.member_count} membre
                        {item.member_count > 1 ? "s" : ""}
                      </KText>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </Animated.View>)}/>)}
    </AuroraScreenWrapper>);
}
