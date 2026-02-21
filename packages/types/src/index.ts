// ============================================================
// Kiseki – Types TypeScript
// Miroir du schema Supabase + types API
// ============================================================

// ----- Enums / Unions -----

export type QuestionIntensity = "normal" | "epice";

// ----- Database row types -----

export type Tag = {
  id: string;
  name: string;
  label: string;
  emoji: string | null;
};

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  expo_push_token: string | null;
  created_at: string;
  updated_at: string;
};

export type Group = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  max_members: number;
  question_time: string; // HH:MM format
  reveal_time: string;   // HH:MM format
  allowed_intensities: QuestionIntensity[];
  current_cycle: number;
  created_at: string;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  cycle_eligible_at: string;
};

export type DailyQuestion = {
  id: string;
  group_id: string;
  question: string;
  status: "active" | "revealed";
  source_type: "bank" | "user";
  source_id: string | null;
  intensity: QuestionIntensity | null;
  tag_id: string | null;
  created_at: string;
  revealed_at: string | null;
};

export type Vote = {
  id: string;
  question_id: string;
  voter_id: string;
  target_user_id: string;
  context_note: string | null;
  created_at: string;
};

export type UserQuestion = {
  id: string;
  group_id: string;
  created_by: string;
  question: string;
  category: string;
  intensity: QuestionIntensity;
  tag_id: string | null;
  used_count: number;
  created_at: string;
};

export type QuestionBank = {
  id: string;
  question: string;
  category: string;
  intensity: QuestionIntensity;
  tag_id: string | null;
  is_active: boolean;
};

// ----- Daily Slots & Submissions -----

export type DailySlotStatus = "scheduled" | "live" | "revealed" | "fallback";

export type DailySlot = {
  id: string;
  group_id: string;
  assigned_user_id: string;
  target_date: string;
  slot_order: number;
  cycle_number: number;
  status: DailySlotStatus;
  final_question_text: string | null;
  source_type: "submission" | "bank" | null;
  source_id: string | null;
  daily_question_id: string | null;
  admin_replaced_at: string | null;
  admin_replaced_by: string | null;
  created_at: string;
  activated_at: string | null;
};

export type UserSubmission = {
  id: string;
  slot_id: string;
  group_id: string;
  submitted_by: string;
  question_text: string | null;
  choose_bank: boolean;
  intensity: QuestionIntensity;
  tag_id: string | null;
  submitted_at: string;
  updated_at: string;
};

export type MyNextSlotResponse = {
  has_upcoming_slot: boolean;
  slot_id?: string;
  target_date?: string;
  cycle_submission_count?: number;
  has_submission?: boolean;
  submission?: {
    id: string;
    question_text: string | null;
    choose_bank: boolean;
    intensity: QuestionIntensity;
    tag_id: string | null;
    updated_at: string;
  } | null;
};

// ----- Joined / computed types -----

export type GroupMemberWithProfile = GroupMember & {
  profiles: Profile;
};

export type GroupWithMemberCount = Group & {
  member_count: number;
};

export type GroupWithStatus = Group & {
  member_count: number;
  today_question: DailyQuestion | null;
  has_voted: boolean;
};

export type VoteWithProfiles = Vote & {
  voter: Profile;
  target: Profile;
};

export type VoteResult = {
  target_user_id: string;
  target: Profile;
  vote_count: number;
  percentage: number;
  voters: Profile[];
};

export type QuestionWithResults = DailyQuestion & {
  tag: Tag | null;
  results: VoteResult[];
  total_votes: number;
};

// ----- Weekly Recap types -----

export type WeeklyTagStat = {
  tag: Tag;
  count: number;
  percentage: number;
};

export type WeeklyRecap = {
  user_id: string;
  group_id: string;
  group_name: string;
  week_start: string;
  week_end: string;
  tag_stats: WeeklyTagStat[];
  total_votes_received: number;
};

// ----- Auth types -----

export type AuthState = {
  user: Profile | null;
  session: { access_token: string; refresh_token: string } | null;
  loading: boolean;
};

// ----- Widget types -----

export type WidgetData = {
  question: string;
  group_name: string;
  group_id: string;
  question_id: string;
  intensity: QuestionIntensity | null;
  tag: { name: string; emoji: string | null } | null;
  members: { id: string; username: string; avatar_url: string | null }[];
  has_voted: boolean;
  reveal_time: string;
};

// ----- Notification types -----

export type NotificationType =
  | "daily_question"
  | "vote_reminder"
  | "results_reveal"
  | "member_joined"
  | "weekly_recap";

export type NotificationPayload = {
  type: NotificationType;
  group_id: string;
  question_id?: string;
  screen: "vote" | "results" | "group" | "weekly-recap";
};
