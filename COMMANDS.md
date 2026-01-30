# Commandes utiles

## Installation initiale

```bash
cd my-app
npm install
```

## Lancer les applications

### Web (Next.js)
```bash
npm run dev:web
# Ouvre http://localhost:3000
```

### Mobile (Expo)
```bash
npm run dev:mobile
# Scannez le QR code avec Expo Go
```

## Travailler dans les workspaces

### Installer une dépendance dans un workspace spécifique

```bash
# Pour l'app web
npm install <package> --workspace=@my-app/web

# Pour l'app mobile
npm install <package> --workspace=@my-app/mobile

# Pour le package core
npm install <package> --workspace=@my-app/core
```

### Lancer un script dans un workspace

```bash
npm run <script> --workspace=@my-app/web
```

## Build

### Web
```bash
npm run build --workspace=@my-app/web
npm run start --workspace=@my-app/web
```

### Mobile
```bash
cd apps/mobile
npx expo build:android  # Android
npx expo build:ios      # iOS
```

## TypeScript

### Vérifier les types

```bash
# Dans un workspace spécifique
cd apps/web
npx tsc --noEmit

cd apps/mobile
npx tsc --noEmit
```

## Nettoyage

```bash
# Supprimer tous les node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Réinstaller
npm install
```

## Structure du monorepo

- **apps/mobile** : Application Expo (React Native)
- **apps/web** : Application Next.js
- **packages/core** : Logique métier partagée
- **packages/types** : Types TypeScript partagés

Les packages sont automatiquement liés via npm workspaces.

## Import des packages partagés

```typescript
// Dans apps/mobile/App.tsx ou apps/web/pages/index.tsx
import { greet } from '@my-app/core';
import type { GreetFn } from '@my-app/types';
```

## Problèmes connus

### Warning ENOWORKSPACES avec Next.js

Next.js essaie parfois d'installer des dépendances directement dans son workspace, ce qui génère un warning "This command does not support workspaces". Ce warning est sans danger et n'empêche pas le serveur de fonctionner.

**Solution** : Ignorez ce warning, le serveur démarre correctement.

### Versions de dépendances Expo

Si Expo affiche un message sur des versions incompatibles, installez les versions recommandées :

```bash
cd apps/mobile
npx expo install --fix
```
