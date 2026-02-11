"use client";

import { useState } from "react";
import { View, TouchableOpacity, Platform, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getSupabase, SHARE_CARD_FUNCTION_NAME } from "../../../utils/supabase";
import {
  GlassBottomSheet,
  ShareResultCard,
  KText,
  KButton,
  colors,
  spacing,
  radii,
} from "@repo/ui";

type Props = {
  visible: boolean;
  onClose: () => void;
  question: string;
  winnerName: string;
  winnerAvatarUri?: string | null;
  winnerVoteCount: number;
  groupName: string;
};

export function ShareResultSheet({
  visible,
  onClose,
  question,
  winnerName,
  winnerAvatarUri,
  winnerVoteCount,
  groupName,
}: Props) {
  const [loadingShare, setLoadingShare] = useState(false);
  const [loadingCopy, setLoadingCopy] = useState(false);

  /** Call edge function → returns base64 PNG string */
  const generateImage = async (): Promise<string> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.functions.invoke(
      SHARE_CARD_FUNCTION_NAME,
      {
      body: { question, winnerName, winnerAvatarUri, groupName, winnerVoteCount },
      }
    );
    if (error) {
      console.error("[share-image] invoke error", error);
      throw error;
    }
    if (data?.error) {
      console.error("[share-image] function error", data.error);
      throw new Error(data.error);
    }
    if (!data?.image) throw new Error("Pas de donnees image");
    return data.image;
  };

  const handleShareImage = async () => {
    if (Platform.OS === "web") return;
    setLoadingShare(true);
    try {
      const base64 = await generateImage();

      const FileSystem = require("expo-file-system/legacy");
      const Sharing = require("expo-sharing");

      const uri = `${FileSystem.cacheDirectory}kiseki-share.png`;
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: "base64",
      });

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Erreur", "Le partage n'est pas disponible sur cet appareil.");
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Partager le resultat",
      });
    } catch (e: any) {
      console.error("[share-image]", e);
      Alert.alert("Erreur", e?.message ?? "Erreur inconnue");
    } finally {
      setLoadingShare(false);
    }
  };

  const handleCopyImage = async () => {
    if (Platform.OS === "web") return;
    setLoadingCopy(true);
    try {
      const base64 = await generateImage();
      const Clipboard = require("expo-clipboard");
      await Clipboard.setImageAsync(base64);
    } catch (e: any) {
      Alert.alert("Erreur", "Impossible de copier l'image.");
    } finally {
      setLoadingCopy(false);
    }
  };

  return (
    <GlassBottomSheet visible={visible} onClose={onClose}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing.md,
        }}
      >
        <KText variant="h3">Partager</KText>
        <TouchableOpacity
          onPress={onClose}
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: radii.full,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <KText variant="bodySmall" color={colors.textMuted}>
            Fermer
          </KText>
        </TouchableOpacity>
      </View>

      {/* Share card preview */}
      <ShareResultCard
        question={question}
        winnerName={winnerName}
        winnerAvatarUri={winnerAvatarUri}
        winnerVoteCount={winnerVoteCount}
        groupName={groupName}
      />

      {/* Share image button */}
      <View style={{ marginTop: spacing.md }}>
        <KButton
          title="Partager l'image"
          onPress={handleShareImage}
          variant="solid"
          loading={loadingShare}
          disabled={loadingShare || loadingCopy}
          leftIcon={
            !loadingShare ? (
              <Feather name="share-2" size={16} color="#fff" />
            ) : undefined
          }
        />
      </View>

      {/* Copy image button */}
      <View style={{ marginTop: spacing.sm }}>
        <KButton
          title="Copier l'image"
          onPress={handleCopyImage}
          variant="glass"
          loading={loadingCopy}
          disabled={loadingCopy || loadingShare}
        />
      </View>
    </GlassBottomSheet>
  );
}
