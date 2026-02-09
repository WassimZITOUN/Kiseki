# Kiseki - Resume du Projet

## 1. Presentation

**Kiseki** (qui c'est qui) est une application mobile de vote social quotidien entre amis.
Chaque jour, une question du type "Qui est le plus susceptible de..." est posee a un groupe.
Les membres votent, puis les resultats sont reveles le soir avec transparence totale.

- **Plateformes** : Android (prioritaire), iOS, Web
- **Stack** : React Native (Expo SDK 54) + Next.js 15 + Supabase
- **Architecture** : Monorepo avec npm workspaces + Turborepo

---

## 2. Architecture du monorepo

### `apps/expo/` — Application mobile

- Expo SDK 54, React Native 0.81.5, React 19.1
- Navigation : expo-router v4 (file-based routing)
- 12 fichiers de route (auth + app + groupes)

### `apps/next/` — Application web

- Next.js 15.5.7, App Router, React 19.1
- 11 fichiers de route (meme couverture que mobile)
- 5 stubs pour modules natifs (`apps/next/stubs/`) :
  - `expo-secure-store.js` : localStorage fallback
  - `expo-image-picker.js` : input file web
  - `expo-blur.js` : CSS backdrop-filter
  - `expo-haptics.js` : no-op
  - `empty.js` : google-signin

### `packages/ui/` (`@repo/ui`) — Design System

22 composants + 1 fichier de tokens, organises par categorie :

| Categorie | Composants |
|-----------|-----------|
| **Fondation** | `tokens`, `KText`, `KButton`, `KInput`, `KAvatar`, `KHeader`, `ErrorBanner`, `GoogleLogo` |
| **Glassmorphisme** | `GlassCard`, `GlassModal`, `GlassBottomSheet` |
| **Fond Aurora** | `AuroraBackground`, `AuroraScreenWrapper` |
| **Vote** | `VoteCard`, `VoteGrid`, `QuestionHeader`, `ConfettiOverlay`, `CountdownTimer`, `BlurredReveal` |
| **Resultats** | `PodiumView`, `ResultCard`, `ShareResultCard`, `TomorrowTeaser` |

Types exportes : `VoteMember`, `PodiumMember`, `ResultItem`

### `packages/app/` (`@repo/app`) — Ecrans et logique partagee

**9 ecrans** (`features/`) :

| Feature | Ecrans |
|---------|--------|
| **Auth** | `login-screen`, `signup-screen`, `profile-setup-screen` |
| **Home** | `screen` (accueil avec liste des groupes, question du jour) |
| **Groupes** | `create-group-screen`, `join-group-screen`, `group-detail-screen` |
| **Profil** | `profile-screen`, `edit-profile-screen` |

**4 composants groupes** (`features/groups/components/`) :
- `vote-confirm-modal` : modal de confirmation de vote
- `group-menu` : menu contextuel du groupe (quitter, exclure)
- `vote-details-sheet` : bottom sheet detail des votes
- `share-result-sheet` : bottom sheet de partage d'image

**1 provider** (`providers/auth-provider.tsx`) : `AuthProvider`, `useAuth`

**2 utilitaires** (`utils/`) : `supabase.ts` (client singleton), `avatar.ts` (pick + upload)

### `packages/core/` (`@my-app/core`) — Services metier

**`groups.ts`** — `createGroupsService(supabase)` :
- `createGroup()`, `joinGroupByCode()`, `getMyGroups()`, `getGroupDetail()`, `leaveGroup()`, `removeMember()`

**`votes.ts`** — `createVotesService(supabase)` :
- `getTodayQuestion()`, `getMyVote()`, `submitVote()`, `revealQuestion()`, `getQuestionResults()`

### `packages/types/` (`@my-app/types`) — Types TypeScript

Types miroir Supabase : `Profile`, `Group`, `GroupMember`, `DailyQuestion`, `Vote`, `Tag`, `QuestionBank`, `UserQuestion`
Types joints : `GroupWithStatus`, `GroupWithMemberCount`, `GroupMemberWithProfile`, `VoteWithProfiles`, `VoteResult`, `QuestionWithResults`, `WeeklyRecap`
Types app : `AuthState`, `WidgetData`, `NotificationPayload`, `QuestionIntensity`

### `supabase/` — Backend

- `migrations/001_kiseki_schema.sql` : schema complet (8 tables, RLS, triggers, fonctions, pg_cron)
- `functions/share-image/` : edge function de generation de carte PNG

### `docs/` — Documentation technique

- `partage-image-edge-function.md` : documentation de la feature de partage d'image

---

## 3. Design System

**Style** : Pop-Japandi — glassmorphisme premium a 4 couches sur fond fixe 3D.

### Palette

| Role | Couleur | Hex |
|------|---------|-----|
| Primary | Violet | `#9572CF` |
| Deep Space (fond) | Bleu-noir | `#120d26` |
| Surface glass | Blanc translucide | `rgba(255,255,255,0.08)` |
| Orbes neon | Violet / Bleu / Rose | gradients Aurora |

### Typographie

- **Titres / questions** : DM Serif Display, 34px (expo-font sur mobile, next/font/google sur web)
- **Body** : System sans-serif (par defaut React Native)

### Glassmorphisme 4 couches

1. **Shadow** : ombre portee
2. **BlurView** : flou gaussien (expo-blur, `experimentalBlurMethod="dimezisBlurView"` sur Android)
3. **LinearGradient** : surface semi-transparente
4. **Content** : texte et icones

Composants : `GlassCard` (intensity=30), `GlassModal` (intensity=80), `GlassBottomSheet` (intensity=80)

### Fond Aurora

`AuroraBackground` : gradient statique 3D avec formes colorees (LinearGradient), "?" decoratifs, overlay de bruit, sur fond Deep Space. Pas d'animation (pas de reanimated).

`AuroraScreenWrapper` : wrapper KeyboardAvoidingView pour tous les ecrans.

Ref : voir `CHARTE_GRAPHIQUE.md` pour la specification complete.

---

## 4. Backend Supabase

### Tables (8)

| Table | Description | Lignes |
|-------|------------|--------|
| `profiles` | Profils utilisateurs (miroir auth.users) | 16 |
| `tags` | 30 traits predefinis (charismatique, drole, etc.) | 30 |
| `groups` | Groupes avec code invite, horaires, intensites | 7 |
| `group_members` | Membres (role admin/member) | 23 |
| `question_bank` | 10 questions globales (normal + epice) | 10 |
| `user_questions` | Questions creees par les utilisateurs | 0 |
| `daily_questions` | Question du jour par groupe | 15 |
| `votes` | Votes avec constraint unique (1 vote/personne) | 27 |

### RLS (Row Level Security)

20 politiques RLS actives sur toutes les tables :
- Profils : lecture publique, ecriture propre
- Groupes : visibles par membres, lookup par invite_code, CRUD admin
- Membres : visibles entre membres, auto-insertion, suppression (leave/kick)
- Votes : anti-triche (voter_id = auth.uid), transparence apres reveal
- Questions : lecture membres, insertion admin

### Triggers et fonctions SQL

| Fonction | Role |
|----------|------|
| `handle_new_user()` | Auto-creation profil a l'inscription |
| `handle_new_group()` | Auto-ajout du createur comme admin |
| `handle_updated_at()` | Mise a jour du timestamp |
| `join_group_by_code(code)` | Rejoindre un groupe par code invite (check max_members) |
| `reveal_question(id)` | Reveal manuel d'une question |
| `assign_daily_questions()` | Attribution quotidienne (pool bank + user, evite doublons 30j) |
| `reveal_due_questions()` | Reveal auto selon l'horaire du groupe |

### pg_cron

| Job | Frequence | Action |
|-----|-----------|--------|
| `kiseki-assign-daily-questions` | Tous les jours a 08:00 UTC | `assign_daily_questions()` |
| `kiseki-reveal-due-questions` | Toutes les 5 minutes | `reveal_due_questions()` |

### Edge Functions deployees

| Slug | Description | JWT |
|------|------------|-----|
| `share-card` | Generation carte PNG 1200x630 (og_edge) | Non |
| `share-image` | Version anterieure de share-card | Non |

### Storage

- Bucket `avatars` : photos de profil utilisateur

---

## 5. Fonctionnalites implementees

### Authentification
- Connexion email/mot de passe
- Inscription (email, mot de passe, username, display_name)
- Google Sign-In natif (SDK) sur mobile, OAuth redirect sur web
- Setup profil : choix de photo (expo-image-picker mobile, input file web)
- Edition profil : nom, username, avatar
- Upload avatar vers Supabase Storage

### Groupes
- Creation de groupe (nom, parametres)
- Rejoindre un groupe par code invite (8 caracteres)
- Detail du groupe : membres, question du jour, resultats
- Quitter un groupe
- Exclure un membre (admin)

### Vote quotidien
- Question du jour affichee avec `QuestionHeader`
- Grille de vote (`VoteGrid`) avec avatars des membres
- Modal de confirmation (`VoteConfirmModal`)
- Animation confetti apres vote (`ConfettiOverlay`)
- Countdown vers le reveal (`CountdownTimer`)
- Guard : 1 seul vote par personne par question (constraint SQL)

### Resultats / Verdict
- Podium top 3 (`PodiumView`) avec couronnes
- Classement complet (`ResultCard`)
- Detail des votes : qui a vote pour qui (`VoteDetailsSheet`)
- Gestion du verdict vide (aucun vote) : guard `allResults.length`
- Transparence totale apres reveal (politique RLS)

### Partage d'image
- Carte violette 1200x630 generee par edge function `share-card` (og_edge v0.0.4)
- Bottom sheet de partage (`ShareResultSheet`)
- Copie dans le clipboard
- Share natif (expo-sharing sur mobile)
- Font DM Serif Display avec fallback sans-serif

### Teaser retention
- `TomorrowTeaser` : countdown "prochaine question dans..." avec GlassCard verrouillee
- `BlurredReveal` : apercu floute des resultats avant le reveal

---

## 6. Routes

### Expo (expo-router v4)

```
_layout.tsx                         -> Auth guard, redirige (auth) ou (app)
(auth)/_layout.tsx                  -> Stack navigation
(auth)/login.tsx                    -> LoginScreen
(auth)/signup.tsx                   -> SignupScreen
(auth)/profile-setup.tsx            -> ProfileSetupScreen
(app)/_layout.tsx                   -> Tab navigator
(app)/index.tsx                     -> HomeScreen
(app)/profile.tsx                   -> ProfileScreen
(app)/edit-profile.tsx              -> EditProfileScreen
(app)/groups/create.tsx             -> CreateGroupScreen
(app)/groups/join.tsx               -> JoinGroupScreen
(app)/groups/[id]/index.tsx         -> GroupDetailScreen
```

### Next.js (App Router)

```
layout.tsx                          -> AuthProvider + Registry
providers.tsx                       -> Wrapper client
page.tsx                            -> Home
login/page.tsx                      -> LoginScreen
signup/page.tsx                     -> SignupScreen
profile/page.tsx                    -> ProfileScreen
profile/edit/page.tsx               -> EditProfileScreen
groups/create/page.tsx              -> CreateGroupScreen
groups/join/page.tsx                -> JoinGroupScreen
groups/[id]/page.tsx                -> GroupDetailScreen
```

---

## 7. Difficultes rencontrees et solutions

### Google Sign-In sur Expo Go
**Probleme** : `@react-native-google-signin/google-signin` necessite du code natif, incompatible Expo Go.
**Solution** : Fonctionne en dev build / production (EAS Build). En dev, connexion email/mot de passe.

### Google Sign-In sur Web
**Probleme** : Le SDK natif ne fonctionne pas sur web.
**Solution** : Detection de plateforme — `supabase.auth.signInWithOAuth({ provider: "google" })` sur web, SDK natif sur mobile.

### Erreur redirect_uri_mismatch (Google OAuth)
**Probleme** : Erreur 400 au callback Supabase.
**Solution** : Ajout de l'URI de callback Supabase dans Google Cloud Console + `http://localhost:3000` dans Supabase URL Configuration.

### Client OAuth Android deja utilise
**Probleme** : Conflit de package `com.myapp.mobile` avec SHA-1 debug partage.
**Solution** : Changement du package a `com.kiseki.app`.

### Build Next.js : expo-modules-core parse error
**Probleme** : `export type *` non supporte par webpack.
**Solution** : Stubs dans `apps/next/stubs/` + aliases webpack dans `next.config.mjs`.

### Variables d'environnement Next.js
**Probleme** : `EXPO_PUBLIC_*` non exposees cote client Next.js.
**Solution** : Bloc `env` dans `next.config.mjs` pour mapper les variables + symlink `.env.local`.

### Upload photo de profil sur Web
**Probleme** : Stub expo-image-picker retournait `{ canceled: true }`.
**Solution** : `<input type="file" accept="image/*">` natif sur web avec extraction du type MIME depuis data URL.

### expo-router non hoiste dans le monorepo
**Probleme** : npm ne hoist pas expo-router (conflits de peer deps). `babel-preset-expo` ne trouve pas le module.
**Solution** : Ajout manuel de `expoRouterBabelPlugin` dans `apps/expo/babel.config.js`.

### Edge function og_edge bloquee
**Probleme** : Les versions recentes de `og_edge` echouaient en production (import Deno incompatible).
**Solution** : Nouvelle edge function `share-card` avec `og_edge@0.0.4` (version compatible Supabase Edge Runtime).

### Android blur ne fonctionne pas
**Probleme** : `expo-blur` BlurView ne rendait rien sur Android par defaut.
**Solution** : Ajout de `experimentalBlurMethod="dimezisBlurView"` sur tous les BlurView.

### Verdict vide sans votes
**Probleme** : Crash quand aucun vote n'a ete soumis pour une question revelee.
**Solution** : Guard `allResults.length > 0` avant d'acceder aux resultats.

---

## 8. Ce qu'il reste a faire

- **Notifications push** : expo-notifications + expo-device, edge function `send-notifications`
- **Weekly Recap** : edge function `send-weekly-recap` (dimanche 18h) + ecran recap (top 3 tags par groupe)
- **Widget Android** : react-native-android-widget, question active + mini-avatars
- **Questions custom** : pool utilisateur, creation question (texte + categorie + tag), pas de doublons 30j
- **Historique 30 jours** : ecran historique des questions/resultats passes
- **Test + Deploy** : EAS Build (APK), Supabase db push + functions deploy, demo BTS SIO

---

## 9. Configuration externe

| Service | Configure | Reste a faire |
|---------|-----------|---------------|
| Supabase | Projet cree, schema migre, Auth Google, Storage avatars, 4 edge functions deployees, pg_cron actif | Edge functions notifs/recap |
| Google Cloud | Client OAuth Web + Android (com.kiseki.app) | Verifier config prod |
| Expo | SDK 54, expo-router v4, plugins configures | EAS Build pour dev builds |
| Variables env | `.env.local` (Supabase URL/Key + Google Web Client ID) | Variables de prod |
