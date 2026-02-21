"use client";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { KAvatar } from "./KAvatar";
import { KText } from "./KText";
import { colors, spacing } from "./tokens";
const PODIUM_CONFIG = [
    {
        // 1st place — center
        avatarSize: 100,
        borderColor: "#FFD700",
        shadowColor: "#FFD700",
        crown: true,
        order: 1,
        marginTop: 0,
    },
    {
        // 2nd place — left
        avatarSize: 80,
        borderColor: "#C0C0C0",
        shadowColor: "#C0C0C0",
        crown: false,
        order: 0,
        marginTop: 30,
    },
    {
        // 3rd place — right
        avatarSize: 80,
        borderColor: "#CD7F32",
        shadowColor: "#CD7F32",
        crown: false,
        order: 2,
        marginTop: 30,
    },
];
function PodiumSlot({ member, config, delay, }) {
    return (<Animated.View entering={FadeInDown.delay(delay).duration(500).springify()} style={{
            alignItems: "center",
            marginTop: config.marginTop,
            flex: 1,
        }}>
      {/* Crown for 1st */}
      {config.crown && (<KText variant="h1" style={{
                fontSize: 28,
                marginBottom: -4,
                textAlign: "center",
            }}>
          👑
        </KText>)}

      {/* Avatar with medal border */}
      <View style={{
            borderRadius: config.avatarSize / 2 + 4,
            borderWidth: 3,
            borderColor: config.borderColor,
            padding: 3,
            shadowColor: config.shadowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: config.crown ? 0.6 : 0.3,
            shadowRadius: config.crown ? 16 : 8,
            elevation: config.crown ? 10 : 5,
            marginBottom: spacing.xs,
        }}>
        <KAvatar uri={member.avatarUri} name={member.name} size={config.avatarSize}/>
      </View>

      {/* Name */}
      <KText variant="bodySmall" color={colors.textPrimary} style={{
            textAlign: "center",
            fontWeight: "600",
            marginBottom: 2,
        }}>
        {member.name}
      </KText>

      {/* Vote count */}
      <KText variant="caption" color={colors.textSecondary}>
        {member.voteCount} vote{member.voteCount > 1 ? "s" : ""}
      </KText>
    </Animated.View>);
}
export function PodiumView({ members }) {
    if (members.length === 0)
        return null;
    // Reorder: [2nd, 1st, 3rd] for visual layout
    const display = [];
    if (members[0])
        display.push({ member: members[0], configIndex: 0 }); // 1st
    if (members[1])
        display.push({ member: members[1], configIndex: 1 }); // 2nd
    if (members[2])
        display.push({ member: members[2], configIndex: 2 }); // 3rd
    // Visual order: 2nd - 1st - 3rd
    const sorted = [...display].sort((a, b) => PODIUM_CONFIG[a.configIndex].order - PODIUM_CONFIG[b.configIndex].order);
    return (<View style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "flex-end",
            paddingHorizontal: spacing.md,
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
        }}>
      {sorted.map(({ member, configIndex }, i) => (<PodiumSlot key={member.userId} member={member} config={PODIUM_CONFIG[configIndex]} delay={configIndex * 200}/>))}
    </View>);
}
