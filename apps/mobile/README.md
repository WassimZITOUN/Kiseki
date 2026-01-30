# Expo Mobile App - Troubleshooting

## Configuration du monorepo

Cette app Expo est configurée pour utiliser des packages depuis le monorepo parent.

### Fichiers de configuration importants :

**metro.config.js** : Configure Metro Bundler pour résoudre les packages depuis le workspace
**babel.config.js** : Configure les alias `@my-app/core` et `@my-app/types`

## Démarrage de l'app

```bash
# Depuis la racine du monorepo
npm run dev:mobile

# Ou directement dans apps/mobile
cd apps/mobile
npx expo start --clear
```

**Important** : Utilisez `--clear` pour vider le cache Metro après un changement de configuration.

## Tester avec Expo Go

1. Installez **Expo Go** depuis Google Play (Android) ou App Store (iOS)
2. Lancez `npx expo start --clear`
3. Scannez le QR code avec Expo Go (Android) ou l'app Caméra (iOS)

## Problèmes courants

### "Something went wrong" dans Expo Go

**Causes possibles** :
- Cache Metro non vidé après changement de config
- Imports du monorepo non résolus
- Versions React incompatibles

**Solutions** :
```bash
# 1. Nettoyer le cache et redémarrer
npx expo start --clear

# 2. Vérifier que babel-plugin-module-resolver est installé
npm list babel-plugin-module-resolver

# 3. Si toujours un problème, réinstaller
cd ../..
rm -rf node_modules apps/mobile/node_modules packages/*/node_modules
npm install
cd apps/mobile
npx expo start --clear
```

### Erreur "Cannot find module @my-app/core"

Vérifiez que :
1. Le fichier `metro.config.js` existe et configure `watchFolders`
2. Le fichier `babel.config.js` contient le plugin `module-resolver`
3. Le cache Metro est vidé : `npx expo start --clear`

### Versions de React incompatibles

Cette app utilise **React 18.2.0** (compatible Expo SDK 48).

Si vous voyez des erreurs de hooks ou de contexte React :
```bash
# Depuis la racine
npm list react
# Doit montrer une seule version : 18.2.0
```

## Structure des imports

```typescript
// ✅ Correct
import { greet } from '@my-app/core';
import type { GreetFn } from '@my-app/types';

// ❌ Incorrect (chemins relatifs)
import { greet } from '../../packages/core/src';
```

Les alias `@my-app/*` sont résolus automatiquement par Babel.
