# Kiseki - Product Requirements Document (PRD)

## 1. Vision Produit

**Kiseki** (qui c'est qui) est une application mobile de vote social quotidien entre amis. Chaque jour, une question du type "Qui est le plus susceptible de..." est posee a un groupe. Les membres votent pour la personne qui correspond le mieux. Les resultats sont reveles le soir, creant un moment de partage collectif.

### Proposition de valeur
- **Widget-first** : jouer depuis l'ecran d'accueil sans ouvrir l'app
- **Asynchrone** : voter quand on veut dans la journee, pas besoin d'etre en ligne ensemble
- **Quotidien** : une question par jour = rituel (inspire de Wordle/BeReal)
- **Transparent** : apres le reveal, on voit qui a vote pour qui
- **Creatif** : les joueurs creent leurs propres questions

### Differenciateurs vs concurrents (Exposed, Most Likely To, Ask Us)
| Probleme concurrent | Solution Kiseki |
|---------------------|-----------------|
| Necessite d'etre ensemble en temps reel | Asynchrone, vote toute la journee |
| Questions repetitives (packs statiques) | Bank + questions creees par les joueurs |
| Paywall agressif | Gratuit |
| Pas de rituel quotidien | 1 question/jour + notifications + widget |
| Pas de transparence | On voit qui a vote pour qui apres reveal |

---

## 2. Utilisateurs cibles

- **Persona principal** : Groupes d'amis (15-25 ans), etudiants, collegues
- **Taille de groupe** : 3 a 20 personnes
- **Frequence d'usage** : Quotidien (vote le matin/midi, reveal le soir)
- **Plateformes** : Android (prioritaire, widget), iOS (notifications)

---

## 3. Fonctionnalites

### 3.1 Authentification
- Inscription par email + mot de passe
- Choix d'un username unique et display_name
- Photo de profil optionnelle
- Session persistante (SecureStore sur mobile)

### 3.2 Gestion des groupes
- Creer un groupe (nom, taille max, horaires question/reveal, categories autorisees)
- Rejoindre un groupe par code d'invitation (8 caracteres)
- Etre dans plusieurs groupes simultanement
- Voir la liste de ses groupes avec le statut du jour (vote/pas vote/revele)
- Quitter un groupe
- Admin : gerer les membres, modifier les parametres, configurer les categories

### 3.3 Vote quotidien
- Une question par jour par groupe (assignee automatiquement a 08:00 UTC)
- Affichage de la question + grille des membres du groupe
- Tap sur un membre pour voter
- Justification optionnelle (140 caracteres max)
- Possibilite de changer son vote tant que la question est active
- Un seul vote par joueur par question
- Anti-triche : impossible de voir les votes des autres avant le reveal

### 3.4 Reveal des resultats
- Automatique a l'heure configuree du groupe (defaut 20:00)
- Classement : membre, nombre de votes, pourcentage
- Vainqueur mis en avant
- Transparence totale : on voit qui a vote pour qui
- Justifications visibles
- Historique des 30 derniers jours

### 3.5 Categories de questions
Chaque question a une **categorie** :
- **Normal** : Questions classiques, fun (ex: "Qui va vivre le plus longtemps ?", "Qui cache le plus de choses ?")
- **Epice** : Questions provocantes, embarrassantes (ex: "Si vous deviez mettre un coup de poing...", "Qui va divorcer le plus vite ?")

L'admin du groupe configure quelles categories sont autorisees. Par defaut : toutes.

### 3.6 Tags de traits
Chaque question est associee a un **tag** representant un trait de personnalite :
- ~30 tags predefinies : Charismatique, Gourmand, Radin, Drole, Leader, Maladroit, etc.
- Chaque tag a un emoji associe
- Les tags permettent de construire des statistiques hebdomadaires
- Tag "Autre" disponible si aucun tag ne correspond

### 3.7 Questions personnalisees
- Tout membre d'un groupe peut proposer une question
- Questions auto-approuvees (pas de moderation)
- Le createur choisit la categorie (normal/epice) et un tag existant
- Ajoutees au pool du groupe
- Piochees aleatoirement comme les questions de la banque
- Pas de doublon : une question ne revient pas avant 30 jours

### 3.8 Notifications push
- **Question du matin** : "Nouvelle question dans [Groupe] !"
- **Rappel** : "Tu n'as pas encore vote dans [Groupe]"
- **Reveal** : "Les resultats sont tombes dans [Groupe] !"
- **Nouveau membre** : "[Nom] a rejoint [Groupe]"
- **Weekly recap** : "Ton recap : ✨ Charismatique x4, 🍕 Gourmand x3..."
- Deep linking vers l'ecran correspondant

### 3.9 Weekly Recap (statistiques hebdomadaires)
- Chaque dimanche, notification avec le recap des tags accumules
- Top 3 tags par groupe pour chaque utilisateur
- Ecran in-app avec detail complet : tags, compteurs, filtres par groupe/semaine
- Base sur les votes recus (target_user_id) et les tags des questions

### 3.10 Widget Android
- Affiche la question active du groupe
- Liste des membres en mini-avatars
- Tap sur un membre = vote directement depuis le widget
- Tap general = ouvrir l'app
- Mise a jour automatique

### 3.11 Widget iOS (post-MVP)
- Necessite WidgetKit (Swift natif)
- Prevu apres la v1

---

## 4. Architecture technique

### Stack
| Composant | Technologie |
|-----------|-------------|
| Monorepo | npm workspaces + Turborepo 2.8 |
| Mobile | Expo SDK 54, React Native 0.81, expo-router v4 |
| Web | Next.js 15 App Router (secondaire) |
| Styling | NativeWind v4 (Tailwind -> React Native) |
| Navigation | Solito (cross-platform) |
| Backend | Supabase (PostgreSQL, Auth, RLS, Edge Functions) |
| Notifications | expo-notifications + Expo Push API |
| Widget Android | react-native-android-widget |
| Auth mobile | Supabase + expo-secure-store |

### Structure monorepo
```
apps/
  expo/          # App mobile (Android + iOS)
  next/          # App web (secondaire)
packages/
  app/           # Ecrans partages, providers, utils
  core/          # Services metier (groups, voting, questions)
  types/         # Types TypeScript
  ui/            # Composants UI partages (NativeWind)
supabase/
  migrations/    # Schema SQL
  functions/     # Edge Functions (notifications)
```

### Base de donnees
8 tables : `profiles`, `groups`, `group_members`, `tags`, `question_bank`, `user_questions`, `daily_questions`, `votes`

Securite via Row Level Security (RLS) :
- Donnees scopees par groupe (un membre ne voit que ses groupes)
- Anti-triche : votes invisibles avant le reveal
- Un utilisateur ne peut modifier que son propre profil/vote

Automatisation via pg_cron :
- `assign_daily_questions()` a 08:00 UTC chaque jour
- `reveal_due_questions()` toutes les 5 minutes (verifie l'heure de reveal de chaque groupe)

---

## 5. Game loop quotidien

```
08:00  ─── Question assignee automatiquement (pg_cron)
       │
       ├── Notification push : "Nouvelle question !"
       ├── Widget mis a jour avec la question
       │
08:00-20:00 ─── Fenetre de vote
       │
       ├── Joueur vote via widget / notification / app
       ├── Peut changer son vote
       ├── Ne voit PAS les votes des autres
       │
20:00  ─── Reveal automatique (pg_cron)
       │
       ├── Notification push : "Resultats !"
       ├── Widget mis a jour avec le vainqueur
       ├── Classement visible dans l'app
       └── Transparence : qui a vote pour qui
```

---

## 6. Metriques de succes

| Metrique | Objectif |
|----------|----------|
| Taux de vote quotidien | > 70% des membres d'un groupe votent chaque jour |
| Retention J7 | > 50% des utilisateurs reviennent apres 7 jours |
| Groupes actifs | > 80% des groupes ont au moins 1 vote par jour |
| Questions custom | > 20% des questions posees sont creees par les joueurs |
| Widget usage | > 30% des votes passent par le widget Android |

---

## 7. Perimetre MVP (sprint 2 semaines)

### Inclus dans le MVP
- Auth (signup/login/session)
- Groupes (creer/rejoindre/quitter/lister, config categories)
- Categories de questions (normal/epice)
- Tags de traits (~30 predefinies)
- Vote quotidien (question du jour, grille membres, voter, changer vote)
- Resultats (classement, transparence, historique)
- Notifications push (question, rappel, reveal, weekly recap)
- Weekly recap (statistiques hebdomadaires par tags)
- Widget Android (question + vote)
- Questions custom (proposer avec tag + categorie, auto-approuve)

### Exclu du MVP (post-v1)
- Widget iOS (WidgetKit)
- Gamification (streaks, badges, leaderboards)
- Integration IA pour generer des questions
- Partage social (Instagram Stories)
- Animations avancees (Moti/Reanimated)
- Mode anonyme
- Themes/personnalisation du groupe

---

## 8. Contraintes

- **Temps** : 2 semaines (stage BTS SIO)
- **Budget** : 0 (Supabase gratuit, Expo gratuit, EAS Build free tier)
- **Equipe** : 1 developpeur
- **Apple Developer** : necessaire pour TestFlight iOS (si disponible)
- **Appareil physique** : necessaire pour tester notifications push
