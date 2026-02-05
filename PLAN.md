# Kiseki - Plan de Developpement

## Concept
App de vote social quotidien, widget-first et notification-driven. Chaque jour, une question est posee a chaque groupe. Les joueurs votent pour un membre. Les resultats sont reveles le soir. L'interaction se fait principalement via **widgets** et **notifications push**, rarement en ouvrant l'app.

### Decisions prises
- **Nom** : Kiseki (qui c'est qui)
- **Transparence** : apres reveal, tout le monde voit qui a vote pour qui
- **Questions custom** : auto-approuvees, pas de moderation admin
- **Multi-groupe** : oui, un joueur peut etre dans plusieurs groupes
- **Categories** : 2 categories (normal / epice), configurable par groupe
- **Tags** : ~30 tags de trait (charismatique, gourmand, radin...), 1 tag par question
- **Stats hebdo** : notification weekly recap avec les tags accumules

---

## Phase 0 : Schema SQL + Types (FAIT)

### Schema SQL
**Fichier** : `supabase/migrations/001_kiseki_schema.sql`

**Tables** :
- `profiles` : id, username, display_name, avatar_url, expo_push_token
- `tags` : id, name (slug), label (display), emoji
- `groups` : id, name, invite_code, created_by, max_members, question_time, reveal_time, allowed_intensities
- `group_members` : id, group_id, user_id, role (admin/member)
- `question_bank` : id, question, category, intensity (normal/epice), tag_id, is_active (10 questions de test)
- `user_questions` : id, group_id, created_by, question, category, intensity, tag_id, used_count
- `daily_questions` : id, group_id, question, status (active/revealed), source_type (bank/user), source_id, intensity, tag_id
- `votes` : id, question_id, voter_id, target_user_id, context_note (140 chars max)

**30 tags predefinies** : charismatique, gourmand, radin, tete-a-claque, drole, creatif, courageux, optimiste, leader, bavard, geek, sportif, fetard, loyal, maladroit, romantique, mysterieux, tetu, genereux, paresseux, intelligent, aventurier, sensible, bruyant, discret, charmeur, rebelle, sage, dramaqueen, autre

**Fonctions** :
- `handle_new_user()` : trigger auto-creation profil au signup
- `handle_new_group()` : trigger auto-ajout createur comme admin
- `handle_updated_at()` : trigger updated_at sur profiles
- `reveal_question(id)` : reveler une question manuellement
- `join_group_by_code(code)` : RPC pour rejoindre un groupe
- `assign_daily_questions()` : pg_cron quotidien, pioche dans bank + user_questions, filtre par allowed_intensities du groupe, copie tag_id et intensity
- `reveal_due_questions()` : pg_cron toutes les 5min, revele les questions dont l'heure est passee

**RLS** : anti-triche sur votes (SELECT seulement apres reveal), transparence totale, scope groupe, tags en lecture pour tous.

### Types TypeScript
**Fichier** : `packages/types/src/index.ts`
- Types DB : Tag, Profile, Group, GroupMember, DailyQuestion, Vote, UserQuestion, QuestionBank
- Union : QuestionIntensity ('normal' | 'epice')
- Types joins : GroupMemberWithProfile, GroupWithStatus, VoteResult, QuestionWithResults
- Types stats : WeeklyTagStat, WeeklyRecap
- Types app : AuthState, WidgetData, NotificationPayload

---

## Phase 1 : Auth

### Ecrans (packages/app/features/auth/)
1. **login-screen.tsx** - Email + mot de passe, lien signup
2. **signup-screen.tsx** - Email, mot de passe, username, display_name
3. **profile-setup-screen.tsx** - Avatar (optionnel)

### Provider
- **packages/app/providers/auth-provider.tsx** : Context React (user, session, signIn, signUp, signOut)
- Utilise `getSupabase()` existant, ecoute `onAuthStateChange`

### Routing Expo (apps/expo/app/)
```
_layout.tsx          # Verifie session -> redirige (auth) ou (app)
(auth)/
  _layout.tsx        # Stack simple
  login.tsx
  signup.tsx
  profile-setup.tsx
(app)/
  _layout.tsx        # Tab navigator (bottom tabs)
  index.tsx          # Liste des groupes
  ...
```

---

## Phase 2 : Groupes

### Ecrans (packages/app/features/groups/)
1. **groups-list-screen.tsx** - FlatList, badge voted/pending par groupe
2. **create-group-screen.tsx** - Nom, max_members, reveal_time, question_time, categories autorisees (checkboxes normal/epice)
3. **join-group-screen.tsx** - Input invite_code, preview, bouton Rejoindre
4. **group-detail-screen.tsx** - Infos, membres, code invite, bouton Quitter

### Services (packages/core/src/services/groups.ts)
- `createGroup()`, `joinGroup()`, `leaveGroup()`, `getMyGroups()`, `getGroupMembers()`

---

## Phase 3 : Vote quotidien

### Ecrans (packages/app/features/voting/)
1. **question-screen.tsx** - Question du jour avec tag + categorie, grille membres, tap pour voter, countdown
2. **vote-confirmation.tsx** - Modal confirmation, option changer le vote

### Multi-groupe
- Tabs swipeable, indicateur check vert (vote) / point orange (pas encore)

### Services (packages/core/src/services/voting.ts)
- `getTodayQuestion()`, `submitVote()`, `hasVotedToday()`, `getMyPendingGroups()`

---

## Phase 4 : Resultats / Reveal

### Ecrans (packages/app/features/results/)
1. **results-screen.tsx** - Classement, votes, couronne vainqueur, qui a vote pour qui, tag de la question
2. **history-screen.tsx** - 30 derniers jours, filtre par groupe

### Reveal automatique
- `reveal_due_questions()` via pg_cron toutes les 5min

---

## Phase 5 : Notifications Push + Weekly Recap

### Setup : expo-notifications + expo-device
### Types : question du matin, rappel, reveal, nouveau membre, weekly recap
### Deep linking : payload avec screen + groupId
### Edge Functions :
- `supabase/functions/send-notifications/index.ts` - Notifs quotidiennes
- `supabase/functions/send-weekly-recap/index.ts` - Recap hebdomadaire (dimanche 18h)

### Weekly Recap
- Joindre votes (target_user_id) + daily_questions (tag_id) + tags sur 7 jours
- Top 3 tags par utilisateur par groupe
- Notification : "Ton recap [Groupe] : ✨ Charismatique x4, 🍕 Gourmand x3"
- Ecran in-app : `packages/app/features/stats/weekly-recap-screen.tsx`

---

## Phase 6 : Widget Android

### Package : `react-native-android-widget`
### Widget "Question du Jour" : question active avec tag/categorie, mini-avatars membres, tap = vote
### iOS : notifications push uniquement (widget WidgetKit = post-MVP)

---

## Phase 7 : Questions custom

### Ecrans (packages/app/features/questions/)
1. **question-pool-screen.tsx** - Bank + custom, filtrable par categorie/tag, bouton "Proposer"
2. **create-question-screen.tsx** - Input texte, selecteur categorie (normal/epice), selecteur tag (~30 existants + "Autre"), soumettre

### Logique : auto-approuvees, pool combine, filtre par allowed_intensities, pas de doublons 30 jours

---

## Phase 8 : UI Components + Branding

### Composants (packages/ui/src/) : button, input, card, avatar, badge, countdown, tag-badge, category-picker
### Branding : app.json (nom, icone, splash), palette tailwind

---

## Phase 9 : Test + Deploy

### Test : Android emulateur + physique, iOS simulateur
### Deploy : EAS Build (APK + TestFlight), Supabase db push + functions deploy
### Demo BTS SIO : bouton dev cache pour forcer reveal, 2 telephones

---

## Checklist de verification
- [ ] Auth : signup -> login -> session persistante
- [ ] Groupes : creer -> code invite -> rejoindre depuis un autre compte
- [ ] Groupes : configurer les categories autorisees (normal/epice)
- [ ] Vote : recevoir question -> voter -> confirmer -> ne pas pouvoir re-voter
- [ ] Vote : verifier que les questions respectent les categories du groupe
- [ ] Reveal : apres l'heure -> voir resultats -> voir qui a vote pour qui
- [ ] Tags : chaque question affiche son tag et sa categorie
- [ ] Notifications : recevoir notif question du matin + notif reveal
- [ ] Weekly recap : recevoir le recap avec les tags accumules
- [ ] Widget Android : voir la question, voter depuis le widget
- [ ] Questions custom : creer avec tag + categorie -> voir dans le pool -> recevoir comme question du jour
- [ ] Multi-groupe : etre dans 2+ groupes, voter dans chacun
- [ ] Build : `turbo run build` passe sans erreur
