"use client";

import { useState } from "react";
import { View, TouchableOpacity, Platform, Share } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getSupabase } from "../../../utils/supabase";
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

  const shareMessage = `"${question}" — Le groupe ${groupName} a choisi ${winnerName} ! — Kiseki`;

  /** Call edge function → returns base64 PNG string */
  const generateImage = async (): Promise<string> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.functions.invoke("share-image", {
      body: { question, winnerName, winnerAvatarUri, groupName, winnerVoteCount },
    });
    if (error) throw error;
    if (!data?.image) throw new Error("Pas de donnees image");
    return data.image;
  };

  const handleShareImage = async () => {
    setLoadingShare(true);
    try {
      if (Platform.OS === "web") {
        try {
          await navigator.clipboard.writeText(shareMessage);
        } catch {}
        return;
      }

      const base64 = await generateImage();
      const FileSystem = require("expo-file-system");
      const Sharing = require("expo-sharing");

      const uri = `${FileSystem.cacheDirectory}kiseki-share.png`;
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "image/png" });
      }
    } catch {
      // Fallback: share text instead
      try {
        await Share.share({ message: shareMessage });
      } catch {}
    } finally {
      setLoadingShare(false);
    }
  };

  const handleCopyImage = async () => {
    setLoadingCopy(true);
    try {
      if (Platform.OS === "web") {
        try {
          await navigator.clipboard.writeText(shareMessage);
        } catch {}
        return;
      }

      const base64 = await generateImage();
      const Clipboard = require("expo-clipboard");
      await Clipboard.setImageAsync(base64);
    } catch {
      // Silent fail
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
          leftIcon={!loadingShare ? <Feather name="share-2" size={16} color="#fff" /> : undefined}
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
