# Charte Graphique Kiseki — Deep Glass Dark Theme

## Direction artistique

- **Style** : Deep Glass (glassmorphisme premium sur fond sombre + orbes neon)
- **Principes UX** : validation positive, repos cognitif, speed-to-dopamine
- **Police Serif** : DM Serif Display (questions, titres d'app)
- **Police Sans-Serif** : Systeme par defaut (corps de texte)

---

## Palette de couleurs

### Couleur principale — Violet

| Token | Hex |
|---|---|
| `violet.50` | `#F5F0FF` |
| `violet.100` | `#EDE5FF` |
| `violet.200` | `#D4C4F7` |
| `violet.300` | `#BBA3EF` |
| `violet.400` | `#A88AE5` |
| `violet.500` / `primary` | `#9572CF` |
| `violet.600` | `#7C5BB8` |
| `violet.700` | `#6344A1` |
| `violet.800` | `#4B2D8A` |
| `violet.900` | `#341B6E` |

### Palette Orb Neon (fond anime)

| Token | Hex | Opacite | Usage |
|---|---|---|---|
| `orb.magenta` | `#ff007a` | 0.5 | Orbe principale haut-gauche |
| `orb.violet` | `#7a00ff` | 0.5 | Orbe centre-droite |
| `orb.cyan` | `#00e5ff` | 0.4 | Orbe bas-centre |

### Surfaces sombres

| Token | Valeur | Usage |
|---|---|---|
| `surface` | `#120d26` | Fond Deep Space (violet tres sombre) |
| `surfaceElevated` | `#1a1436` | Surfaces sureleves |

### Typographie (clair sur sombre)

| Token | Valeur | Usage |
|---|---|---|
| `textPrimary` | `#FFFFFF` | Titres, texte principal |
| `textSecondary` | `#A0A0A0` | Sous-titres, labels |
| `textMuted` | `#6B6B6B` | Placeholders, captions |

### Glass (pour fond sombre)

| Token | Valeur | Usage |
|---|---|---|
| `glass.background` | `rgba(255,255,255,0.08)` | Fond leger givre |
| `glass.border` | `rgba(255,255,255,0.15)` | Bord de refraction visible |

### Ombre Glass (violet glow)

| Propriete | Valeur |
|---|---|
| `shadow.color` | `#7a00ff` (violet electrique) |
| `shadow.offset` | `{ width: 0, height: 8 }` |
| `shadow.opacity` | `0.4` |
| `shadow.radius` | `24` |
| `elevation` (Android) | `12` |

### Etats

| Token | Valeur | Usage |
|---|---|---|
| `error` | `#FF6B6B` | Messages d'erreur |
| `success` | `#4ADE80` | Confirmations |
| `overlay` | `rgba(0,0,0,0.6)` | Fond des modals |

---

## Glassmorphisme Premium — Architecture 4 couches

### Principe cle : CONTRASTE

Le glassmorphisme ne fonctionne que si le contenu derriere le verre est colore/sombre.
Fond sombre (#120d26) + orbes neon = les cartes glass captent la lumiere.

### Couche 1 — Ombre portee (Violet Glow)
- Vue externe, `overflow: visible`
- `shadowColor: #7a00ff`, `shadowOpacity: 0.4`, `shadowRadius: 20`
- `elevation: 12` (Android)

### Couche 2 — Flou (Blur Layer)
- `BlurView` d'expo-blur en `StyleSheet.absoluteFill`
- **CRITIQUE Android** : `experimentalBlurMethod="dimezisBlurView"`
- `tint="dark"` pour theme sombre
- Intensite : 40 (cartes), 60 (modals/sheets)
- Clip avec `overflow: "hidden"` + `borderRadius`

### Couche 3 — Refraction (Border + Subtle Fill)
- `borderWidth: 1`, `borderColor: rgba(255,255,255,0.15)`
- `backgroundColor: rgba(255,255,255,0.08)` — tres subtil
- PAS de remplissage blanc opaque

### Couche 4 — Contenu
- Enfants avec padding (`spacing.md` cartes, `spacing.lg` modals)

### Web
- CSS `backdrop-filter: blur(20px)` + `WebkitBackdropFilter`
- `boxShadow: 0 8px 32px rgba(122,0,255,0.25)`

---

## Background — Orbes neon flottantes

1. **Base** : couleur Deep Space `#120d26`
2. **3 orbes neon** animees en boucle infinie :
   - **Orbe Magenta** (350px) — haut-gauche, cycle 25s, opacite 0.5
   - **Orbe Violet** (300px) — centre-droite, cycle 30s, opacite 0.5
   - **Orbe Cyan** (280px) — bas-centre, cycle 22s, opacite 0.4
3. Animation : `Easing.inOut(Easing.sin)`, amplitude +/-80px X / +/-60px Y
4. **Web** : `filter: blur(100px)` CSS pour diffusion douce
5. **Texture Grain** : overlay SVG `feTurbulence` a `opacity: 0.04`

---

## Espacements

| Token | Valeur |
|---|---|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 32px |
| `2xl` | 48px |

---

## Rayons de bordure

| Token | Valeur | Usage |
|---|---|---|
| `sm` | 8px | Petits elements |
| `md` | 12px | Inputs, boutons |
| `lg` | 16px | Cartes glass |
| `xl` | 24px | Modals, bottom sheets |
| `superEllipse` | 28px | Cartes de vote |
| `full` | 9999px | Avatars, pills, badges |

---

## Typographie

| Variant | Taille | Graisse | Police | Usage |
|---|---|---|---|---|
| `questionLarge` | 34px / 42px | 400 | DM Serif Display | Questions, titre "Kiseki" |
| `h1` | 28px / 34px | 700 | Systeme | Titres d'ecran |
| `h2` | 22px / 28px | 600 | Systeme | Sous-titres |
| `h3` | 18px / 24px | 600 | Systeme | Noms de groupe, labels |
| `body` | 16px / 22px | 400 | Systeme | Corps de texte |
| `bodySmall` | 14px / 20px | 400 | Systeme | Texte secondaire |
| `caption` | 12px / 16px | 400 | Systeme | Labels, meta |
| `button` | 16px / 22px | 600 | Systeme | Boutons |

---

## Composants UI (`@repo/ui`)

### Composants de base

| Composant | Role |
|---|---|
| `KText` | Typographie avec prop `variant`, couleur par defaut blanche |
| `KButton` | Boutons solid/glass/ghost avec spring snappy |
| `KInput` | TextInput glass avec animation focus |
| `KAvatar` | Avatar avec fallback initiales |
| `GlassCard` | Carte glass 4 couches, tint="dark", intensity=40 |
| `AuroraBackground` | Orbes neon flottantes sur fond Deep Space |
| `AuroraScreenWrapper` | Aurora + KeyboardAvoidingView |
| `KHeader` | Header glass, bouton retour rond 44x44, titre blanc |
| `ErrorBanner` | Banniere d'erreur animee |

### Composants de vote

| Composant | Role |
|---|---|
| `VoteCard` | Carte super-ellipse, avatar 60px, spring snappy |
| `VoteGrid` | Grille 2 colonnes |
| `QuestionHeader` | Question DM Serif Display 34px blanc |
| `ConfettiOverlay` | Particules Aurora |
| `CountdownTimer` | Timer tabular-nums avec pulse |
| `BlurredReveal` | Flou anime, tint="dark" |
| `GlassModal` | Modal glass, intensity=60, tint="dark" |
| `GlassBottomSheet` | Bottom sheet glass, intensity=60, tint="dark" |

---

## Animations — Spring Snappy iOS

Toutes les animations utilisent le spring iOS premium :

```typescript
const SNAPPY_SPRING = {
  damping: 40,
  stiffness: 350,
  mass: 1,
  overshootClamping: true,
};
```

Pas d'effet "jelly" — les elements se placent rapidement et precisement.

---

## Compatibilite cross-platform

| Effet | Natif (Expo) | Web (Next.js) |
|---|---|---|
| Fond Deep Space | View backgroundColor | Meme |
| Orbes neon | Reanimated Animated.View | Meme + CSS filter: blur(100px) |
| Glassmorphisme | expo-blur + experimentalBlurMethod + tint="dark" | backdrop-filter + boxShadow violet |
| Texture grain | Image SVG | backgroundImage SVG |
| Animations spring | Reanimated withSpring | Reanimated web |
| Haptics | expo-haptics | No-op stub |
| Police serif | expo-font | next/font/google |
