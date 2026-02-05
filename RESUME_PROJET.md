# Kiseki - Resume du Projet

## 1. Presentation

**Kiseki** (qui c'est qui) est une application mobile de vote social quotidien entre amis.
Chaque jour, une question du type "Qui est le plus susceptible de..." est posee a un groupe.
Les membres votent, puis les resultats sont reveles le soir avec transparence totale.

- **Plateformes** : Android (prioritaire), iOS, Web
- **Stack** : React Native (Expo) + Next.js + Supabase
- **Architecture** : Monorepo avec npm workspaces + Turborepo

---

## 2. Ce qui a ete fait

### Phase 0 : Infrastructure et Schema SQL

**Base de donnees Supabase** (`supabase/migrations/001_kiseki_schema.sql`) :
- 8 tables : `profiles`, `tags`, `groups`, `group_members`, `question_bank`, `user_questions`, `daily_questions`, `votes`
- 30 tags de traits predefinis (charismatique, gourmand, drole, sportif, etc.)
- 10 questions de test dans la banque
- Row Level Security (RLS) sur toutes les tables, dont anti-triche sur les votes
- Triggers : auto-creation profil, auto-ajout admin, updated_at
- Fonctions SQL : `assign_daily_questions()`, `reveal_due_questions()`, `join_group_by_code()`, `reveal_question()`
- pg_cron : assignation quotidienne a 08:00 UTC, reveal toutes les 5 min

**Types TypeScript** (`packages/types/src/index.ts`) :
- Types miroir du schema : Profile, Group, GroupMember, DailyQuestion, Vote, Tag, etc.
- Types joins : GroupWithStatus, VoteResult, QuestionWithResults, WeeklyRecap
- Types app : AuthState, WidgetData, NotificationPayload

**Monorepo** :
- `apps/expo/` : App mobile Expo SDK 54 + expo-router v4
- `apps/next/` : App web Next.js 15 App Router
- `packages/app/` : Ecrans partages, providers, utils
- `packages/core/` : Services metier (structure prete, contenu template)
- `packages/types/` : Types TypeScript partages
- `packages/ui/` : Composants UI (structure prete, vide)
- `turbo.json` : Config Turborepo avec globalEnv pour Supabase

### Phase 1 : Authentification

**Ecrans partages** (`packages/app/features/`) :
- `auth/login-screen.tsx` : Connexion email/mot de passe + bouton Google
- `auth/signup-screen.tsx` : Inscription avec email, mot de passe, username, display_name
- `auth/profile-setup-screen.tsx` : Choix photo de profil (optionnel)
- `home/screen.tsx` : Ecran d'accueil avec header "Kiseki" et avatar profil
- `profile/profile-screen.tsx` : Vue profil (avatar, nom, username, email, date inscription, deconnexion)
- `profile/edit-profile-screen.tsx` : Edition profil (nom, username, avatar)

**Provider** (`packages/app/providers/auth-provider.tsx`) :
- Context React avec : user, profile, session, loading
- Methodes : signIn, signUp, signInWithGoogle, signOut, refreshProfile
- Google Sign-In natif (SDK) sur mobile, OAuth redirect (Supabase) sur web
- Ecoute des changements d'auth via `onAuthStateChange`

**Utilitaires** (`packages/app/utils/`) :
- `supabase.ts` : Client Supabase singleton, SecureStore sur mobile, localStorage sur web
- `avatar.ts` : `pickImage()` (expo-image-picker sur mobile, input file sur web) + `uploadAvatar()` vers Supabase Storage

**Routes Expo** (`apps/expo/app/`) :
```
_layout.tsx            -> Verifie session, redirige vers (auth) ou (app)
(auth)/_layout.tsx     -> Stack navigation
(auth)/login.tsx
(auth)/signup.tsx
(auth)/profile-setup.tsx
(app)/_layout.tsx      -> Tab navigator
(app)/index.tsx        -> HomeScreen
(app)/profile.tsx
(app)/edit-profile.tsx
```

**Routes Next.js** (`apps/next/app/`) :
```
layout.tsx             -> AuthProvider + Registry (react-native-web)
providers.tsx          -> Wrapper client pour AuthProvider
page.tsx               -> Home (redirige vers /login si pas connecte)
login/page.tsx
signup/page.tsx
profile/page.tsx
profile/edit/page.tsx
```

**Configuration Next.js** :
- `next.config.mjs` : transpilePackages pour tous les packages du monorepo
- Mapping `env` pour exposer les variables `EXPO_PUBLIC_*` cote client
- Webpack aliases : react-native -> react-native-web
- Stubs pour modules natifs (`apps/next/stubs/`) : expo-secure-store, expo-image-picker, google-signin

---

## 3. Difficultes rencontrees et solutions

### 3.1 Google Sign-In sur Expo Go

**Probleme** : `@react-native-google-signin/google-signin` necessite du code natif. Expo Go est un bac a sable qui ne supporte que les modules JS purs. Message : "Google Sign-In n'est pas disponible sur cette plateforme".

**Solution** : Ce n'est pas un blocage pour la production. L'app compilee en dev build ou en production (via EAS Build) inclura le code natif et Google Sign-In fonctionnera. Pour tester en dev, on utilise la connexion email/mot de passe.

### 3.2 Google Sign-In sur Web

**Probleme** : Le meme code natif ne fonctionne pas sur web. Le message d'erreur "Google Sign-In n'est pas disponible sur cette plateforme" apparaissait aussi cote web.

**Solution** : Detection de la plateforme dans `signInWithGoogle()`. Sur web (`Platform.OS === "web"`), on utilise `supabase.auth.signInWithOAuth({ provider: "google" })` qui redirige vers Google dans le navigateur. Sur mobile, on garde le SDK natif.

### 3.3 Erreur redirect_uri_mismatch (Google OAuth)

**Probleme** : Apres avoir configure Google Sign-In sur web, erreur 400 `redirect_uri_mismatch`. Google refusait le callback Supabase.

**Solution** : Ajouter l'URI de callback de Supabase (`https://avjarksbgtltfmaqqwvd.supabase.co/auth/v1/callback`) dans les "URI de redirection autorises" du client OAuth Web dans Google Cloud Console. Aussi configurer `http://localhost:3000` dans Supabase > Authentication > URL Configuration.

### 3.4 Client OAuth Android deja utilise

**Probleme** : Lors de la creation du client OAuth Android dans Google Cloud Console, erreur "le nom du package Android et son empreinte sont deja utilises". Le package `com.myapp.mobile` avec le SHA-1 de debug par defaut etait deja enregistre par quelqu'un d'autre.

**Solution** : Changement du package Android de `com.myapp.mobile` a `com.kiseki.app` dans `app.json` (iOS bundleIdentifier inclus). Le nom generique etait en conflit car le SHA-1 du debug keystore est partage par tous les developpeurs.

### 3.5 Build Next.js : expo-modules-core parse error

**Probleme** : En lancant le serveur Next.js, erreur `Module parse failed: Unexpected token` sur `expo-modules-core/src/index.ts` a cause de la syntaxe `export type *` non supportee par webpack.

**Solution** : Creation de fichiers stubs dans `apps/next/stubs/` pour remplacer les modules natifs cote web :
- `expo-secure-store.js` : fonctions async vides
- `expo-image-picker.js` : retourne toujours `{ canceled: true }`
- `empty.js` : export vide pour google-signin

Aliases webpack dans `next.config.mjs` pour rediriger les imports vers ces stubs.

### 3.6 Variables d'environnement sur Next.js

**Probleme** : Les variables `EXPO_PUBLIC_*` ne sont pas exposees cote client par Next.js (seules les `NEXT_PUBLIC_*` le sont). Le client Supabase ne recevait pas les URLs/cles.

**Solution** : Ajout d'un bloc `env` dans `next.config.mjs` pour mapper explicitement les variables. Creation d'un symlink `.env.local` dans `apps/next/` pointant vers le `.env.local` racine.

### 3.7 Upload photo de profil sur Web

**Probleme** : Le stub `expo-image-picker` retournait toujours `{ canceled: true }`. Impossible de choisir une photo sur la version web.

**Solution** : Detection de plateforme dans `pickImage()`. Sur web, utilisation d'un `<input type="file" accept="image/*">` natif du navigateur qui retourne un data URL (base64). Adaptation de `uploadAvatar()` pour extraire le type MIME depuis un data URL.

---

## 4. Structure actuelle des fichiers

```
template-monorepo-react/
├── apps/
│   ├── expo/                    # App mobile
│   │   ├── app/                 # Routes expo-router
│   │   ├── app.json             # Config Expo (com.kiseki.app)
│   │   └── package.json
│   └── next/                    # App web
│       ├── app/                 # Routes Next.js App Router
│       ├── stubs/               # Stubs pour modules natifs
│       ├── next.config.mjs
│       └── package.json
├── packages/
│   ├── app/                     # Ecrans partages + providers + utils
│   │   ├── features/            # Ecrans (auth, home, profile)
│   │   ├── providers/           # AuthProvider
│   │   └── utils/               # supabase.ts, avatar.ts
│   ├── core/                    # Services metier (a implementer)
│   ├── types/                   # Types TypeScript
│   └── ui/                      # Composants UI (a implementer)
├── supabase/
│   └── migrations/              # Schema SQL complet
├── .env.local                   # Variables Supabase + Google
├── turbo.json
├── PRD.md                       # Product Requirements Document
├── PLAN.md                      # Plan de developpement
└── package.json                 # Racine monorepo
```

---

## 5. Ce qu'il reste a faire

### Phase 2 : Groupes
- **Ecrans** : Liste des groupes, creation de groupe, rejoindre par code invite, detail groupe
- **Services** : `createGroup()`, `joinGroup()`, `leaveGroup()`, `getMyGroups()`, `getGroupMembers()`
- **Config** : Categories autorisees par groupe (normal/epice), horaires question/reveal

### Phase 3 : Vote quotidien
- **Ecrans** : Question du jour (grille membres, tap pour voter), modal confirmation
- **Services** : `getTodayQuestion()`, `submitVote()`, `hasVotedToday()`
- **Multi-groupe** : Tabs swipeable, indicateur vote/pas vote par groupe

### Phase 4 : Resultats / Reveal
- **Ecrans** : Classement (couronne vainqueur, qui a vote pour qui), historique 30 jours
- **Logique** : Reveal automatique via `reveal_due_questions()` (pg_cron)

### Phase 5 : Notifications push + Weekly Recap
- **Setup** : expo-notifications + expo-device
- **Types** : Question du matin, rappel, reveal, nouveau membre, weekly recap
- **Edge Functions** : `send-notifications`, `send-weekly-recap` (dimanche 18h)
- **Ecran** : Weekly recap (top 3 tags par groupe par semaine)

### Phase 6 : Widget Android
- **Package** : `react-native-android-widget`
- **Widget** : Question active + mini-avatars membres, vote depuis le widget

### Phase 7 : Questions custom
- **Ecrans** : Pool de questions (bank + custom), creation de question (texte + categorie + tag)
- **Logique** : Auto-approuvees, pas de doublons 30 jours

### Phase 8 : UI Components + Branding
- **Composants** : Button, Input, Card, Avatar, Badge, Countdown, TagBadge, CategoryPicker
- **Branding** : Icone, splash screen, palette de couleurs

### Phase 9 : Test + Deploy
- **Test** : Emulateur Android + appareil physique, simulateur iOS
- **Deploy** : EAS Build (APK), Supabase db push + functions deploy
- **Demo BTS SIO** : Bouton dev pour forcer le reveal, test sur 2 telephones

---

## 6. Configuration externe requise

| Service | Ce qui est configure | Ce qui reste |
|---------|---------------------|--------------|
| Supabase | Projet cree, schema migre, Auth Google active, Storage avatars | Edge Functions (notifs) |
| Google Cloud | Client OAuth Web + Android (com.kiseki.app) | Verifier la config en prod |
| Expo | Projet initialise, expo-router, plugins configures | EAS Build pour dev builds |
| Variables env | `.env.local` avec Supabase URL/Key + Google Web Client ID | Variables de prod |
