"use client";
import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { KAvatar } from "./KAvatar";
import { KText } from "./KText";
import { colors, radii, spacing, typography } from "./tokens";
/** View-based crown icon — 3 triangles forming a crown shape */
function CrownIcon() {
    const triSize = 10;
    return (<View style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "center",
            marginBottom: spacing.xs,
            height: 20,
        }}>
      {/* Left triangle */}
      <View style={{
            width: 0,
            height: 0,
            borderLeftWidth: triSize / 2,
            borderRightWidth: triSize / 2,
            borderBottomWidth: triSize,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: "#FFD700",
            transform: [{ rotate: "-15deg" }],
            marginRight: 2,
        }}/>
      {/* Center triangle (taller) */}
      <View style={{
            width: 0,
            height: 0,
            borderLeftWidth: triSize / 2 + 2,
            borderRightWidth: triSize / 2 + 2,
            borderBottomWidth: triSize + 4,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: "#FFD700",
            marginBottom: 2,
        }}/>
      {/* Right triangle */}
      <View style={{
            width: 0,
            height: 0,
            borderLeftWidth: triSize / 2,
            borderRightWidth: triSize / 2,
            borderBottomWidth: triSize,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: "#FFD700",
            transform: [{ rotate: "15deg" }],
            marginLeft: 2,
        }}/>
    </View>);
}
export function ShareResultCard({ question, winnerName, winnerAvatarUri, winnerVoteCount, groupName, }) {
    return (<View style={{
            maxWidth: 340,
            alignSelf: "center",
            borderRadius: radii.xl,
            overflow: "hidden",
        }}>
      <LinearGradient colors={[colors.violet[800], colors.violet[500]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{
            padding: spacing.lg,
            alignItems: "center",
        }}>
        {/* Branding — top left */}
        <KText variant="caption" color="rgba(255,255,255,0.5)" style={{ alignSelf: "flex-start", marginBottom: spacing.md }}>
          Kiseki
        </KText>

        {/* Question */}
        <KText variant="questionLarge" color={colors.textPrimary} style={{
            textAlign: "center",
            marginBottom: spacing.lg,
            ...typography.questionLarge,
            fontSize: 24,
            lineHeight: 32,
        }}>
          {question.length > 80 ? question.slice(0, 77) + "..." : question}
        </KText>

        {/* Crown */}
        <CrownIcon />

        {/* Winner avatar with gold border + shadow */}
        <View style={{
            borderRadius: 44,
            borderWidth: 3,
            borderColor: "#FFD700",
            padding: 3,
            shadowColor: "#FFD700",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 16,
            elevation: 10,
            marginBottom: spacing.sm,
        }}>
          <KAvatar uri={winnerAvatarUri} name={winnerName} size={80}/>
        </View>

        {/* Winner name */}
        <KText variant="h3" color={colors.textPrimary} style={{ textAlign: "center", marginBottom: 2 }}>
          {winnerName}
        </KText>

        {/* Vote count */}
        <KText variant="caption" color="rgba(255,255,255,0.7)" style={{ marginBottom: spacing.md }}>
          {winnerVoteCount} vote{winnerVoteCount > 1 ? "s" : ""}
        </KText>

        {/* Separator */}
        <View style={{
            width: "20%",
            height: 1,
            backgroundColor: "rgba(255,255,255,0.2)",
            marginBottom: spacing.md,
        }}/>

        {/* Group + domain */}
        <KText variant="caption" color="rgba(255,255,255,0.4)" style={{ textAlign: "center" }}>
          {groupName} &middot; kiseki.app
        </KText>
      </LinearGradient>
    </View>);
}
