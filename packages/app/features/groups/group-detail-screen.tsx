"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import type {
  DailyQuestion,
  Vote,
  GroupMemberWithProfile,
  Group,
  QuestionWithResults,
} from "@my-app/types";
import { getSupabase } from "../../utils/supabase";
import { services } from "@my-app/core";
import { GroupMenu } from "./components/group-menu";
import { VoteConfirmModal } from "./components/vote-confirm-modal";
import { VoteDetailsSheet } from "./components/vote-details-sheet";
import { ShareResultSheet } from "./components/share-result-sheet";
import {
  AuroraScreenWrapper,
  KText,
  KButton,
  KHeader,
  GlassCard,
  ErrorBanner,
  VoteGrid,
  QuestionHeader,
  CountdownTimer,
  ConfettiOverlay,
  PodiumView,
  ResultCard,
  TomorrowTeaser,
  colors,
  spacing,
  type VoteMember,
  type PodiumMember,
  type ResultItem,
} from "@repo/ui";

const { createVotesService, createGroupsService } = services;

type Props = {
  groupId: string;
  onLeft?: () => void;
  onBack?: () => void;
};

export function GroupDetailScreen({ groupId, onLeft, onBack }: Props) {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
  const [question, setQuestion] = useState<DailyQuestion | null | undefined>(
    undefined
  );
  const [myVote, setMyVote] = useState<Vote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Vote state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [contextNote, setContextNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showVoteReview, setShowVoteReview] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [questionResults, setQuestionResults] = useState<QuestionWithResults | null>(null);
  const [voteDetailsVisible, setVoteDetailsVisible] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [tomorrowCountdown, setTomorrowCountdown] = useState("");

  // Menu state
  const [menuVisible, setMenuVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Vote confirm modal state
  const [voteModalVisible, setVoteModalVisible] = useState(false);

  // Countdown
  const [countdown, setCountdown] = useState("");
  const [timerExpired, setTimerExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const supabase = getSupabase();
      const votesService = createVotesService(supabase);
      const groupsService = createGroupsService(supabase);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const [todayQuestion, detail] = await Promise.all([
        votesService.getTodayQuestion(groupId),
        groupsService.getGroupDetail(groupId),
      ]);

      setGroup(detail.group);
      setMembers(detail.members);
      setQuestion(todayQuestion);

      if (todayQuestion) {
        // Check if reveal time already passed (local time comparison)
        let revealTimePassed = false;
        if (detail.group.reveal_time && todayQuestion.status === "active") {
          const now = new Date();
          const [rh, rm] = detail.group.reveal_time.split(":").map(Number);
          const revealTarget = new Date(now);
          revealTarget.setHours(rh, rm, 0, 0);
          if (now.getTime() >= revealTarget.getTime()) {
            revealTimePassed = true;
            setTimerExpired(true);
          }
        }

        // Fetch results if revealed (DB status or client-side timer)
        if (todayQuestion.status === "revealed" || revealTimePassed) {
          // If timer expired but DB still "active", force reveal server-side
          if (revealTimePassed && todayQuestion.status === "active") {
            await votesService.revealQuestion(todayQuestion.id).catch(() => {});
          }
          const results = await votesService.getQuestionResults(todayQuestion.id);
          setQuestionResults(results);
        }

        const vote = await votesService.getMyVote(todayQuestion.id);
        setMyVote(vote);
      }
    } catch (err: any) {
      setError(err?.message ?? "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Countdown timer
  useEffect(() => {
    if (!group || !question || question.status === "revealed") return;

    const updateCountdown = () => {
      const now = new Date();
      const [h, m] = group.reveal_time.split(":").map(Number);
      const target = new Date(now);
      target.setHours(h, m, 0, 0);

      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown("00:00:00");
        if (timerRef.current) clearInterval(timerRef.current);
        setTimerExpired(true);
        fetchData();
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      );
    };

    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [group, question, fetchData]);

  // Tomorrow countdown — targets question_time the next day
  useEffect(() => {
    if (!group || !question) return;
    if (question.status !== "revealed" && !timerExpired) return;

    const tomorrowTimerRef: { current: ReturnType<typeof setInterval> | null } = { current: null };

    const updateTomorrowCountdown = () => {
      const now = new Date();
      const [h, m] = group.question_time.split(":").map(Number);
      const target = new Date(now);
      target.setDate(target.getDate() + 1);
      target.setHours(h, m, 0, 0);

      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setTomorrowCountdown("00:00:00");
        if (tomorrowTimerRef.current) clearInterval(tomorrowTimerRef.current);
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTomorrowCountdown(
        `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      );
    };

    updateTomorrowCountdown();
    tomorrowTimerRef.current = setInterval(updateTomorrowCountdown, 1000);
    return () => {
      if (tomorrowTimerRef.current) clearInterval(tomorrowTimerRef.current);
    };
  }, [group, question, timerExpired]);

  const otherMembers: VoteMember[] = members
    .filter((m) => m.user_id !== currentUserId)
    .map((m) => ({
      userId: m.user_id,
      name:
        m.profiles?.display_name ?? m.profiles?.username ?? "Inconnu",
      avatarUri: m.profiles?.avatar_url,
    }));

  const getTargetName = (targetId: string) => {
    const member = members.find((m) => m.user_id === targetId);
    return (
      member?.profiles?.display_name ??
      member?.profiles?.username ??
      "Inconnu"
    );
  };

  const handleMemberTap = (userId: string) => {
    if (myVote) return;
    setSelectedUserId(userId);
    setContextNote("");
    setVoteModalVisible(true);
  };

  const handleSubmitVote = async () => {
    if (!selectedUserId || !question) return;
    setSubmitting(true);
    setError(null);
    try {
      const votesService = createVotesService(getSupabase());
      const vote = await votesService.submitVote(
        question.id,
        selectedUserId,
        contextNote || undefined
      );
      setMyVote(vote);
      setVoteModalVisible(false);
      setShowConfetti(true);
      setSelectedUserId(null);
      setContextNote("");

      if (Platform.OS !== "web") {
        try {
          const Haptics = require("expo-haptics");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }
    } catch (err: any) {
      setError(err?.message ?? "Erreur lors du vote");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = async () => {
    if (!group) return;
    try {
      if (Platform.OS === "web") {
        await navigator.clipboard.writeText(group.invite_code);
      } else {
        const Clipboard = require("expo-clipboard");
        await Clipboard.setStringAsync(group.invite_code);
      }
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {}
  };

  const handleRemoveMember = async (
    userId: string,
    _displayName: string
  ) => {
    try {
      const service = createGroupsService(getSupabase());
      await service.removeMember(groupId, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err: any) {
      setError(err?.message ?? "Erreur lors de l'exclusion");
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      const service = createGroupsService(getSupabase());
      await service.leaveGroup(groupId);
      setMenuVisible(false);
      onLeft?.();
    } catch (err: any) {
      setError(err?.message ?? "Erreur");
      setLeaving(false);
    }
  };

  // --- Invite code footer ---
  const renderInviteCode = () => {
    if (!group) return null;
    return (
      <TouchableOpacity
        onPress={handleCopyCode}
        style={{
          marginHorizontal: spacing.lg,
          marginBottom: 45,
        }}
      >
        <GlassCard
          style={{
            alignItems: "center",
            paddingVertical: spacing.sm,
            backgroundColor: codeCopied
              ? "rgba(56, 161, 105, 0.15)"
              : undefined,
          }}
        >
          <KText
            variant="caption"
            color={codeCopied ? colors.success : colors.textSecondary}
            style={{ fontWeight: "500" }}
          >
            {codeCopied
              ? "Code copie !"
              : `Code d'invitation : ${group.invite_code.toUpperCase()}`}
          </KText>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const isWeb = Platform.OS === "web";
  const BlurView = !isWeb ? require("expo-blur").BlurView : null;

  const headerRightAction = (
    <TouchableOpacity
      onPress={() => setMenuVisible(true)}
      activeOpacity={0.8}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        shadowColor: "#A29BFE",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      {/* Blur layer */}
      {!isWeb && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: 22, overflow: "hidden" },
          ]}
        >
          <BlurView
            intensity={25}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
      {/* Border + bg layer */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: 22,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.25)",
            backgroundColor: "rgba(255,255,255,0.02)",
            ...(isWeb
              ? {
                  // @ts-ignore web-only
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }
              : {}),
          },
        ]}
      />
      {/* Icon */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <KText variant="h3" color={colors.textPrimary}>
          ⋯
        </KText>
      </View>
    </TouchableOpacity>
  );

  // --- Loading ---
  if (loading) {
    return (
      <AuroraScreenWrapper>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={colors.violet.primary} />
        </View>
      </AuroraScreenWrapper>
    );
  }

  if (!group) {
    return (
      <AuroraScreenWrapper>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <KText variant="body" color={colors.textMuted}>
            Groupe introuvable
          </KText>
        </View>
      </AuroraScreenWrapper>
    );
  }

  // --- State D: Question revealed (or timer expired client-side) ---
  if (question && (question.status === "revealed" || timerExpired)) {
    const allResults: ResultItem[] = (questionResults?.results ?? []).map((r: any) => ({
      userId: r.target_user_id,
      name: r.target.display_name ?? r.target.username,
      avatarUri: r.target.avatar_url,
      voteCount: r.vote_count,
      percentage: r.percentage,
      comments: r.context_notes ?? [],
    }));

    const podiumMembers: PodiumMember[] = allResults.slice(0, 3).map(
      (r) => ({
        userId: r.userId,
        name: r.name,
        avatarUri: r.avatarUri,
        voteCount: r.voteCount,
      })
    );

    const restResults = allResults.slice(3);

    return (
      <AuroraScreenWrapper>
        <KHeader
          title={group.name}
          onBack={onBack}
          rightAction={headerRightAction}
        />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Animated.View entering={FadeIn.duration(600)}>
            <KText
              variant="questionLarge"
              style={{
                textAlign: "center",
                marginTop: spacing.md,
                marginBottom: spacing.xs,
              }}
            >
              Le Verdict
            </KText>
            <KText
              variant="bodySmall"
              color={colors.textSecondary}
              style={{
                textAlign: "center",
                marginBottom: spacing.md,
              }}
            >
              {question.question}
            </KText>
          </Animated.View>

          {allResults.length > 0 ? (
            <>
              {/* Podium — Top 3 */}
              <PodiumView members={podiumMembers} />

              {/* Rest of results */}
              {restResults.length > 0 && (
                <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.md }}>
                  {restResults.map((item, i) => (
                    <ResultCard
                      key={item.userId}
                      item={item}
                      rank={i + 4}
                      delay={600 + i * 100}
                    />
                  ))}
                </View>
              )}

              {/* Vote details button */}
              <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.lg }}>
                <KButton
                  title="Detail des votes"
                  onPress={() => setVoteDetailsVisible(true)}
                  variant="glass"
                />
              </View>

              {/* Share button */}
              <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.sm }}>
                <KButton
                  title="Partager"
                  onPress={() => setShareSheetVisible(true)}
                  variant="glass"
                  leftIcon={<Feather name="share-2" size={16} color={colors.textPrimary} />}
                />
              </View>
            </>
          ) : (
            <Animated.View entering={FadeIn.duration(400)} style={{ paddingHorizontal: spacing.md }}>
              <GlassCard style={{ alignItems: "center", paddingVertical: spacing.xl }}>
                <KText variant="h3" style={{ marginBottom: spacing.sm }}>
                  Personne n'a vote aujourd'hui
                </KText>
                <KText variant="bodySmall" color={colors.textMuted} style={{ textAlign: "center" }}>
                  Reviens demain et sois le premier a voter !
                </KText>
              </GlassCard>
            </Animated.View>
          )}

          {/* Tomorrow teaser */}
          {tomorrowCountdown !== "" && (
            <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.lg }}>
              <TomorrowTeaser countdown={tomorrowCountdown} />
            </View>
          )}
        </ScrollView>

        {renderInviteCode()}

        <GroupMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          members={members}
          group={group}
          leaving={leaving}
          onLeave={handleLeave}
          onCopyCode={handleCopyCode}
          codeCopied={codeCopied}
          currentUserId={currentUserId}
          onRemoveMember={handleRemoveMember}
        />

        <VoteDetailsSheet
          visible={voteDetailsVisible}
          onClose={() => setVoteDetailsVisible(false)}
          votes={(questionResults as any)?.votes ?? []}
          question={question.question}
        />

        <ShareResultSheet
          visible={shareSheetVisible}
          onClose={() => setShareSheetVisible(false)}
          question={question.question}
          winnerName={allResults[0]?.name ?? ""}
          winnerAvatarUri={allResults[0]?.avatarUri}
          winnerVoteCount={allResults[0]?.voteCount ?? 0}
          groupName={group.name}
        />
      </AuroraScreenWrapper>
    );
  }

  // --- State C: No question today ---
  if (question === null) {
    return (
      <AuroraScreenWrapper>
        <KHeader
          title={group.name}
          onBack={onBack}
          rightAction={headerRightAction}
        />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: spacing.lg,
          }}
        >
          <Animated.View
            entering={FadeIn.duration(500)}
            style={{ alignItems: "center" }}
          >
            <GlassCard
              style={{
                marginHorizontal: spacing.md,
                alignItems: "center",
              }}
            >
              <KText
                variant="questionLarge"
                color={colors.textMuted}
                style={{ textAlign: "center", marginBottom: spacing.sm }}
              >
                Pas de question aujourd'hui
              </KText>
              <KText
                variant="bodySmall"
                color={colors.textMuted}
                style={{ textAlign: "center" }}
              >
                Reviens demain pour voter !
              </KText>
            </GlassCard>
          </Animated.View>
        </View>
        {renderInviteCode()}
        <GroupMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          members={members}
          group={group}
          leaving={leaving}
          onLeave={handleLeave}
          onCopyCode={handleCopyCode}
          codeCopied={codeCopied}
          currentUserId={currentUserId}
          onRemoveMember={handleRemoveMember}
        />
      </AuroraScreenWrapper>
    );
  }

  // --- State B: Already voted ---
  if (myVote) {
    return (
      <AuroraScreenWrapper>
        <KHeader
          title={group.name}
          onBack={onBack}
          rightAction={headerRightAction}
        />

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: spacing.lg,
          }}
        >
          {showVoteReview ? (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={{ alignItems: "center", width: "100%" }}
            >
              <GlassCard
                style={{
                  width: "100%",
                  maxWidth: 340,
                  marginBottom: spacing.lg,
                }}
              >
                <KText
                  variant="h3"
                  style={{
                    textAlign: "center",
                    marginBottom: spacing.sm,
                  }}
                >
                  {question!.question}
                </KText>
                <KText
                  variant="body"
                  color={colors.textSecondary}
                  style={{ textAlign: "center" }}
                >
                  Ton choix : {getTargetName(myVote.target_user_id)}
                </KText>
                {myVote.context_note && (
                  <KText
                    variant="bodySmall"
                    color={colors.textMuted}
                    style={{
                      textAlign: "center",
                      fontStyle: "italic",
                      marginTop: spacing.sm,
                    }}
                  >
                    "{myVote.context_note}"
                  </KText>
                )}
              </GlassCard>
              <KButton
                title="Fermer"
                onPress={() => setShowVoteReview(false)}
                variant="ghost"
              />
            </Animated.View>
          ) : (
            <Animated.View
              entering={SlideInUp.duration(400)}
              style={{ alignItems: "center" }}
            >
              <GlassCard
                style={{
                  marginHorizontal: spacing.md,
                  alignItems: "center",
                }}
              >
                <CountdownTimer countdown={countdown} />

                <KButton
                  title="Revoir mon vote"
                  onPress={() => setShowVoteReview(true)}
                  variant="glass"
                  style={{ marginTop: spacing.xl }}
                />
              </GlassCard>
            </Animated.View>
          )}
        </View>

        {renderInviteCode()}

        <GroupMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          members={members}
          group={group}
          leaving={leaving}
          onLeave={handleLeave}
          onCopyCode={handleCopyCode}
          codeCopied={codeCopied}
          currentUserId={currentUserId}
          onRemoveMember={handleRemoveMember}
        />
      </AuroraScreenWrapper>
    );
  }

  // --- State A: Question active, vote form ---
  return (
    <AuroraScreenWrapper>
      <KHeader
        title={group.name}
        onBack={onBack}
        rightAction={headerRightAction}
      />

      <ErrorBanner message={error} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <GlassCard
          style={{
            marginHorizontal: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <QuestionHeader
            question={question!.question}
            subtitle="Question du jour"
          />
        </GlassCard>

        <VoteGrid
          members={otherMembers}
          selectedUserId={selectedUserId}
          onSelectMember={handleMemberTap}
          disabled={!!myVote}
        />
      </ScrollView>

      {renderInviteCode()}

      <GroupMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        members={members}
        group={group}
        leaving={leaving}
        onLeave={handleLeave}
        onCopyCode={handleCopyCode}
        codeCopied={codeCopied}
        currentUserId={currentUserId}
        onRemoveMember={handleRemoveMember}
      />

      <VoteConfirmModal
        visible={voteModalVisible}
        targetName={selectedUserId ? getTargetName(selectedUserId) : ""}
        contextNote={contextNote}
        onChangeContextNote={setContextNote}
        onConfirm={handleSubmitVote}
        onCancel={() => {
          setVoteModalVisible(false);
          setSelectedUserId(null);
          setContextNote("");
        }}
        submitting={submitting}
      />

      <ConfettiOverlay
        visible={showConfetti}
        onDone={() => setShowConfetti(false)}
      />
    </AuroraScreenWrapper>
  );
}
