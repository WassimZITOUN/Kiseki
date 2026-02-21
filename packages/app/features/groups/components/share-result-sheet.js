"use client";
import { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, Platform, Alert, Image, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getSupabase, SHARE_CARD_FUNCTION_NAME } from "../../../utils/supabase";
import { GlassBottomSheet, KText, KButton, colors, spacing, radii, } from "@repo/ui";
export function ShareResultSheet({ visible, onClose, question, winnerName, winnerAvatarUri, winnerVoteCount, groupName, }) {
    const [loadingShare, setLoadingShare] = useState(false);
    const [loadingCopy, setLoadingCopy] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState(null);
    const [previewBase64, setPreviewBase64] = useState(null);
    const [previewAspectRatio, setPreviewAspectRatio] = useState(1080 / 1920);
    const cachedImageRef = useRef(null);
    const inFlightRef = useRef(null);
    const payloadKey = `${question}|${winnerName}|${winnerAvatarUri ?? ""}|${winnerVoteCount}|${groupName}`;
    /** Call edge function → returns base64 PNG string */
    const generateImage = async () => {
        const supabase = getSupabase();
        const { data, error } = await supabase.functions.invoke(SHARE_CARD_FUNCTION_NAME, {
            body: { question, winnerName, winnerAvatarUri, groupName, winnerVoteCount },
        });
        if (error) {
            console.error("[share-image] invoke error", error);
            throw error;
        }
        if (data?.error) {
            console.error("[share-image] function error", data.error);
            throw new Error(data.error);
        }
        if (!data?.image)
            throw new Error("Pas de donnees image");
        return data.image;
    };
    const getOrGenerateImage = async () => {
        if (cachedImageRef.current)
            return cachedImageRef.current;
        if (inFlightRef.current)
            return inFlightRef.current;
        const promise = (async () => {
            const base64 = await generateImage();
            cachedImageRef.current = base64;
            return base64;
        })();
        inFlightRef.current = promise;
        try {
            return await promise;
        }
        finally {
            inFlightRef.current = null;
        }
    };
    useEffect(() => {
        cachedImageRef.current = null;
        inFlightRef.current = null;
        setPreviewBase64(null);
        setPreviewError(null);
        setPreviewAspectRatio(1080 / 1920);
    }, [payloadKey]);
    useEffect(() => {
        let alive = true;
        if (!visible)
            return () => { alive = false; };
        const loadPreview = async () => {
            setLoadingPreview(true);
            setPreviewError(null);
            try {
                const base64 = await getOrGenerateImage();
                if (alive)
                    setPreviewBase64(base64);
            }
            catch (e) {
                if (alive)
                    setPreviewError(e?.message ?? "Impossible de charger l'aperçu exact.");
            }
            finally {
                if (alive)
                    setLoadingPreview(false);
            }
        };
        loadPreview();
        return () => { alive = false; };
    }, [visible, payloadKey]);
    const handleShareImage = async () => {
        if (Platform.OS === "web")
            return;
        setLoadingShare(true);
        try {
            const base64 = await getOrGenerateImage();
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
        }
        catch (e) {
            console.error("[share-image]", e);
            Alert.alert("Erreur", e?.message ?? "Erreur inconnue");
        }
        finally {
            setLoadingShare(false);
        }
    };
    const handleCopyImage = async () => {
        if (Platform.OS === "web")
            return;
        setLoadingCopy(true);
        try {
            const base64 = await getOrGenerateImage();
            const Clipboard = require("expo-clipboard");
            await Clipboard.setImageAsync(base64);
        }
        catch (e) {
            Alert.alert("Erreur", "Impossible de copier l'image.");
        }
        finally {
            setLoadingCopy(false);
        }
    };
    return (<GlassBottomSheet visible={visible} onClose={onClose}>
      {/* Header */}
      <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: spacing.md,
        }}>
        <KText variant="h3">Partager</KText>
        <TouchableOpacity onPress={onClose} style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: radii.full,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
        }}>
          <KText variant="bodySmall" color={colors.textMuted}>
            Fermer
          </KText>
        </TouchableOpacity>
      </View>

      {/* Share card preview (exact generated image) */}
      <View style={{
            width: "100%",
            maxWidth: 340,
            alignSelf: "center",
            borderRadius: radii.xl,
            overflow: "hidden",
            backgroundColor: "transparent",
            justifyContent: "center",
            alignItems: "center",
        }}>
        {previewBase64 ? (<Image source={{ uri: `data:image/png;base64,${previewBase64}` }} style={{ width: "100%", aspectRatio: previewAspectRatio }} onLoad={(event) => {
                const width = event?.nativeEvent?.source?.width;
                const height = event?.nativeEvent?.source?.height;
                if (width && height)
                    setPreviewAspectRatio(width / height);
            }}/>) : loadingPreview ? (<ActivityIndicator color={colors.textPrimary}/>) : (<ActivityIndicator color={colors.textPrimary}/>)}
      </View>
      {!!previewError && (<KText variant="caption" color={colors.textMuted} style={{ textAlign: "center", marginTop: spacing.xs }}>
          {previewError}
        </KText>)}

      {/* Share image button */}
      <View style={{ marginTop: spacing.md }}>
        <KButton title="Partager l'image" onPress={handleShareImage} variant="solid" loading={loadingShare} disabled={loadingShare || loadingCopy} leftIcon={!loadingShare ? (<Feather name="share-2" size={16} color="#fff"/>) : undefined}/>
      </View>

      {/* Copy image button */}
      <View style={{ marginTop: spacing.sm }}>
        <KButton title="Copier l'image" onPress={handleCopyImage} variant="glass" loading={loadingCopy} disabled={loadingCopy || loadingShare}/>
      </View>
    </GlassBottomSheet>);
}
