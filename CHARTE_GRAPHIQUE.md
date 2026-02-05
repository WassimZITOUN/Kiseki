# Charte Graphique Kiseki

## Direction artistique

- **Style** : Pop-Japandi (glassmorphisme premium + orbes flottantes + texture grain)
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

### Palette Orb (fond anime)

| Token | Hex | Usage |
|---|---|---|
| `orb.violet` | `#A29BFE` | Orbe principale, ombre glass |
| `orb.yuzu` | `#FFD93D` | Orbe chaude bas-droite |
| `orb.sakura` | `#F0B4E0` | Orbe douce centre-haut |

### Palette Aurora (heritage)

| Token | Hex | Usage |
|---|---|---|
| `aurora.pink` | `#F0B4E0` | Accent confettis |
| `aurora.blue` | `#A5C7F7` | Accent confettis |
| `aurora.violet` | `#C9A6F5` | Accent confettis |
| `aurora.mint` | `#A8E6CF` | Accent confettis |
| `aurora.peach` | `#FFD3B6` | Accent confettis |

### Neutres & surfaces

| Token | Valeur | Usage |
|---|---|---|
| `surface` / `cream` | `#F9F7F2` | Fond Kiseki Cream chaud |
| `textPrimary` | `#1A1036` | Titres, texte principal |
| `textSecondary` | `#6B6183` | Sous-titres, labels |
| `textMuted` | `#9E97AD` | Placeholders, captions |
| `glass.background` | `rgba(255,255,255,0.7)` | Fond des composants sans blur (VoteCard) |
| `glass.border` | `rgba(255,255,255,0.5)` | Bordure "tranche de verre" lumineuse |
| `overlay` | `rgba(26,16,54,0.4)` | Fond des modals |
| `error` | `#E53E3E` | Messages d'erreur |
| `success` | `#38A169` | Confirmations |

### Ombre Glass (coloree, jamais noire)

| Propriete | Valeur |
|---|---|
| `shadow.color` | `#A29BFE` (violet) |
| `shadow.offset` | `{ width: 0, height: 8 }` |
| `shadow.opacity` | `0.15` |
| `shadow.radius` | `12` |
| `elevation` (Android) | `8` |

---

## Glassmorphisme Premium — Sandwich optique 4 couches

Chaque surface glass (GlassCard, GlassModal, GlassBottomSheet) est un sandwich de 4 couches :

### Couche 1 — Ombre portee (Shadow Layer)
- Vue externe, `overflow: visible` (pour que l'ombre ne soit pas clippee)
- `shadowColor: #A29BFE` (violette, jamais noire)
- `shadowOpacity: 0.15`, `shadowRadius: 12`, `elevation: 8`

### Couche 2 — Flou (Blur Layer)
- `BlurView` d'expo-blur en `StyleSheet.absoluteFill`
- **Android** : `experimentalBlurMethod="dimezisBlurView"` (OBLIGATOIRE)
- `tint="light"`, intensite : 30 (cartes), 80 (modals/sheets)
- Vue clip avec `overflow: "hidden"` + `borderRadius`

### Couche 3 — Surface brillante (Glass Surface)
- `LinearGradient` diagonal (135deg) en `absoluteFill`
- Couleurs : `rgba(255,255,255,0.4)` → `rgba(255,255,255,0.1)`
- `borderWidth: 1`, `borderColor: rgba(255,255,255,0.5)` (tranche de verre)

### Couche 4 — Contenu
- Enfants avec padding par defaut (`spacing.md` pour cartes, `spacing.lg` pour modals)

### Web
- CSS `backdrop-filter: blur(Npx)` + `WebkitBackdropFilter`
- `backgroundImage: linear-gradient(...)` via LinearGradient.web.js
- `boxShadow: 0 8px 24px rgba(162,155,254,0.15)`

---

## Background — Orbes flottantes + grain

Le fond de l'application est compose de :
1. **Base** : couleur cream `#F9F7F2`
2. **3 orbes circulaires** animees en boucle infinie :
   - **Orbe Violet** (280px) — haut-gauche, cycle 25s
   - **Orbe Yuzu** (220px) — bas-droite, cycle 30s
   - **Orbe Sakura** (200px) — centre-haut, cycle 22s
3. Animation : `Easing.inOut(Easing.sin)`, amplitude +/-60px X / +/-40px Y
4. **Natif** : opacite basse (0.25-0.35), pas de blur (la grande taille simule le flou)
5. **Web** : opacite plus forte (0.5-0.7) + `filter: blur(80px)` CSS
6. **Texture Grain** (web) : overlay SVG `feTurbulence` a `opacity: 0.03` pour touche Japandi

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
| `xl` | 24px | Modals, bottom sheets, cartes groupe |
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

| Composant | Fichier | Role |
|---|---|---|
| `KText` | `KText.tsx` | Typographie avec prop `variant` |
| `KButton` | `KButton.tsx` | Boutons solid/glass/ghost avec spring, prop `isPill` pour pilules |
| `KInput` | `KInput.tsx` | TextInput glass avec animation focus |
| `KAvatar` | `KAvatar.tsx` | Avatar avec fallback initiales, anneau glass |
| `GlassCard` | `GlassCard.tsx` | Carte glassmorphisme 4 couches, blur reel + ombre violette |
| `AuroraBackground` | `AuroraBackground.tsx` | 3 orbes circulaires flottantes + texture grain |
| `AuroraScreenWrapper` | `AuroraScreenWrapper.tsx` | Aurora + KeyboardAvoidingView |
| `KHeader` | `KHeader.tsx` | Header glass avec bouton retour rond 44x44, titre, action |
| `ErrorBanner` | `ErrorBanner.tsx` | Banniere d'erreur animee slide-down |

### Composants de vote

| Composant | Fichier | Role |
|---|---|---|
| `VoteCard` | `VoteCard.tsx` | Carte super-ellipse, avatar 60px, spring damping 12 + haptic |
| `VoteGrid` | `VoteGrid.tsx` | Grille 2 colonnes, widget-extractible |
| `QuestionHeader` | `QuestionHeader.tsx` | Question DM Serif Display 34px, centree |
| `ConfettiOverlay` | `ConfettiOverlay.tsx` | 30 particules Aurora, 1.5s |
| `CountdownTimer` | `CountdownTimer.tsx` | Timer tabular-nums avec pulse |
| `BlurredReveal` | `BlurredReveal.tsx` | Flou anime (expo-blur / CSS filter) |
| `GlassModal` | `GlassModal.tsx` | Modal glass 4 couches, intensity=80 |
| `GlassBottomSheet` | `GlassBottomSheet.tsx` | Bottom sheet glass 4 couches, intensity=80 |

---

## Compatibilite cross-platform

| Effet | Natif (Expo) | Web (Next.js) |
|---|---|---|
| Orbes flottantes | Reanimated Animated.View (opacite basse) | Meme + CSS filter: blur(80px) |
| Glassmorphisme | expo-blur BlurView + experimentalBlurMethod (Android) + LinearGradient | CSS backdrop-filter + linear-gradient + boxShadow |
| Texture grain | (non implemente, imperceptible sur mobile) | SVG feTurbulence en overlay |
| Animations spring | Reanimated withSpring | Reanimated web |
| Confetti | Reanimated Animated.View | Meme |
| Haptics | expo-haptics | No-op stub |
| Blur reveal | expo-blur anime | CSS filter: blur() |
| Police serif | expo-font (DM Serif Display) | next/font/google |
| Modal | Modal React Native | Overlay positionne |

---

## Fichiers de tokens

- **Source** : `packages/ui/src/tokens.ts`
- **Tailwind** : replique dans `tailwind.config` (Expo, Next, packages/ui)
- **Export barrel** : `packages/ui/src/index.ts`

---

## Principes d'animation

1. **Boutons** : spring scale 0.96 (damping 15, stiffness 300), ombre sur solid
2. **Boutons pilules** : `isPill` = borderRadius 9999, padding ajuste
3. **Cartes de vote** : spring scale 0.92, damping 12, avatar 60px + color fill violet.200
4. **Orbes** : 3 orbes, cycles 22-30s, ease in-out sinusoidal, amplitude +/-60/+/-40px
5. **Confetti** : 30 particules, 1.5s, couleurs Aurora
6. **Countdown** : pulse subtil scale 1.02, cycle 2s
7. **Entrees d'ecran** : FadeIn / SlideInUp Reanimated
8. **Haptic feedback** : Light (vote tap), Success (confirmation), Selection (boutons)
