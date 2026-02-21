"use client";
import React from "react";
import { View, useWindowDimensions } from "react-native";
import { spacing } from "./tokens";
import { VoteCard } from "./VoteCard";
export function VoteGrid({ members, selectedUserId, onSelectMember, disabled = false, }) {
    const { width } = useWindowDimensions();
    const compact = members.length > 6;
    const columns = compact ? 3 : 2;
    const gap = spacing.sm;
    const cardWidth = (width - spacing.lg * 2 - gap * (columns - 1)) / columns;
    return (<View style={{
            flexDirection: "row",
            flexWrap: "wrap",
            paddingHorizontal: spacing.lg,
            gap,
        }}>
      {members.map((member) => (<View key={member.userId} style={{ width: cardWidth }}>
          <VoteCard userId={member.userId} name={member.name} avatarUri={member.avatarUri} selected={selectedUserId === member.userId} onPress={onSelectMember} disabled={disabled} compact={compact}/>
        </View>))}
    </View>);
}
