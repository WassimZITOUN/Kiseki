# MLD (Modèle Logique de Données) - Schéma `public`

> Source: base Supabase du projet (snapshot du schéma au 21/02/2026).

profiles (id, username, display_name, avatar_url, expo_push_token, created_at, updated_at)
id: clé primaire
id: clé étrangère vers id de auth.users

tags (id, name, label, emoji)
id: clé primaire

groups (id, name, invite_code, created_by, max_members, question_time, reveal_time, allowed_intensities, created_at, current_cycle)
id: clé primaire
created_by: clé étrangère vers id de profiles

group_members (id, group_id, user_id, role, joined_at, cycle_eligible_at)
id: clé primaire
group_id: clé étrangère vers id de groups
user_id: clé étrangère vers id de profiles

question_bank (id, question, category, intensity, tag_id, is_active)
id: clé primaire
tag_id: clé étrangère vers id de tags

user_questions (id, group_id, created_by, question, category, intensity, tag_id, used_count, created_at)
id: clé primaire
group_id: clé étrangère vers id de groups
created_by: clé étrangère vers id de profiles
tag_id: clé étrangère vers id de tags

daily_questions (id, group_id, question, status, source_type, source_id, intensity, tag_id, created_at, revealed_at)
id: clé primaire
group_id: clé étrangère vers id de groups
tag_id: clé étrangère vers id de tags

votes (id, question_id, voter_id, target_user_id, context_note, created_at)
id: clé primaire
question_id: clé étrangère vers id de daily_questions
voter_id: clé étrangère vers id de profiles
target_user_id: clé étrangère vers id de profiles

daily_slots (id, group_id, assigned_user_id, target_date, slot_order, cycle_number, status, final_question_text, source_type, source_id, daily_question_id, admin_replaced_at, admin_replaced_by, created_at, activated_at)
id: clé primaire
group_id: clé étrangère vers id de groups
assigned_user_id: clé étrangère vers id de profiles
daily_question_id: clé étrangère vers id de daily_questions
admin_replaced_by: clé étrangère vers id de profiles

user_submissions (id, slot_id, group_id, submitted_by, question_text, intensity, tag_id, submitted_at, updated_at, choose_bank)
id: clé primaire
slot_id: clé étrangère vers id de daily_slots
group_id: clé étrangère vers id de groups
submitted_by: clé étrangère vers id de profiles
tag_id: clé étrangère vers id de tags

## Liaisons principales (cardinalités usuelles)

profiles (1,N) groups via groups.created_by
groups (1,N) group_members via group_members.group_id
profiles (1,N) group_members via group_members.user_id
groups (1,N) user_questions via user_questions.group_id
profiles (1,N) user_questions via user_questions.created_by
tags (1,N) question_bank via question_bank.tag_id
tags (1,N) user_questions via user_questions.tag_id
groups (1,N) daily_questions via daily_questions.group_id
tags (1,N) daily_questions via daily_questions.tag_id
daily_questions (1,N) votes via votes.question_id
profiles (1,N) votes via votes.voter_id
profiles (1,N) votes via votes.target_user_id
groups (1,N) daily_slots via daily_slots.group_id
profiles (1,N) daily_slots via daily_slots.assigned_user_id
profiles (1,N) daily_slots via daily_slots.admin_replaced_by
daily_questions (1,N) daily_slots via daily_slots.daily_question_id
daily_slots (1,1) user_submissions via user_submissions.slot_id (contrainte UNIQUE sur slot_id)
groups (1,N) user_submissions via user_submissions.group_id
profiles (1,N) user_submissions via user_submissions.submitted_by
tags (1,N) user_submissions via user_submissions.tag_id
