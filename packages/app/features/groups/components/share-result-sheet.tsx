"use client";

import { useState } from "react";
import { View, TouchableOpacity, Platform, Share, ActivityIndicator } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
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

  // Common logic to get image data from the Supabase function
  const getImageData = async () => {
    console.log("Attempting to invoke share-image function...");
    const supabase = getSupabase();
    const body = { question, winnerName, winnerAvatarUri, groupName, winnerVoteCount };
    console.log("Invoking with body:", body);

    const { data, error } = await supabase.functions.invoke("share-image", {
      body,
    });

    if (error) {
      console.error("Supabase function invocation error:", error);
      throw new Error(`Erreur lors de l'appel de la fonction: ${error.message}`);
    }
    if (!data) {
      console.error("No image data returned from function.");
      throw new Error("Aucune donnée d'image retournée.");
    }
    console.log("Successfully received image data from function.");
    return data;
  };

  const handleShareImage = async () => {
    setLoadingShare(true);
    try {
      const imageData = await getImageData();

      if (Platform.OS === "web") {
        const url = URL.createObjectURL(imageData);
        window.open(url, "_blank");
        return;
      }

      const uri = FileSystem.cacheDirectory + "share-image.png";
      const reader = new FileReader();
      reader.readAsDataURL(imageData);
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
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoadingShare(false);
    }
  };

  const handleCopyImage = async () => {
    setLoadingCopy(true);
    try {
      const imageData = await getImageData();

      if (Platform.OS === "web") {
        // Web clipboard API for images is complex and requires user gesture
        // For simplicity, we'll just open it in a new tab on web for copy
        const url = URL.createObjectURL(imageData);
        window.open(url, "_blank");
        alert("Image ouverte dans un nouvel onglet. Vous pouvez la copier manuellement.");
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(imageData);
      reader.onloadend = async () => {
        const base64data = (reader.result as string); // Full base64 string including data:image/png;base64,
        await Clipboard.setImageAsync({ base64: base64data });
        alert("Image copiée dans le presse-papiers !");
      };
    } catch (err: any) {
      console.error(err);
      alert(err.message);
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
          variant="glass"
          disabled={loadingShare || loadingCopy}
          leftIcon={
            loadingShare ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
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
          disabled={loadingCopy || loadingShare}
          leftIcon={
            loadingCopy ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : undefined
          }
        />
      </View>
    </GlassBottomSheet>
  );
}
