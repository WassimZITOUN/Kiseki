"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { View, useWindowDimensions } from "react-native";
import { spacing } from "./tokens";
import { VoteCard } from "./VoteCard";
export function VoteGrid({ members, selectedUserId, onSelectMember, disabled = false, }) {
    const { width } = useWindowDimensions();
    const compact = members.length > 6;
    const columns = compact ? 3 : 2;
    const gap = spacing.sm;
    const cardWidth = (width - spacing.lg * 2 - gap * (columns - 1)) / columns;
    return (_jsx(View, { style: {
            flexDirection: "row",
            flexWrap: "wrap",
            paddingHorizontal: spacing.lg,
            gap,
        }, children: members.map((member) => (_jsx(View, { style: { width: cardWidth }, children: _jsx(VoteCard, { userId: member.userId, name: member.name, avatarUri: member.avatarUri, selected: selectedUserId === member.userId, onPress: onSelectMember, disabled: disabled, compact: compact }) }, member.userId))) }));
}
