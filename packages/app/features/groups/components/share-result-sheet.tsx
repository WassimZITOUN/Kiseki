"use client";

import { useState } from "react";
import { View, TouchableOpacity, Platform, Share, ActivityIndicator } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
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
  const [loading, setLoading] = useState(false);

  const handleShareImage = async () => {
    if (Platform.OS === "web") {
      // On web, we can just open the image in a new tab for the user to save/share
      const supabase = getSupabase();
      const { data } = await supabase.functions.invoke("share-image", {
        body: { question, winnerName, winnerAvatarUri, groupName, winnerVoteCount },
      });
      if (data) {
        const url = URL.createObjectURL(data);
        window.open(url, "_blank");
      }
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.functions.invoke("share-image", {
        body: { question, winnerName, winnerAvatarUri, groupName, winnerVoteCount },
      });

      if (error) throw error;
      if (!data) throw new Error("No image data returned.");

      const uri = FileSystem.cacheDirectory + "share-image.png";
      const reader = new FileReader();
      reader.readAsDataURL(data);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(",")[1];
        await FileSystem.writeAsStringAsync(uri, base64data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (!(await Sharing.isAvailableAsync())) {
          alert("Le partage n'est pas disponible sur votre appareil.");
          return;
        }
        await Sharing.shareAsync(uri);
      };
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération de l'image.");
    } finally {
      setLoading(false);
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
          title="Partager en image"
          onPress={handleShareImage}
          variant="glass"
          disabled={loading}
          leftIcon={
            loading ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : undefined
          }
        />
      </View>
    </GlassBottomSheet>
  );
}
