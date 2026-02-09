# Partage d'image des resultats — Documentation technique

## Vue d'ensemble

Apres le reveal d'une question, l'utilisateur peut **partager une carte PNG** montrant la question, le gagnant et le groupe. L'image est generee cote serveur par une **Supabase Edge Function** (`share-card`), puis partagee ou copiee depuis le mobile.

**Contrainte** : l'app tourne sous Expo Go (pas de dev client custom), ce qui interdit `react-native-view-shot` et autres librairies natives de capture d'ecran.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  Mobile (Expo Go)                                              │
│                                                                │
│  GroupDetailScreen (State D: revealed)                         │
│       │                                                        │
│       │  Bouton "Partager" → ouvre ShareResultSheet            │
│       │                                                        │
│  ShareResultSheet                                              │
│   ├── ShareResultCard (apercu RN, non capture)                 │
│   ├── Bouton "Partager l'image" → handleShareImage()           │
│   └── Bouton "Copier l'image"   → handleCopyImage()           │
│       │                                                        │
│       ▼                                                        │
│  generateImage()                                               │
│       │  supabase.functions.invoke("share-card", { body })     │
│       │                                                        │
└───────┼────────────────────────────────────────────────────────┘
        │  POST HTTPS
        ▼
┌────────────────────────────────────────────────────────────────┐
│  Supabase Edge Function: share-card                            │
│                                                                │
│  Deno.serve(async (req) => {                                   │
│    1. Parse JSON body (question, winnerName, etc.)             │
│    2. Fetch DM Serif Display font (cache en memoire)           │
│    3. Rend JSX → ImageResponse (og_edge@0.0.4)                │
│       satori: JSX → SVG                                        │
│       resvg-wasm: SVG → PNG                                    │
│    4. Encode PNG en base64                                     │
│    5. Retourne JSON { image: "<base64>" }                      │
│  })                                                            │
│                                                                │
└───────┼────────────────────────────────────────────────────────┘
        │  JSON { image: "iVBOR..." }
        ▼
┌────────────────────────────────────────────────────────────────┐
│  Retour dans ShareResultSheet                                  │
│                                                                │
│  Partager:                                                     │
│    expo-file-system → ecrire PNG dans cacheDirectory           │
│    expo-sharing → ouvrir share sheet natif                     │
│                                                                │
│  Copier:                                                       │
│    expo-clipboard → setImageAsync(base64)                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Fichiers concernes

| Fichier | Package | Role |
|---------|---------|------|
| `features/groups/group-detail-screen.tsx` | `@repo/app` | Ecran groupe — State D (revealed) : bouton "Partager", monte `ShareResultSheet` |
| `features/groups/components/share-result-sheet.tsx` | `@repo/app` | Bottom sheet : apercu + boutons partager/copier, appelle l'edge function |
| `src/ShareResultCard.tsx` | `@repo/ui` | Composant RN d'apercu (gradient violet, couronne, avatar, question) — **pas** l'image generee |
| `supabase/functions/share-card/index.tsx` | Supabase | Edge function : genere le PNG 680x680 via og_edge |
| `supabase/functions/share-card/deno.json` | Supabase | Config Deno : JSX react-jsx, imports React 18.2.0 |

---

## Flux detaille

### 1. Declenchement (group-detail-screen.tsx)

Quand la question est revelee (`status === "revealed"` ou timer expire cote client), l'ecran affiche le verdict avec un bouton "Partager" :

```tsx
<KButton
  title="Partager"
  onPress={() => setShareSheetVisible(true)}
  variant="glass"
/>
```

Le `ShareResultSheet` recoit les props du gagnant (premier du classement `allResults[0]`) :

```tsx
<ShareResultSheet
  visible={shareSheetVisible}
  onClose={() => setShareSheetVisible(false)}
  question={question.question}
  winnerName={allResults[0]?.name ?? ""}
  winnerAvatarUri={allResults[0]?.avatarUri}
  winnerVoteCount={allResults[0]?.voteCount ?? 0}
  groupName={group.name}
/>
```

### 2. Apercu (ShareResultCard)

Le sheet affiche un `ShareResultCard` comme apercu visuel. Ce composant React Native utilise :
- `LinearGradient` : fond degrade violet (`#5B21B6` → `#8B5CF6`)
- `KAvatar` : avatar du gagnant avec bordure doree (#FFD700)
- `CrownIcon` : couronne en triangles CSS (3x `borderWidth` trick)
- Question tronquee a 80 caracteres
- Footer : `{groupName} · kiseki.app`

Ce composant est un **apercu seulement** — il n'est pas capture en image. L'image reelle est generee par l'edge function.

### 3. Generation de l'image (share-result-sheet.tsx → edge function)

Quand l'utilisateur appuie sur "Partager l'image" ou "Copier l'image", la fonction `generateImage()` est appelee :

```tsx
const generateImage = async (): Promise<string> => {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke("share-card", {
    body: { question, winnerName, winnerAvatarUri, groupName, winnerVoteCount },
  });
  if (error) throw error;
  if (!data?.image) throw new Error("Pas de donnees image");
  return data.image;   // base64 PNG
};
```

L'appel passe par `supabase.functions.invoke()` qui envoie un POST a l'edge function.

### 4. Edge function share-card (Deno)

**URL** : `https://<project>.supabase.co/functions/v1/share-card`
**Methode** : POST (+ OPTIONS pour CORS)
**JWT** : desactive (`verify_jwt: false`) — la fonction ne manipule aucune donnee sensible

**Corps de la requete** :
```json
{
  "question": "Qui est le plus susceptible de...",
  "winnerName": "Alice",
  "winnerAvatarUri": "https://...",   // optionnel, non utilise actuellement
  "winnerVoteCount": 5,
  "groupName": "Les Amis"
}
```

**Traitement** :

1. **Font** : Fetch `DM Serif Display` depuis Google Fonts (TTF). Cache en memoire (`ArrayBuffer`) pour les requetes suivantes dans la meme instance.

2. **Rendu JSX** : `ImageResponse` de `og_edge@0.0.4` recoit du JSX :
   - Fond : `linear-gradient(135deg, #5B21B6, #8B5CF6)`
   - Dimensions : **680x680** pixels
   - Branding "Kiseki" en haut a gauche (opacity 0.5)
   - Question en DM Serif Display 34px, centree, tronquee a 100 caracteres
   - Initiale du gagnant dans un cercle 108px avec bordure doree
   - Nom du gagnant + nombre de votes
   - Separateur + footer `{groupName} · kiseki.app`

3. **Contrainte satori** : Tout `<div>` avec plusieurs enfants doit avoir `display: "flex"` explicite. Les chaines de texte sont pre-calculees dans des variables pour eviter les noeuds enfants implicites.

4. **Encodage** : Le `ArrayBuffer` de la reponse `ImageResponse` est converti en base64 via `btoa()` par chunks de 32 Ko (pour eviter les depassements de pile).

**Reponse** :
```json
{
  "image": "iVBORw0KGgoAAAANSUhEUg..."   // base64 PNG
}
```

### 5. Partage natif (share-result-sheet.tsx)

**Bouton "Partager l'image"** (`handleShareImage`) :
1. Appelle `generateImage()` → recoit le base64
2. Ecrit le PNG dans un fichier temporaire via `expo-file-system/legacy` :
   ```tsx
   const uri = `${FileSystem.cacheDirectory}kiseki-share.png`;
   await FileSystem.writeAsStringAsync(uri, base64, { encoding: "base64" });
   ```
3. Verifie que le partage est disponible via `expo-sharing.isAvailableAsync()`
4. Ouvre le share sheet natif via `expo-sharing.shareAsync(uri, { mimeType: "image/png" })`

**Bouton "Copier l'image"** (`handleCopyImage`) :
1. Appelle `generateImage()` → recoit le base64
2. Copie directement dans le presse-papiers via `expo-clipboard.setImageAsync(base64)`

**Note** : les deux boutons sont desactives sur web (`Platform.OS === "web"`).

### 6. Imports dynamiques

Les modules natifs sont importes via `require()` et non en import statique, pour eviter les erreurs de compilation sur Next.js (web) :

```tsx
const FileSystem = require("expo-file-system/legacy");   // SDK 54 deprecation
const Sharing = require("expo-sharing");
const Clipboard = require("expo-clipboard");
```

`expo-file-system/legacy` est utilise car l'API principale a ete deprecee dans SDK 54.

---

## Carte generee vs apercu

| Aspect | ShareResultCard (apercu RN) | Edge function (PNG genere) |
|--------|----------------------------|---------------------------|
| **Rendu** | React Native (View, LinearGradient) | satori JSX → SVG → PNG |
| **Dimensions** | max-width 340px (responsive) | 680x680px fixe |
| **Avatar** | `KAvatar` avec image reelle | Initiale du nom (cercle) |
| **Couronne** | CSS triangles (`CrownIcon`) | Absente |
| **Font** | System (DM Serif Display si charge) | DM Serif Display (TTF fetch) |
| **Usage** | Montre a l'utilisateur dans le sheet | Image PNG partagee/copiee |

Les deux representations sont visuellement similaires (gradient violet, question, gagnant, groupe) mais pas identiques pixel-pour-pixel.

---

## Dependances

| Dependance | Version | Role |
|-----------|---------|------|
| `og_edge` | 0.0.4 | Generation image (satori + resvg-wasm) — import Deno |
| `react` | 18.2.0 | JSX dans l'edge function (via esm.sh) |
| `expo-file-system` | SDK 54 | Ecriture fichier PNG temporaire (`/legacy` path) |
| `expo-sharing` | SDK 54 | Sheet de partage natif |
| `expo-clipboard` | SDK 54 | Copie image dans le presse-papiers |
| `expo-linear-gradient` | SDK 54 | Gradient violet dans l'apercu RN |

---

## Configuration de l'edge function

**`deno.json`** :
```json
{
  "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "react" },
  "imports": {
    "react": "https://esm.sh/react@18.2.0",
    "react/jsx-runtime": "https://esm.sh/react@18.2.0/jsx-runtime"
  }
}
```

**CORS** : Tous les origins autorises (`Access-Control-Allow-Origin: *`) pour permettre l'appel depuis l'app mobile.

---

## Historique des tentatives

L'approche edge function a necessite plusieurs iterations avant de fonctionner :

| # | Tentative | Resultat | Probleme |
|---|----------|---------|----------|
| 1 | `og_edge@0.0.6` + `verify_jwt: true` | 401 | JWT rejete par le relay Supabase |
| 2 | `og_edge@0.0.6` + `verify_jwt: false` | 500 | Module WASM (resvg) ne s'initialise pas dans le runtime |
| 3 | `npm:@vercel/og@0.6.4` | Echec deploy | Package trop volumineux / incompatible runtime Deno |
| 4 | `og_edge@0.0.4` sur fonction `share-image` | 200 mais bloquee | Fonctionne, puis la fonction se bloque apres des redeploys |
| 5 | `og_edge@0.0.4` sur **nouvelle** fonction `share-card` | 200 | Solution finale retenue |

**Lecon** : apres des deploiements echoues repetes, une edge function Supabase peut se retrouver dans un etat bloque permanent. La solution est de deployer sous un nouveau nom.

### Approche "use dom" (testee puis abandonnee)

Une approche purement client-side a ete testee entre les tentatives serveur :
- Directive `"use dom"` d'Expo SDK 54 pour creer un composant WebView
- `html-to-image` pour capturer le DOM en PNG via Canvas API
- **Abandonnee** car l'approche edge function a finalement ete stabilisee avec `og_edge@0.0.4` et un nouveau slug de fonction

---

## Erreurs courantes et solutions

| Erreur | Cause | Solution |
|--------|-------|---------|
| 401 Unauthorized | `verify_jwt: true` sur la fonction | Mettre `verify_jwt: false` (pas de donnees sensibles) |
| 500 Internal Server Error | `og_edge` version incompatible | Utiliser `og_edge@0.0.4` exclusivement |
| `Expected <div> to have explicit "display: flex"` | satori exige `display: flex` sur les divs multi-enfants | Ajouter `display: "flex"` partout, pre-calculer les strings |
| Deploy echoue en boucle | Fonction bloquee apres echecs | Deployer sous un nouveau nom de fonction |
| `expo-file-system` import error | API deprecee SDK 54 | Utiliser `require("expo-file-system/legacy")` |
