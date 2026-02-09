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
| 6 | `og_edge@0.0.4` sur **nouveau slug** | 500 | JSX/CSS non compatible satori (voir section "Problemes rencontres") |
| 7 | `og_edge@0.0.4` sur **nouveau slug** (`share-card-v7`) | 200 | Correctifs satori + format 9:16 ✓ |

**Lecon** : apres des deploiements echoues repetes, une edge function Supabase peut se retrouver dans un etat bloque permanent. La solution est de deployer sous un nouveau nom.

## Problemes rencontres (2026-02)

Cette iteration a introduit un nouveau design (format 9:16, fond aurora, glassmorphism). Les erreurs suivantes ont ete observees :

- **Erreur `edge function returned a non-2xx status code`**  
  Cause : 500 cote fonction. Le message exact etait `Missing comma before color stops`, declenche par `radial-gradient(1200px 800px at ...)` non supporte par satori/og_edge.
  Solution : remplacer les gradients par une syntaxe compatible, par exemple `radial-gradient(circle at 20% 10%, ...)`.

- **`gap` non pris en charge**  
  Cause : satori ignore ou refuse `gap` dans certains contexts.
  Solution : remplacer `gap` par `marginRight` / `marginTop` explicites.

- **Erreurs masquees cote client**  
  Cause : l'app ne loguait pas `data.error` renvoye par la fonction.
  Solution : loguer `data.error` avant de throw pour voir l'erreur exacte.

## Bonnes pratiques (a conserver)

- Toujours tester l'endpoint avec `curl` pour recuperer le message d'erreur exact.
- Eviter les syntaxes CSS ambiguës (ex. `radial-gradient(1200px 800px at ...)`) et preferer `radial-gradient(circle at ...)`.
- Eviter `gap` dans le JSX satori. Utiliser `marginTop` / `marginRight`.
- Si la fonction renvoie 503/500 apres un deploy casse, deployer sous un **nouveau slug** (ex. `share-card-v7`) et mettre a jour le client.
- Cote app, loguer `data.error` et `error` de `supabase.functions.invoke()` pour diagnostic.

### Approche "use dom" (testee puis abandonnee)

Une approche purement client-side a ete testee entre les tentatives serveur :
- Directive `"use dom"` d'Expo SDK 54 pour creer un composant WebView
- `html-to-image` pour capturer le DOM en PNG via Canvas API
- **Abandonnee** car l'approche edge function a finalement ete stabilisee avec `og_edge@0.0.4` et un nouveau slug de fonction

---

## Diagnostique et resolution : "Edge Function returned a non-2xx status code"

Cette erreur generique (401, 500, 503, etc.) peut survenir pour plusieurs raisons. Voici comment diagnostiquer et corriger :

### 1. Verifier le statut exact de la fonction

```bash
curl -v -X POST "https://<project>.supabase.co/functions/v1/share-card" \
  -H "Content-Type: application/json" \
  -H "apikey: <anon_key>" \
  -d '{"question":"Test","winnerName":"Alice","winnerVoteCount":3,"groupName":"Test"}'
```

- **503 Service Unavailable** → `BOOT_ERROR` : la fonction ne demarre pas (voir section 3 ci-dessous)
- **500 Internal Server Error** → crash dans la fonction (voir section 2)
- **401 Unauthorized** → JWT rejet (voir section 4)

### 2. Code incompatible Deno / satori

**Symptome** : Deploy reussit, mais 500 sur appel.

**Problemes courants** :
- Imports invalides pour Deno (`import ... from "deno.land/std"`, top-level `await fetch()`, etc.)
- JSX non compatible satori :
  - Tags HTML (`<h1>`, `<p>`, `<img alt="...">`) au lieu de `<div>`
  - `position: "absolute"` non supporte (satori utilise flexbox)
  - `<img src="url">` avec URL externe (satori ne peut pas fetcher dynamiquement)
  - Enfants implicites en JSX (interpolations string : `{groupName} · kiseki.app`) sans `display: "flex"`

**Solution** :
```tsx
// ❌ Mauvais
const ir = new ImageResponse(
  <h1>{question}</h1>,  // satori n'aime pas les h1
  ...
);

// ✅ Bon
const q = question;  // Pre-calculer la string
const ir = new ImageResponse(
  <div style={{ display: "flex", fontSize: 34 }}>{q}</div>,
  ...
);
```

### 3. Fonction bloquee apres deploy echoue (BOOT_ERROR 503)

**Symptome** : Premiere fois deploy OK, mais apres modification → `BOOT_ERROR` permanent sur l'ancien slug.

**Cause** : Supabase Edge Functions se retrouve dans un etat bloque apres deploiement de code casse. Les tentatives suivantes retournent 503 sans executer le code.

**Solution** : Deployer sous un **nouveau nom de fonction** :
```bash
share-card          → bloquee (ne redeploy pas sur ce slug)
share-card-v2       → deploie, OK, puis bloquee apres modif
share-card-v3       → deploie, OK, puis bloquee apres modif
share-card-v4       → deploie, OK, stable ✓
```

**Mise a jour client** :
```tsx
// Ancien
const { data } = await supabase.functions.invoke("share-card", { body });

// Nouveau
const { data } = await supabase.functions.invoke("share-card-v4", { body });
```

### 4. JWT rejet (401)

**Symptome** : `verify_jwt: true` mais le relay Supabase rejette le JWT depuis `supabase.functions.invoke()`.

**Cause** : `supabase.functions.invoke()` passe le JWT dans l'Authorization header, mais le relay n'accepte pas tous les formats.

**Solution** : Desactiver JWT si la fonction n'accede pas a des donnees sensibles :
```tsx
// Dans supabase/functions/share-card/index.tsx
// Deploy avec verify_jwt: false
mcp__supabase__deploy_edge_function(
  name: "share-card",
  verify_jwt: false,  // ← Important
  ...
)
```

Et s'assurer que CORS autorise les headers JWT au cas ou :
```tsx
const CH = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
```

### 5. Image fetche ne s'affiche pas

**Symptome** : Deploy OK, fonction retourne 200, mais avatar manque dans l'image.

**Cause** : satori ne peut pas fetcher dynamiquement les URLs externes. `<img src="https://...">` n'apparait pas.

**Solution** : Fetcher l'image **dans la fonction**, convertir en `data:image/jpeg;base64,...`, puis passer au JSX :

```tsx
async function fetchAvatarDataUri(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "image/png";
    const ab = await r.arrayBuffer();
    const bytes = new Uint8Array(ab);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode(...bytes.subarray(i, Math.min(i + 0x8000, bytes.length)));
    }
    return `data:${ct};base64,${btoa(bin)}`;
  } catch {
    return null;
  }
}

// Dans le JSX
const avatarDataUri = winnerAvatarUri ? await fetchAvatarDataUri(winnerAvatarUri) : null;
{avatarDataUri ? (
  <img src={avatarDataUri} width={108} height={108} style={{ borderRadius: 54 }} />
) : (
  <div>Fallback: {winnerName.charAt(0)}</div>
)}
```

---

## Erreurs courantes et solutions

| Erreur | Cause | Solution |
|--------|-------|---------|
| 401 Unauthorized | `verify_jwt: true` sur la fonction | Mettre `verify_jwt: false` (pas de donnees sensibles) |
| 500 Internal Server Error | Code Deno/satori invalide | Verifier imports, JSX tags, pre-calculer strings, ajouter `display: flex` |
| 503 BOOT_ERROR | Fonction bloquee apres deploy casse | Deployer sous un nouveau slug (share-card-v2, v3, v4, etc.) |
| Avatar ne s'affiche pas | Satori ne peut pas fetcher URLs externes | Fetcher dans la fonction, convertir en data URI |
| `Expected <div> to have explicit "display: flex"` | satori exige `display: flex` sur les divs multi-enfants | Ajouter `display: "flex"` partout, pre-calculer les strings |
| `expo-file-system` import error | API deprecee SDK 54 | Utiliser `require("expo-file-system/legacy")` |
