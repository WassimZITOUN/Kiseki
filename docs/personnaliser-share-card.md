## Personnaliser la share card et deployer sans erreur

Ce guide explique, pas a pas, comment modifier la carte generee par l’Edge Function et comment la redeployer proprement, avec un **nouveau slug** a chaque changement pour eviter les erreurs recurrentes.

### 1. Fichiers concernes

- Code de la carte (JSX + rendu image):
  `supabase/functions/share-card/index.tsx`
- Config Deno (JSX):
  `supabase/functions/share-card/deno.json`
- Variable d’environnement pour le slug utilise par l’app:
  `.env.local` (cle `EXPO_PUBLIC_SHARE_CARD_FUNCTION`)

### 2. Comprendre le flux

1. L’app appelle `supabase.functions.invoke(SHARE_CARD_FUNCTION_NAME, { body })`.
2. Le slug est defini par `EXPO_PUBLIC_SHARE_CARD_FUNCTION` (ex: `share-card-v25`).
3. L’Edge Function genere un PNG via `og_edge`.
4. L’app recoit `data.image` (base64 PNG).

### 3. Personnaliser la carte (design)

Tout se passe dans `supabase/functions/share-card/index.tsx`.

Les zones principales:
- **Background**: style du conteneur principal (couleurs, gradients).
- **Logo KISEKI**: texte avec police specifique.
- **Question**: texte central (taille, couleur, alignement).
- **Resultats**: badge + nombre de votes.
- **Avatar/initiale**: cercle central.
- **Footer**: groupe + branding.

Exemples de modifications typiques:

#### 3.1 Changer les couleurs de fond

Dans le bloc racine:
```
backgroundColor: "#120d26"
```
Et les gradients:
```
background: "radial-gradient(...)"
```

#### 3.2 Reduire / augmenter la taille de la question

Repere la ligne:
```
fontSize: 42
```
Change la valeur (ex: `36`, `48`, etc.).

#### 3.3 Changer la police du texte (sauf logo)

1. Charge une police lisible (ex: Noto Sans, Inter).
2. Applique la police sur le conteneur racine.
3. Garde la police du logo (KISEKI) en DM Serif Display.

Exemple:
```
fontFamily: "Noto Sans, sans-serif"
```
Et pour le logo:
```
fontFamily: "DM Serif Display"
```

#### 3.4 Ajouter une nouvelle police

Le chargement des polices se fait via `fetch` et `fonts` dans `ImageResponse`.

Exemple:
```
const r = await fetch("https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNb4g.ttf");
const td = await r.arrayBuffer();
...
fonts: [
  { name: "DM Serif Display", data: fd, style: "normal" as const },
  { name: "Noto Sans", data: td, style: "normal" as const },
]
```

Important:
- Utiliser une URL directe vers un fichier `.ttf`.
- Eviter les fonts variables si tu as des erreurs.
- Garder un fallback si la font ne charge pas (ex: utiliser `sans-serif`).

### 4. Tester en local (conseille)

Lancer l’Edge Function localement:
```
supabase functions serve --no-verify-jwt
```

Puis utiliser le script de preview:
```
./scripts/preview-share-card.sh
```

Le PNG est genere dans `/tmp/share-card.png`.

### 5. Deployer SANS erreur (nouveau slug a chaque fois)

Pour eviter les erreurs persistantes, **ne redeploie pas sur le meme slug**.

#### 5.1 Choisir un nouveau slug

Exemples:
- `share-card-v26`
- `share-card-v27`

#### 5.2 Deployer via Supabase CLI

Depuis la racine:
```
supabase functions deploy share-card-v26 \
  --no-verify-jwt \
  --project-ref <TON_PROJECT_REF> \
  --import-map supabase/functions/share-card/deno.json \
  --entrypoint supabase/functions/share-card/index.tsx
```

Notes:
- `--no-verify-jwt` car la fonction est publique.
- `--entrypoint` et `--import-map` doivent pointer vers les fichiers du repo.

#### 5.3 Mettre a jour le slug dans l’app

Dans `.env.local`:
```
EXPO_PUBLIC_SHARE_CARD_FUNCTION=share-card-v26
```

Puis relancer l’app.

### 6. Debug des erreurs (non-2xx)

Si tu obtiens `edge function returned a non-2xx status code`:

1. **Verifier le slug**:
   - Le slug dans l’app doit exister dans Supabase.
2. **Regarder les logs Edge Function**:
   - Dans Supabase > Logs > Edge Functions.
3. **Changer de slug** si la fonction reste bloquee:
   - C’est la solution la plus fiable.

### 7. Checklist avant de redeployer

- Le code compile localement.
- Les fonts sont des `.ttf` accessibles.
- Tu deployes **sous un nouveau slug**.
- Tu mets a jour `EXPO_PUBLIC_SHARE_CARD_FUNCTION`.

### 8. FAQ rapide

**Q: Pourquoi un nouveau slug a chaque fois?**
R: Une fonction peut rester en erreur apres un deploy casse. Nouveau slug = instance propre.

**Q: Pourquoi un status 500?**
R: Erreur d’execution (JS, import, fetch, JSON).

**Q: Le PNG ne change pas.**
R: Assure-toi d’utiliser le bon slug et de recharger l’app.

