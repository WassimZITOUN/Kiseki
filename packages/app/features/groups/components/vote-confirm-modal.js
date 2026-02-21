"use client";
import React from "react";
import { View } from "react-native";
import { GlassModal, KText, KInput, KButton, colors, spacing, } from "@repo/ui";
export function VoteConfirmModal({ visible, targetName, contextNote, onChangeContextNote, onConfirm, onCancel, submitting, }) {
    return (<GlassModal visible={visible} onClose={onCancel}>
      <KText variant="h3" style={{ textAlign: "center", marginBottom: spacing.md }}>
        Voter pour {targetName} ?
      </KText>

      <KInput label="Commentaire (optionnel)" value={contextNote} onChangeText={(t) => onChangeContextNote(t.slice(0, 140))} placeholder="Pourquoi cette personne ?" multiline maxLength={140} style={{ minHeight: 60, textAlignVertical: "top" }} containerStyle={{ marginBottom: spacing.xs }}/>
      <KText variant="caption" color={contextNote.length >= 130 ? colors.error : colors.textMuted} style={{ textAlign: "right", marginBottom: spacing.md }}>
        {contextNote.length}/140
      </KText>

      <View style={{ flexDirection: "row", gap: spacing.sm, justifyContent: "center" }}>
        <KButton title="Annuler" onPress={onCancel} variant="glass" disabled={submitting} style={{ minWidth: 110 }}/>
        <KButton title="Voter" onPress={onConfirm} loading={submitting} disabled={submitting} style={{ minWidth: 110 }}/>
      </View>
    </GlassModal>);
}
