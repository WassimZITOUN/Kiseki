"use client";

import React from "react";
import { View, useWindowDimensions } from "react-native";
import { spacing } from "./tokens";
import { VoteCard } from "./VoteCard";

export type VoteMember = {
  userId: string;
  name: string;
  avatarUri?: string | null;
};

type Props = {
  members: VoteMember[];
  selectedUserId?: string | null;
  onSelectMember?: (userId: string) => void;
  disabled?: boolean;
};

export function VoteGrid({
  members,
  selectedUserId,
  onSelectMember,
  disabled = false,
}: Props) {
  const { width } = useWindowDimensions();
  const columns = 2;
  const gap = spacing.sm;
  const cardWidth = (width - spacing.lg * 2 - gap) / columns;

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: spacing.lg,
        gap,
      }}
    >
      {members.map((member) => (
        <View key={member.userId} style={{ width: cardWidth }}>
          <VoteCard
            userId={member.userId}
            name={member.name}
            avatarUri={member.avatarUri}
            selected={selectedUserId === member.userId}
            onPress={onSelectMember}
            disabled={disabled}
          />
        </View>
      ))}
    </View>
  );
}
