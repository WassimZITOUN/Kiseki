# My App - Monorepo Cross-Platform

Monorepo TypeScript avec npm workspaces pour application mobile (Expo/React Native) et web (Next.js).

## Structure

```
my-app/
├── apps/
│   ├── mobile/          # Expo SDK 54 (React Native 0.81)
│   └── web/             # Next.js 15
├── packages/
│   ├── core/            # Logique metier partagee
│   └── types/           # Types TypeScript partages
├── package.json         # Workspaces + overrides React
├── tsconfig.base.json   # Config TypeScript partagee (paths)
└── GUIDE.md             # Documentation complete du template
```

## Installation

```bash
npm install
```

## Lancement

```bash
npm run dev:web       # Next.js → http://localhost:3000
npm run dev:mobile    # Expo → scanner le QR code avec Expo Go
```

## Ajouter une dependance

```bash
npm install <pkg> --workspace=@my-app/web      # app web
npm install <pkg> --workspace=@my-app/mobile    # app mobile
npm install <pkg> --workspace=@my-app/core      # package partage
```

## Code partage

Les deux apps importent le code depuis `packages/` :

```typescript
import { greet } from "@my-app/core";        // logique metier
import type { GreetFn } from "@my-app/types"; // types
```

## Stack technique

| Outil | Version | Role |
|-------|---------|------|
| React | 19.1.0 | UI (unifie dans tout le monorepo) |
| Expo | SDK 54 | App mobile Android/iOS |
| React Native | 0.81.5 | Rendu mobile natif |
| Next.js | 15.5 | App web |
| TypeScript | 5.x | Typage statique |

## Depannage

```bash
# Vider le cache Metro (mobile)
cd apps/mobile && npx expo start --clear

# Verifier les versions
npx expo install --check

# Nettoyage complet
rm -rf node_modules apps/*/node_modules package-lock.json && npm install
```

> Voir [GUIDE.md](GUIDE.md) pour la documentation complete : structure detaillee, conseils, erreurs a eviter, FAQ.
