# Guide complet du template Monorepo

## Table des matieres

1. [Qu'est-ce que ce projet ?](#1-quest-ce-que-ce-projet-)
2. [Structure du projet](#2-structure-du-projet)
3. [Comment ca marche ?](#3-comment-ca-marche-)
4. [Installation et lancement](#4-installation-et-lancement)
5. [Commandes utiles](#5-commandes-utiles)
6. [Comment coder dans ce monorepo](#6-comment-coder-dans-ce-monorepo)
7. [Les erreurs a ne pas faire](#7-les-erreurs-a-ne-pas-faire)
8. [Conseils pour coder](#8-conseils-pour-coder)
9. [FAQ et depannage](#9-faq-et-depannage)

---

## 1. Qu'est-ce que ce projet ?

Ce template est un **monorepo** : un seul depot Git qui contient plusieurs applications et librairies partagees.

```
Un seul depot
├── Une app mobile    (Expo / React Native)  --> Android + iOS
├── Une app web       (Next.js)              --> Navigateur
└── Du code partage   (packages)             --> Utilise par les deux
```

**Pourquoi un monorepo ?**

- Le code metier (logique, types, fonctions utilitaires) est ecrit **une seule fois** dans `packages/`
- Les deux apps (web et mobile) importent ce code partage
- Une modification dans `packages/core` se repercute immediatement dans les deux apps
- Un seul `npm install` installe tout

---

## 2. Structure du projet

```
my-app/                          <-- Racine du monorepo
│
├── package.json                 <-- Config racine (workspaces, overrides)
├── tsconfig.json                <-- TypeScript racine (references)
├── tsconfig.base.json           <-- Config TypeScript partagee
├── package-lock.json            <-- Verrou des versions (ne pas supprimer sans raison)
│
├── apps/                        <-- Les applications
│   ├── mobile/                  <-- App Expo (React Native)
│   │   ├── package.json         <-- Dependances du mobile
│   │   ├── index.js             <-- Point d'entree (registerRootComponent)
│   │   ├── App.tsx              <-- Composant principal
│   │   ├── app.json             <-- Config Expo (nom, icones, splash...)
│   │   ├── metro.config.js      <-- Config du bundler Metro (monorepo)
│   │   ├── babel.config.js      <-- Config Babel (alias @my-app/*)
│   │   └── tsconfig.json        <-- TypeScript du mobile
│   │
│   └── web/                     <-- App Next.js
│       ├── package.json         <-- Dependances du web
│       ├── next.config.js       <-- Config Next.js (transpilePackages)
│       ├── tsconfig.json        <-- TypeScript du web
│       └── pages/
│           └── index.tsx        <-- Page d'accueil
│
└── packages/                    <-- Code partage
    ├── types/                   <-- Types TypeScript partages
    │   ├── package.json
    │   └── src/
    │       └── index.ts         <-- Exports des types
    │
    └── core/                    <-- Logique metier partagee
        ├── package.json
        └── src/
            └── index.ts         <-- Exports des fonctions
```

### Role de chaque dossier

| Dossier | Role | Technologie |
|---------|------|-------------|
| `apps/mobile/` | App mobile Android/iOS | Expo SDK 54, React Native 0.81 |
| `apps/web/` | App web | Next.js 15 |
| `packages/types/` | Types TypeScript partages | TypeScript pur |
| `packages/core/` | Fonctions/logique partagee | TypeScript pur |

---

## 3. Comment ca marche ?

### Le systeme de workspaces

Le `package.json` racine declare :

```json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

Cela signifie que npm traite chaque sous-dossier de `apps/` et `packages/` comme un projet independant, tout en partageant les dependances dans un seul `node_modules/` a la racine.

### Le flux des imports

```
apps/mobile/App.tsx
  └── import { greet } from "@my-app/core"
        └── packages/core/src/index.ts
              └── import { GreetFn } from "@my-app/types"
                    └── packages/types/src/index.ts
```

Quand tu ecris `import { greet } from "@my-app/core"` dans n'importe quelle app, voila ce qui se passe :

1. **TypeScript** resout le chemin grace aux `paths` dans `tsconfig.base.json`
2. **Le bundler** (Metro pour mobile, Next.js/webpack pour web) resout le module grace a ses propres configs :
   - Mobile : `babel.config.js` (alias) + `metro.config.js` (nodeModulesPaths)
   - Web : `next.config.js` (`transpilePackages`)

### Le overrides React

```json
{
  "overrides": {
    "react": "19.1.0",
    "react-dom": "19.1.0"
  }
}
```

Cela force **toutes** les dependances du monorepo a utiliser React 19.1.0. C'est indispensable car React Native 0.81 necessite React 19. Sans ca, npm pourrait installer plusieurs versions de React et provoquer des crashs.

---

## 4. Installation et lancement

### Premiere installation

```bash
# A la racine du monorepo
npm install
```

C'est tout. npm installe les dependances de tous les workspaces en une commande.

### Lancer l'app mobile

```bash
# Methode 1 : depuis la racine
npm run dev:mobile

# Methode 2 : depuis le dossier mobile
cd apps/mobile
npx expo start
```

Puis scanner le QR code avec l'app **Expo Go** sur ton telephone.

> Apres un changement de config, utiliser `npx expo start --clear` pour vider le cache Metro.

### Lancer l'app web

```bash
# Methode 1 : depuis la racine
npm run dev:web

# Methode 2 : depuis le dossier web
cd apps/web
npx next dev
```

Puis ouvrir http://localhost:3000 dans le navigateur.

---

## 5. Commandes utiles

### Developpement

| Commande | Description |
|----------|-------------|
| `npm run dev:web` | Lance le serveur web Next.js |
| `npm run dev:mobile` | Lance le serveur Expo |
| `npm install` | Installe tout le monorepo |

### Installer une dependance

```bash
# Dans l'app web
npm install axios --workspace=@my-app/web

# Dans l'app mobile
npm install react-native-safe-area-context --workspace=@my-app/mobile

# Dans le package core (partage)
npm install date-fns --workspace=@my-app/core
```

> **Ne jamais faire** `npm install <package>` a la racine (sauf pour les devDependencies globales comme typescript).

### Build

```bash
# Build web (production)
npm run build --workspace=@my-app/web

# Build mobile (necessite EAS CLI pour la production)
cd apps/mobile
npx expo export
```

### Nettoyage complet

Si quelque chose ne fonctionne plus :

```bash
# A la racine
rm -rf node_modules apps/mobile/node_modules apps/web/node_modules package-lock.json
npm install
```

### Verifier les versions Expo

```bash
cd apps/mobile
npx expo install --check    # Affiche les incompatibilites
npx expo install --fix      # Corrige automatiquement les versions
```

---

## 6. Comment coder dans ce monorepo

### Ajouter du code partage

**Exemple : ajouter une fonction utilitaire partagee**

1. Creer le type dans `packages/types/src/index.ts` :

```typescript
// Ajouter a la suite des types existants
export type FormatDateFn = (date: Date) => string;
```

2. Implementer la fonction dans `packages/core/src/index.ts` :

```typescript
import { GreetFn, FormatDateFn } from "@my-app/types";

export const greet: GreetFn = (name) => {
  return `Hello from core, ${name}!`;
};

export const formatDate: FormatDateFn = (date) => {
  return date.toLocaleDateString("fr-FR");
};
```

3. Utiliser dans les apps :

```typescript
// Dans apps/mobile/App.tsx ou apps/web/pages/index.tsx
import { greet, formatDate } from "@my-app/core";
```

### Ajouter un nouveau package partage

1. Creer le dossier :

```bash
mkdir -p packages/utils/src
```

2. Creer `packages/utils/package.json` :

```json
{
  "name": "@my-app/utils",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

3. Creer `packages/utils/src/index.ts` avec ton code

4. Ajouter les alias dans les configs :
   - `tsconfig.base.json` : ajouter dans `paths`
   - `apps/mobile/babel.config.js` : ajouter dans `alias`
   - `apps/web/next.config.js` : ajouter dans `transpilePackages`

5. Relancer `npm install` a la racine

### Ajouter une page web

Creer un fichier dans `apps/web/pages/` :

```typescript
// apps/web/pages/about.tsx
import React from "react";

export default function About() {
  return <h1>A propos</h1>;
}
```

Accessible a http://localhost:3000/about automatiquement (routing par fichiers de Next.js).

### Ajouter un ecran mobile

Modifier `apps/mobile/App.tsx` ou installer une librairie de navigation :

```bash
npm install @react-navigation/native @react-navigation/stack --workspace=@my-app/mobile
```

---

## 7. Les erreurs a ne pas faire

### 1. Installer des dependances au mauvais endroit

```bash
# MAUVAIS : installe a la racine
cd my-app
npm install axios

# BON : installe dans le bon workspace
npm install axios --workspace=@my-app/web
```

### 2. Avoir des versions de React differentes

React doit etre a la **meme version** dans tout le monorepo. Si tu changes la version de React dans un workspace, mets a jour le `overrides` dans le `package.json` racine.

```json
// package.json racine
{
  "overrides": {
    "react": "19.1.0",     // <-- meme version partout
    "react-dom": "19.1.0"
  }
}
```

> **Symptome typique** : "Cannot read property 'S' of undefined" = deux versions de React cohabitent.

### 3. Oublier de configurer les alias pour un nouveau package

Si tu crees un nouveau package dans `packages/`, il faut l'ajouter dans **3 endroits** :

| Fichier | Quoi ajouter |
|---------|-------------|
| `tsconfig.base.json` | `paths` pour la resolution TypeScript |
| `apps/mobile/babel.config.js` | `alias` pour le bundler Metro |
| `apps/web/next.config.js` | `transpilePackages` pour webpack |

### 4. Lancer expo depuis la racine

```bash
# MAUVAIS : le bundler ne trouve pas le bon package.json
cd my-app
npx expo start

# BON : depuis le dossier de l'app
cd apps/mobile
npx expo start
```

### 5. Supprimer le package-lock.json sans raison

Le `package-lock.json` garantit que tout le monde a les memes versions. Ne le supprime que pour un nettoyage complet (et relance `npm install` immediatement apres).

### 6. Modifier le metro.config.js sans comprendre

Le `metro.config.js` est configure specifiquement pour le monorepo. Ne pas ajouter :
- `disableHierarchicalLookup: true` (empeche la resolution des sous-dependances)
- `unstable_enableSymlinks` (non necessaire avec la config actuelle)
- `extraNodeModules` (non necessaire si React est unifie)

### 7. Mettre du code specifique a une plateforme dans packages/

```typescript
// MAUVAIS : dans packages/core/src/index.ts
import { View } from "react-native";  // React Native n'existe pas sur le web

// BON : le code dans packages/ doit etre du TypeScript pur
export const add = (a: number, b: number) => a + b;
```

Les packages partages ne doivent contenir que du **TypeScript/JavaScript pur**, sans dependance a React Native ni a des API specifiques au navigateur.

---

## 8. Conseils pour coder

### Organisation du code

```
Regle d'or : si du code est utilise par les DEUX apps, il va dans packages/.
             Si du code est specifique a UNE app, il reste dans apps/.
```

**Exemples :**

| Code | Ou le mettre | Pourquoi |
|------|-------------|----------|
| Fonction de validation d'email | `packages/core/` | Utilise par web ET mobile |
| Type `User` | `packages/types/` | Partage entre toutes les apps |
| Composant `<MobileHeader>` | `apps/mobile/` | Specifique au mobile |
| Page `/dashboard` | `apps/web/pages/` | Specifique au web |
| Appel API `fetchUsers()` | `packages/core/` | Meme API pour les deux |
| Style CSS global | `apps/web/` | Le CSS n'existe pas en mobile |

### Gestion des versions

Quand tu mets a jour une dependance importante :

1. **Expo** : utiliser `npx expo install --fix` (ajuste automatiquement les versions compatibles)
2. **Next.js** : verifier la compatibilite avec la version de React dans le monorepo
3. **React** : toujours modifier le `overrides` en meme temps que les `dependencies`

### Travailler a plusieurs

- Toujours commiter le `package-lock.json`
- Apres un `git pull`, relancer `npm install`
- Si un collegue ajoute un package, un simple `npm install` suffit

### TypeScript

- Toujours typer les fonctions dans `packages/types/` avant de les implementer dans `packages/core/`
- Cela force un "contrat" entre le code partage et les apps
- Les erreurs TypeScript sont detectees avant l'execution

```typescript
// 1. D'abord definir le type (packages/types)
export type CalculateTotalFn = (prices: number[], tax: number) => number;

// 2. Puis implementer (packages/core)
import { CalculateTotalFn } from "@my-app/types";

export const calculateTotal: CalculateTotalFn = (prices, tax) => {
  const subtotal = prices.reduce((sum, price) => sum + price, 0);
  return subtotal * (1 + tax);
};

// 3. Puis utiliser (apps/web ou apps/mobile)
import { calculateTotal } from "@my-app/core";
const total = calculateTotal([10, 20, 30], 0.2);
```

---

## 9. FAQ et depannage

### "The development server returned response error code: 500"

**Cause** : erreur de bundling Metro. Lire le message d'erreur dans le terminal.

**Solutions** :
1. Vider le cache : `npx expo start --clear`
2. Verifier les imports dans le code
3. Nettoyage complet (voir section Commandes utiles)

### "Cannot read property 'S' of undefined"

**Cause** : plusieurs versions de React installees dans le monorepo.

**Solution** : verifier que le `overrides` dans le `package.json` racine force une seule version, puis faire un nettoyage complet.

```bash
npm ls react   # Doit afficher UNE SEULE version partout
```

### "Unable to resolve module @my-app/core"

**Cause** : les alias ne sont pas configures correctement.

**Verifier** :
1. `babel.config.js` du mobile contient l'alias
2. `next.config.js` du web contient `transpilePackages`
3. `tsconfig.base.json` contient les `paths`

### "Module not found: promise/setimmediate/es6-extensions"

**Cause** : `disableHierarchicalLookup: true` dans `metro.config.js`.

**Solution** : ne pas ajouter cette option. Le metro.config.js du template est deja configure correctement.

### L'app ne se met pas a jour sur le telephone

1. Secouer le telephone pour ouvrir le menu Expo
2. Appuyer sur "Reload"
3. Ou relancer avec `npx expo start --clear`

### Les types ne sont pas reconnus dans l'IDE

Relancer le serveur TypeScript :
- VSCode : `Ctrl+Shift+P` > "TypeScript: Restart TS Server"

---

## Resume des versions du template

| Technologie | Version | Correspondance |
|-------------|---------|----------------|
| React | 19.1.0 | Unifie dans tout le monorepo |
| React Native | 0.81.5 | Compatible Expo SDK 54 |
| Expo SDK | 54 | Derniere version stable |
| Next.js | 15.5.11 | Compatible React 19 |
| TypeScript | 5.x | Partage entre tous les workspaces |
| Node.js | 18+ | Requis par les outils |

---

## Fichiers de configuration a connaitre

| Fichier | Role | Quand le modifier |
|---------|------|-------------------|
| `package.json` (racine) | Workspaces, overrides, scripts globaux | Ajout de workspace, changement de React |
| `tsconfig.base.json` | Paths TypeScript partages | Ajout d'un nouveau package |
| `apps/mobile/metro.config.js` | Bundler Metro (monorepo) | Rarement |
| `apps/mobile/babel.config.js` | Alias d'imports pour Metro | Ajout d'un nouveau package |
| `apps/mobile/app.json` | Config Expo (nom, icone, splash) | Personnalisation de l'app |
| `apps/web/next.config.js` | Config Next.js | Ajout d'un nouveau package |
