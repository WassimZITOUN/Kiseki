"use client";
import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { getSupabase } from "../../../utils/supabase";
import { services } from "@my-app/core";
import { GlassCard, GlassModal, KText, KInput, KButton, ErrorBanner, colors, spacing, } from "@repo/ui";
const { createSubmissionsService } = services;
export function SubmitQuestionCard({ groupId, slotId, onSubmitted }) {
    const [questionText, setQuestionText] = useState("");
    const [intensity, setIntensity] = useState("normal");
    const [mode, setMode] = useState("custom");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const trimmed = questionText.trim();
    const isValid = mode === "bank" || (trimmed.length >= 10 && trimmed.length <= 200);
    const handleSubmit = async () => {
        if (!isValid)
            return;
        setSubmitting(true);
        setError(null);
        try {
            const svc = createSubmissionsService(getSupabase());
            await svc.submitQuestion(slotId, groupId, mode === "bank" ? null : trimmed, {
                intensity,
                chooseBank: mode === "bank",
            });
            setConfirmVisible(true);
        }
        catch (err) {
            setError(err?.message ?? "Erreur lors de l'envoi");
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<>
      <Animated.View entering={FadeIn.duration(400)} style={{ paddingHorizontal: spacing.md, marginTop: spacing.md }}>
        <GlassCard>
          <KText variant="h3" style={{ marginBottom: spacing.xs }}>
            Propose ta question
          </KText>
          <KText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
            Tu peux envoyer une seule proposition pour ce cycle.
          </KText>

          <ErrorBanner message={error}/>

          <KText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
            Mode
          </KText>
          <View style={{ flexDirection: "row", marginBottom: spacing.md }}>
            <TouchableOpacity onPress={() => setMode("custom")} activeOpacity={0.7} style={{
            flex: 1,
            paddingVertical: spacing.sm,
            borderRadius: 12,
            alignItems: "center",
            backgroundColor: mode === "custom"
                ? "rgba(149, 114, 207, 0.3)"
                : "rgba(255, 255, 255, 0.05)",
            borderWidth: 1,
            borderColor: mode === "custom"
                ? colors.violet.primary
                : "rgba(255, 255, 255, 0.1)",
            marginRight: spacing.sm,
        }}>
              <KText variant="body" color={mode === "custom" ? colors.textPrimary : colors.textSecondary}>
                Ma question
              </KText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode("bank")} activeOpacity={0.7} style={{
            flex: 1,
            paddingVertical: spacing.sm,
            borderRadius: 12,
            alignItems: "center",
            backgroundColor: mode === "bank"
                ? "rgba(56, 161, 105, 0.25)"
                : "rgba(255, 255, 255, 0.05)",
            borderWidth: 1,
            borderColor: mode === "bank" ? colors.success : "rgba(255, 255, 255, 0.1)",
        }}>
              <KText variant="body" color={mode === "bank" ? colors.textPrimary : colors.textSecondary}>
                Banque auto
              </KText>
            </TouchableOpacity>
          </View>

          {mode === "custom" ? (<>
              <KInput label="Ta question" value={questionText} onChangeText={(t) => setQuestionText(t.slice(0, 200))} placeholder="Qui est le plus susceptible de..." multiline maxLength={200} style={{ minHeight: 80, textAlignVertical: "top" }} containerStyle={{ marginBottom: spacing.xs }}/>
              <KText variant="caption" color={trimmed.length < 10
                ? colors.textMuted
                : trimmed.length >= 190
                    ? colors.error
                    : colors.textMuted} style={{ textAlign: "right", marginBottom: spacing.md }}>
                {trimmed.length}/200 {trimmed.length > 0 && trimmed.length < 10 ? "(min 10)" : ""}
              </KText>
            </>) : (<KText variant="bodySmall" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
              L'algorithme choisira une question de la banque a ta place.
            </KText>)}

          <KText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
            Intensite
          </KText>
          <View style={{ flexDirection: "row", marginBottom: spacing.lg }}>
            <TouchableOpacity onPress={() => setIntensity("normal")} activeOpacity={0.7} style={{
            flex: 1,
            paddingVertical: spacing.sm,
            borderRadius: 12,
            alignItems: "center",
            backgroundColor: intensity === "normal"
                ? "rgba(149, 114, 207, 0.3)"
                : "rgba(255, 255, 255, 0.05)",
            borderWidth: 1,
            borderColor: intensity === "normal"
                ? colors.violet.primary
                : "rgba(255, 255, 255, 0.1)",
            marginRight: spacing.sm,
        }}>
              <KText variant="body" color={intensity === "normal" ? colors.textPrimary : colors.textSecondary}>
                Normal
              </KText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIntensity("epice")} activeOpacity={0.7} style={{
            flex: 1,
            paddingVertical: spacing.sm,
            borderRadius: 12,
            alignItems: "center",
            backgroundColor: intensity === "epice"
                ? "rgba(239, 68, 68, 0.3)"
                : "rgba(255, 255, 255, 0.05)",
            borderWidth: 1,
            borderColor: intensity === "epice" ? "#EF4444" : "rgba(255, 255, 255, 0.1)",
        }}>
              <KText variant="body" color={intensity === "epice" ? colors.textPrimary : colors.textSecondary}>
                Epice
              </KText>
            </TouchableOpacity>
          </View>

          <KButton title="Confirmer ma question" onPress={handleSubmit} loading={submitting} disabled={!isValid || submitting}/>
        </GlassCard>
      </Animated.View>

      <GlassModal visible={confirmVisible} onClose={() => {
            setConfirmVisible(false);
            onSubmitted();
        }}>
        <KText variant="h3" style={{ textAlign: "center", marginBottom: spacing.sm }}>
          Proposition envoyee
        </KText>
        <KText variant="bodySmall" color={colors.textSecondary} style={{ textAlign: "center", marginBottom: spacing.lg }}>
          Ta proposition est verouillee jusqu'au prochain cycle.
        </KText>
        <KButton title="Compris" onPress={() => {
            setConfirmVisible(false);
            onSubmitted();
        }}/>
      </GlassModal>
    </>);
}
