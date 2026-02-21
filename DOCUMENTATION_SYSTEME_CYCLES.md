# Documentation Technique : Système de Cycles et Soumission de Questions

## Table des Matières

1. [Vue d'ensemble du système](#1-vue-densemble-du-système)
2. [Architecture des données](#2-architecture-des-données)
3. [Système de cycles (Round-Robin)](#3-système-de-cycles-round-robin)
4. [Soumission de questions par les utilisateurs](#4-soumission-de-questions-par-les-utilisateurs)
5. [Activation et sélection des questions](#5-activation-et-sélection-des-questions)
6. [Gestion des membres et de l'éligibilité](#6-gestion-des-membres-et-de-léligibilité)
7. [Flux complets avec diagrammes](#7-flux-complets-avec-diagrammes)
8. [Règles métier et contraintes](#8-règles-métier-et-contraintes)
9. [Cas d'usage et scénarios](#9-cas-dusage-et-scénarios)
10. [API et services](#10-api-et-services)

---

## 1. Vue d'ensemble du système

### 1.1 Objectif

Kiseki est une application sociale de questions quotidiennes où les membres d'un groupe répondent à une question du jour en votant pour un autre membre. Le système repose sur un mécanisme de **rotation round-robin** où chaque membre a l'opportunité de proposer une question à tour de rôle.

### 1.2 Concepts clés

- **Groupe** : Ensemble de 2 à 12 membres qui partagent des questions quotidiennes
- **Cycle** : Une rotation complète où chaque membre éligible obtient exactement un slot
- **Slot** : Créneau attribué à un membre pour une date spécifique
- **Soumission** : Question proposée par un utilisateur pour son slot
- **Question du jour** : Question active affichée au groupe pour voter
- **Éligibilité** : Mécanisme de "liste d'attente" pour les nouveaux membres

### 1.3 États du système

Le système peut être dans différents états pour un groupe donné :

- **Pregame** : Aucune question n'a encore été activée (phase de création)
- **En cours** : Des cycles sont générés et des questions sont activées quotidiennement
- **En attente de soumissions** : Un cycle est généré mais pas assez de soumissions (min 2)
- **Question active** : Une question est en cours, les membres votent
- **Question révélée** : Les résultats sont visibles

---

## 2. Architecture des données

### 2.1 Tables principales

#### `groups`
```sql
id                   uuid PRIMARY KEY
name                 text
invite_code          text UNIQUE
created_by           uuid → profiles(id)
max_members          int DEFAULT 12
question_time        time DEFAULT '09:00'
reveal_time          time DEFAULT '20:00'
allowed_intensities  text[] DEFAULT '{normal}'
current_cycle        int DEFAULT 0        -- Compteur de cycles
created_at           timestamptz
```

**Rôle** : Conteneur principal pour un groupe de membres. Le champ `current_cycle` suit le numéro du cycle actuel et s'incrémente à chaque génération de nouveau cycle.

#### `group_members`
```sql
id                  uuid PRIMARY KEY
group_id            uuid → groups(id)
user_id             uuid → profiles(id)
role                text ('admin' | 'member')
joined_at           timestamptz
cycle_eligible_at   date                 -- Date d'éligibilité pour les cycles
UNIQUE(group_id, user_id)
```

**Rôle** : Membres d'un groupe. Le champ `cycle_eligible_at` détermine quand un membre devient éligible pour participer aux cycles (système de liste d'attente).

#### `daily_slots`
```sql
id                  uuid PRIMARY KEY
group_id            uuid → groups(id)
assigned_user_id    uuid → profiles(id)   -- Membre assigné à ce slot
target_date         date                  -- Date cible du slot
slot_order          int                   -- Position dans le cycle (0-based)
cycle_number        int                   -- Numéro du cycle
status              text                  -- 'scheduled', 'live', 'revealed', 'fallback'
final_question_text text                  -- Question finale choisie
source_type         text                  -- 'submission', 'bank'
source_id           uuid                  -- ID de la source (submission ou question_bank)
daily_question_id   uuid → daily_questions(id)
admin_replaced_at   timestamptz           -- Si admin a remplacé la question
admin_replaced_by   uuid → profiles(id)
created_at          timestamptz
activated_at        timestamptz           -- Quand le slot est passé en 'live'
UNIQUE(group_id, target_date)
```

**Rôle** : Représente un créneau quotidien attribué à un membre dans un cycle. Un slot par jour et par groupe (contrainte UNIQUE). Le slot évolue de `scheduled` → `live` → `revealed`.

#### `user_submissions`
```sql
id              uuid PRIMARY KEY
slot_id         uuid → daily_slots(id) UNIQUE    -- One-to-one avec slot
group_id        uuid → groups(id)
submitted_by    uuid → profiles(id)
question_text   text                             -- Question personnalisée (nullable)
choose_bank     boolean DEFAULT false            -- Si true, sélection auto depuis banque
intensity       text DEFAULT 'normal'            -- 'normal' | 'epice'
tag_id          uuid → tags(id)
submitted_at    timestamptz
updated_at      timestamptz
CONSTRAINT user_submissions_input_check CHECK (
  (choose_bank = true AND question_text IS NULL)
  OR
  (choose_bank = false AND question_text IS NOT NULL AND char_length(question_text) BETWEEN 10 AND 200)
)
```

**Rôle** : Soumission d'une question par un membre pour son slot assigné. Relation 1-1 avec `daily_slots`. Le membre peut soit écrire sa propre question, soit demander à l'algorithme de choisir depuis la banque.

#### `daily_questions`
```sql
id              uuid PRIMARY KEY
group_id        uuid → groups(id)
question        text
status          text ('active' | 'revealed')
source_type     text ('bank' | 'user')
source_id       uuid
intensity       text
tag_id          uuid → tags(id)
created_at      timestamptz
revealed_at     timestamptz
```

**Rôle** : Question du jour active pour le groupe. C'est la table historique qui enregistre toutes les questions affichées au groupe. Liée à `daily_slots` via `daily_question_id`.

#### `votes`
```sql
id              uuid PRIMARY KEY
question_id     uuid → daily_questions(id)
voter_id        uuid → profiles(id)
target_user_id  uuid → profiles(id)
context_note    text (optional)
created_at      timestamptz
```

**Rôle** : Votes des membres sur la question du jour.

### 2.2 Relations entre tables

```
groups (1) ──── (N) group_members
groups (1) ──── (N) daily_slots
groups (1) ──── (N) user_submissions
groups (1) ──── (N) daily_questions

daily_slots (1) ──── (1) user_submissions [via slot_id UNIQUE]
daily_slots (N) ──── (1) daily_questions [via daily_question_id]

daily_questions (1) ──── (N) votes
```

**Points clés** :
- Un `daily_slot` peut avoir 0 ou 1 `user_submission` (relation 1-0..1)
- Plusieurs `daily_slots` peuvent pointer vers la même `daily_question` (relation N-1, mais en pratique 1-1 dans le cycle actuel)
- Un groupe a un seul slot par jour (contrainte UNIQUE sur `group_id, target_date`)

---

## 3. Système de cycles (Round-Robin)

### 3.1 Principe du Round-Robin

Le système de cycles garantit que **chaque membre éligible obtient exactement un slot par cycle**, et que l'ordre est mélangé aléatoirement (mais déterministe) à chaque cycle.

#### Caractéristiques :
- **Fairness** : Chaque membre éligible participe une seule fois par cycle
- **Randomisation déterministe** : L'ordre est aléatoire mais reproductible (seed basé sur `group_id + cycle_number`)
- **Limitation** : Maximum 12 membres par cycle (cap de la taille du groupe)
- **Dates consécutives** : Les slots d'un cycle ont des dates consécutives (jour 1, jour 2, jour 3...)

### 3.2 Fonction `generate_future_slots(p_group_id)`

**Localisation** : `supabase/migrations/006_round_robin_slots.sql:153`

**Responsabilité** : Génère un cycle complet de slots pour un groupe.

#### Algorithme détaillé :

```sql
1. Verrouiller le groupe (SELECT ... FOR UPDATE)
2. Incrémenter current_cycle (cycle = cycle + 1)
3. Sélectionner les membres éligibles :
   - Filtrer par cycle_eligible_at <= CURRENT_DATE
   - Trier par joined_at, user_id (ordre déterministe)
   - Limiter à 12 membres
4. Mélanger l'ordre (Fisher-Yates shuffle) :
   - Seed : md5(group_id || cycle_number)
   - Random déterministe avec setseed()
5. Calculer la date de début :
   - start_date = MAX(target_date) + 1 des slots existants
   - Si NULL ou <= TODAY : start_date = TOMORROW
6. Insérer les slots avec dates consécutives :
   - Slot 0 : start_date
   - Slot 1 : start_date + 1
   - Slot N : start_date + N
   - Status : 'scheduled'
```

#### Exemple concret :

**Groupe avec 4 membres** : Alice, Bob, Charlie, Diana

**Cycle 1** :
```
Seed = md5('group_uuid' || '1') → shuffle → [Charlie, Alice, Diana, Bob]
Slots générés :
- 2026-02-17 : Charlie (slot_order=0, cycle_number=1)
- 2026-02-18 : Alice (slot_order=1, cycle_number=1)
- 2026-02-19 : Diana (slot_order=2, cycle_number=1)
- 2026-02-20 : Bob (slot_order=3, cycle_number=1)
```

**Cycle 2** :
```
Seed = md5('group_uuid' || '2') → shuffle → [Bob, Diana, Charlie, Alice]
Slots générés :
- 2026-02-21 : Bob (slot_order=0, cycle_number=2)
- 2026-02-22 : Diana (slot_order=1, cycle_number=2)
- 2026-02-23 : Charlie (slot_order=2, cycle_number=2)
- 2026-02-24 : Alice (slot_order=3, cycle_number=2)
```

### 3.3 Déclenchement de la génération

La génération d'un nouveau cycle se produit dans **deux situations** :

#### A. Création du groupe (`create_group` RPC)

**Localisation** : `supabase/migrations/007_pregame_join_and_cleanup.sql:94`

```sql
CREATE OR REPLACE FUNCTION public.create_group(...)
  ...
  -- Après insertion du créateur dans group_members (via trigger)
  PERFORM public.generate_future_slots(v_group.id);
  RETURN v_group;
END;
```

**Résultat** : Le créateur du groupe obtient immédiatement un slot et peut soumettre sa question (state **Pregame**).

#### B. Fin d'un cycle existant (`activate_daily_slots`)

**Localisation** : `supabase/migrations/006_round_robin_slots.sql:245`

**Condition** : Lorsque `activate_daily_slots()` tente d'activer un slot pour aujourd'hui et :
- Aucun slot `scheduled` n'existe pour `target_date = CURRENT_DATE`
- ET aucun slot futur `scheduled` n'existe

```sql
IF NOT EXISTS (
  SELECT 1 FROM public.daily_slots
  WHERE group_id = r_group.group_id
    AND target_date > CURRENT_DATE
    AND status = 'scheduled'
) THEN
  PERFORM public.generate_future_slots(r_group.group_id);
END IF;
```

**Résultat** : Un nouveau cycle est généré automatiquement dès que tous les slots du cycle actuel sont épuisés.

### 3.4 État des slots

```
scheduled → live → revealed
         ↘ fallback → revealed
```

- **scheduled** : Slot en attente, assigné à un membre, date future ou aujourd'hui (avant question_time)
- **live** : Slot activé, question affichée au groupe, membres peuvent voter
- **revealed** : Résultats visibles (après reveal_time)
- **fallback** : Pas de soumission, question choisie automatiquement depuis la banque

---

## 4. Soumission de questions par les utilisateurs

### 4.1 Mécanisme de soumission

Chaque membre qui a un slot `scheduled` peut soumettre **une seule question** pour ce slot, et ce **avant que le slot soit activé**.

#### Règles :
- **1 soumission par slot** : Relation 1-1 (contrainte UNIQUE sur `slot_id`)
- **Immutabilité** : Une fois soumise, la question est verrouillée jusqu'au prochain cycle
- **Validation** :
  - Si `choose_bank = false` : `question_text` doit avoir entre 10 et 200 caractères
  - Si `choose_bank = true` : `question_text` doit être NULL

#### Statut du slot après soumission :
- Le slot reste en statut `scheduled`
- La soumission est enregistrée dans `user_submissions`
- La question ne sera sélectionnée/affichée qu'au moment de l'activation (quand `activate_daily_slots` s'exécute à `question_time`)

### 4.2 Obtention du prochain slot (`get_my_next_slot`)

**Localisation** : `supabase/migrations/006_round_robin_slots.sql:481`

**Responsabilité** : Retourne le prochain slot assigné à l'utilisateur dans un groupe donné.

```sql
CREATE OR REPLACE FUNCTION public.get_my_next_slot(p_group_id uuid)
RETURNS jsonb
```

**Logique** :
```sql
1. Chercher le prochain slot scheduled pour auth.uid() :
   - status = 'scheduled'
   - target_date >= CURRENT_DATE
   - ORDER BY target_date LIMIT 1
2. Si slot trouvé :
   - Vérifier s'il existe une soumission (user_submissions WHERE slot_id = ...)
   - Retourner JSON avec slot_id, has_submission, submission details
3. Si aucun slot :
   - Retourner { has_upcoming_slot: false }
```

**Réponse typique** :
```json
{
  "has_upcoming_slot": true,
  "slot_id": "123e4567-e89b-12d3-a456-426614174000",
  "has_submission": false,
  "submission": null
}
```

**Utilisation côté client** :

`packages/app/features/groups/group-detail-screen.tsx:111-119`

```typescript
const [nextSlot, adminReplacedToday] = await Promise.all([
  submissionsService.getMyNextSlot(groupId),
  // ...
]);
setMyNextSlot(nextSlot);
```

**Affichage conditionnel** :

`group-detail-screen.tsx:253-258`

```typescript
const shouldShowSubmitCard =
  !!myNextSlot?.has_upcoming_slot &&
  !!myNextSlot?.slot_id &&
  !myNextSlot?.has_submission;
```

Si `shouldShowSubmitCard = true`, l'interface affiche le composant `<SubmitQuestionCard>` permettant à l'utilisateur de soumettre sa question.

### 4.3 Soumission de la question

**Service** : `packages/core/src/services/submissions.ts:14-50`

```typescript
async submitQuestion(
  slotId: string,
  groupId: string,
  questionText: string | null,
  options?: {
    intensity?: QuestionIntensity;
    tagId?: string;
    chooseBank?: boolean;
  }
)
```

**Politique RLS** (Row Level Security) :

`supabase/migrations/006_round_robin_slots.sql:128-140`

```sql
CREATE POLICY "user_submissions_insert"
  ON public.user_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()                    -- L'utilisateur est l'auteur
    AND public.is_member_of(group_id)            -- L'utilisateur est membre du groupe
    AND EXISTS (
      SELECT 1 FROM public.daily_slots ds
      WHERE ds.id = slot_id
        AND ds.assigned_user_id = auth.uid()     -- Le slot est bien assigné à cet utilisateur
        AND ds.status = 'scheduled'              -- Le slot n'est pas encore activé
    )
  );
```

**Garanties** :
- Un utilisateur ne peut soumettre que pour **son propre slot**
- Le slot doit être en statut **scheduled** (pas encore activé)
- La soumission est impossible après activation du slot

### 4.4 Interface utilisateur

**Composant** : `packages/app/features/groups/components/submit-question-card.tsx`

**Fonctionnalités** :
- **Mode "Ma question"** : Champ texte libre (10-200 caractères)
- **Mode "Banque auto"** : L'algorithme choisira automatiquement
- **Sélection d'intensité** : Normal / Épicé
- **Validation** : Temps réel avec compteur de caractères
- **Confirmation** : Modal après soumission réussie

**États UI** :
```
[Pregame / Active / Already voted / Revealed] → Voir mon prochain slot
  ↓
Si has_upcoming_slot && !has_submission
  ↓
Afficher <SubmitQuestionCard>
  ↓
Soumettre → Confirmation → Slot verrouillé
```

---

## 5. Activation et sélection des questions

### 5.1 Fonction `activate_daily_slots()`

**Localisation** : `supabase/migrations/006_round_robin_slots.sql:245`

**Déclenchement** : Cron job toutes les 5 minutes (`pg_cron`)

```sql
SELECT cron.schedule(
  'kiseki-activate-daily-slots',
  '*/5 * * * *',
  $$ SELECT public.activate_daily_slots(); $$
);
```

**Responsabilité** : Activer les slots dont l'heure de question (`question_time`) est passée.

### 5.2 Algorithme détaillé

```sql
POUR chaque groupe g OÙ :
  - current_time >= g.question_time
  - Le groupe a au moins 1 membre
  - Aucun slot 'live'/'revealed'/'fallback' n'existe pour CURRENT_DATE

  1. Chercher le slot scheduled pour target_date = CURRENT_DATE (FOR UPDATE SKIP LOCKED)

  2. SI aucun slot trouvé :
     a. Vérifier s'il existe des slots futurs scheduled
     b. Si non → PERFORM generate_future_slots(g.id)
     c. Retenter de récupérer le slot pour CURRENT_DATE
     d. Si toujours pas trouvé → CONTINUE (passer au groupe suivant)

  3. GUARDRAIL : Compter le nombre de soumissions pour ce cycle
     - SELECT COUNT(*) FROM user_submissions us
       INNER JOIN daily_slots ds ON ds.id = us.slot_id
       WHERE ds.group_id = g.id AND ds.cycle_number = v_slot.cycle_number
     - SI count < 2 → CONTINUE (ne pas activer, attendre plus de soumissions)

  4. Chercher la soumission utilisateur (user_submissions WHERE slot_id = v_slot.id)

  5. SI soumission trouvée :
     a. SI choose_bank = true :
        - Choisir une question depuis question_bank (critères ci-dessous)
        - UPDATE daily_slots SET status='live', source_type='bank', source_id=qb.id
     b. SINON :
        - Utiliser question_text de la soumission
        - UPDATE daily_slots SET status='live', source_type='submission', source_id=us.id

  6. SI aucune soumission (fallback) :
     - Choisir une question depuis question_bank (critères ci-dessous)
     - UPDATE daily_slots SET status='fallback', source_type='bank', source_id=qb.id

  7. Insérer dans daily_questions (status='active')

  8. Lier le slot à la daily_question (UPDATE daily_slots SET daily_question_id=...)
FIN POUR
```

### 5.3 Sélection depuis la banque de questions

**Critères prioritaires** :
```sql
SELECT qb.question, qb.id, qb.tag_id, qb.intensity
FROM public.question_bank qb
WHERE qb.is_active = true
  AND qb.intensity = ANY(g.allowed_intensities)          -- Respect des intensités autorisées
  AND qb.intensity = v_sub.intensity                      -- Respect de l'intensité demandée (si soumission)
  AND qb.question NOT IN (
    SELECT dq.question FROM public.daily_questions dq
    WHERE dq.group_id = g.id
      AND dq.created_at > now() - interval '30 days'     -- Éviter les doublons sur 30 jours
  )
ORDER BY random()
LIMIT 1;
```

**Fallback si aucune question ne respecte les 30 jours** :
```sql
SELECT qb.question, qb.id, qb.tag_id, qb.intensity
FROM public.question_bank qb
WHERE qb.is_active = true
  AND qb.intensity = ANY(g.allowed_intensities)
ORDER BY random()
LIMIT 1;
```

**Dernier fallback** : Si aucune question disponible → CONTINUE (pas de question ce jour-là).

### 5.4 Guardrail : Minimum 2 soumissions par cycle

**Localisation** : `supabase/migrations/006_round_robin_slots.sql:314-322`

```sql
-- Guardrail: the game starts only when at least 2 members have submitted for this cycle
SELECT COUNT(*) INTO v_cycle_submission_count
FROM public.user_submissions us
INNER JOIN public.daily_slots ds ON ds.id = us.slot_id
WHERE ds.group_id = r_group.group_id
  AND ds.cycle_number = v_slot.cycle_number;

IF v_cycle_submission_count < 2 THEN
  CONTINUE;
END IF;
```

**Objectif** : Garantir un niveau minimal d'engagement avant de démarrer le jeu. Si seulement 1 personne a soumis une question dans le cycle, le système attend qu'une 2e personne soumette avant d'activer les slots.

**Conséquence** :
- Le slot reste en statut `scheduled`
- Les membres peuvent toujours soumettre leur question
- Le système réessaiera lors de la prochaine exécution du cron (5 min après)

---

## 6. Gestion des membres et de l'éligibilité

### 6.1 Système d'éligibilité (`cycle_eligible_at`)

Le champ `cycle_eligible_at` dans `group_members` détermine **quand un membre peut participer aux cycles**.

#### Règles :

**A. En phase Pregame** (aucune question encore activée) :

```sql
v_is_pregame := NOT EXISTS (
  SELECT 1 FROM public.daily_questions dq
  WHERE dq.group_id = v_group_id
);

IF v_is_pregame THEN
  cycle_eligible_at := CURRENT_DATE;  -- Éligible immédiatement
END IF;
```

**Résultat** : Tous les membres qui rejoignent avant la première question sont immédiatement éligibles et obtiennent un slot via `ensure_member_scheduled_slot()`.

**B. En cours de jeu** (questions déjà activées) :

```sql
SELECT MAX(ds.target_date) + 1
INTO cycle_eligible_at
FROM public.daily_slots ds
WHERE ds.group_id = v_group_id
  AND ds.status = 'scheduled'
  AND ds.target_date >= CURRENT_DATE;

IF cycle_eligible_at IS NULL THEN
  cycle_eligible_at := CURRENT_DATE;
END IF;
```

**Résultat** : Le nouveau membre devient éligible **le jour après le dernier slot scheduled du cycle actuel**. Il ne "coupe" pas dans le cycle en cours, mais sera inclus dans le prochain cycle.

#### Exemple concret :

**Groupe avec 3 membres** : Alice, Bob, Charlie

**Cycle actuel** :
```
- 2026-02-17 : Alice (scheduled)
- 2026-02-18 : Bob (scheduled)
- 2026-02-19 : Charlie (scheduled)
```

**Diana rejoint le 2026-02-17** :
```
cycle_eligible_at = MAX(2026-02-19) + 1 = 2026-02-20
```

**Diana ne sera pas incluse dans le cycle actuel**, mais sera incluse dans le prochain cycle qui démarrera le 2026-02-20.

### 6.2 Fonction `ensure_member_scheduled_slot()`

**Localisation** : `supabase/migrations/007_pregame_join_and_cleanup.sql:10`

**Responsabilité** : Garantir qu'un membre a au moins un slot `scheduled` dans le groupe.

**Utilisation** : Appelée lors du `join_group_by_code` en phase **Pregame** uniquement.

```sql
CREATE OR REPLACE FUNCTION public.ensure_member_scheduled_slot(
  p_group_id uuid,
  p_user_id uuid
)
```

**Logique** :
```sql
1. Vérifier si le membre a déjà un slot scheduled futur
   - Si oui → RETURN (rien à faire)

2. Déterminer le cycle_number :
   - cycle = MAX(cycle_number) des slots scheduled du groupe
   - OU current_cycle du groupe (prendre le plus grand)

3. Déterminer le slot_order :
   - order = MAX(slot_order) + 1 des slots scheduled du même cycle

4. Déterminer la target_date :
   - date = MAX(target_date) + 1 des slots scheduled futurs
   - Tant qu'il existe déjà un slot à cette date → date + 1

5. Insérer le slot :
   - INSERT INTO daily_slots (group_id, assigned_user_id, target_date, slot_order, cycle_number, status='scheduled')
   - ON CONFLICT (group_id, target_date) DO NOTHING
```

**Résultat** : Le nouveau membre obtient un slot à la fin de la file actuelle.

### 6.3 Création de groupe

**Localisation** : `supabase/migrations/007_pregame_join_and_cleanup.sql:94`

```sql
CREATE OR REPLACE FUNCTION public.create_group(...) RETURNS public.groups
```

**Étapes** :
```sql
1. Insérer le groupe dans la table groups
2. Le trigger on_group_created ajoute automatiquement le créateur dans group_members avec role='admin'
3. Appeler generate_future_slots(group_id)
   → Génère le cycle 1 avec le créateur comme seul membre
4. Retourner le groupe créé
```

**Résultat** : Le créateur obtient immédiatement un slot et peut soumettre sa question avant même qu'un autre membre ne rejoigne.

### 6.4 Rejoindre un groupe

**Localisation** : `supabase/migrations/007_pregame_join_and_cleanup.sql:142`

```sql
CREATE OR REPLACE FUNCTION public.join_group_by_code(p_invite_code text) RETURNS uuid
```

**Étapes** :
```sql
1. Vérifier que le code d'invitation est valide
2. Vérifier que le groupe n'est pas plein (member_count < max_members)
3. Déterminer si le groupe est en Pregame :
   v_is_pregame := NOT EXISTS (SELECT 1 FROM daily_questions WHERE group_id = ...)
4. Calculer cycle_eligible_at :
   - Si Pregame → CURRENT_DATE
   - Sinon → MAX(target_date) + 1 des slots scheduled
5. Insérer le membre :
   INSERT INTO group_members (group_id, user_id, role='member', cycle_eligible_at)
6. Si Pregame :
   PERFORM ensure_member_scheduled_slot(group_id, user_id)
7. Retourner group_id
```

**Résultat** :
- En Pregame : Le membre obtient un slot immédiatement
- En cours : Le membre est en "liste d'attente" et sera inclus dans le prochain cycle

### 6.5 Suppression d'un membre

**Service** : `packages/core/src/services/groups.ts:106-113`

```typescript
async removeMember(groupId: string, userId: string) {
  const { error } = await supabase
    .from("group_members")
    .delete()
    .match({ group_id: groupId, user_id: userId });
}
```

**Politique RLS** : Seuls les admins peuvent supprimer un membre (vérification côté client + RLS).

**Conséquence sur les slots** :
- Les slots `scheduled` du membre supprimé restent dans la base (cascade DELETE via FK)
- Si un slot du membre supprimé arrive et qu'il n'y a pas de soumission → Fallback automatique (banque de questions)

**Note** : Le système actuel **ne régénère pas** les cycles en cas de suppression. Les slots du cycle en cours restent intacts, et le membre supprimé sera simplement exclu du prochain cycle car il n'est plus dans `group_members`.

---

## 7. Flux complets avec diagrammes

### 7.1 Flux de création et démarrage d'un groupe

```
[Utilisateur A crée un groupe]
          ↓
  create_group() RPC
          ↓
  INSERT INTO groups → Groupe créé
          ↓
  Trigger on_group_created → INSERT group_member (A, role='admin')
          ↓
  generate_future_slots(group_id)
          ↓
  Cycle 1 généré avec 1 membre (A)
  - Slot 0 : Demain, user=A, status='scheduled'
          ↓
  [A voit immédiatement le formulaire de soumission]
          ↓
  A soumet sa question via submitQuestion()
  - INSERT INTO user_submissions (slot_id, question_text='...', intensity='normal')
          ↓
  [A invite B avec le code]
          ↓
  [B rejoint via join_group_by_code()]
          ↓
  v_is_pregame = true (aucune daily_question encore)
  → cycle_eligible_at = CURRENT_DATE
  → ensure_member_scheduled_slot(group_id, B)
          ↓
  Slot 1 créé : Demain+1, user=B, status='scheduled'
          ↓
  [B voit le formulaire de soumission]
          ↓
  B soumet sa question
          ↓
  [2 soumissions dans le cycle → guardrail OK]
          ↓
  [Demain à 09:00, activate_daily_slots() s'exécute]
          ↓
  Slot 0 activé :
  - status='live'
  - final_question_text = question de A
  - source_type='submission'
  - INSERT INTO daily_questions (status='active')
          ↓
  [Les membres A et B peuvent voter]
          ↓
  [À 20:00, reveal_due_questions() s'exécute]
          ↓
  daily_question status='revealed'
  daily_slot status='revealed'
          ↓
  [Les résultats sont affichés]
          ↓
  [Demain+1 à 09:00]
          ↓
  Slot 1 activé (question de B)
          ↓
  [Le cycle 1 se termine]
          ↓
  [Demain+2 à 09:00]
          ↓
  activate_daily_slots() ne trouve pas de slot pour aujourd'hui
  → Aucun slot futur scheduled
  → generate_future_slots(group_id)
          ↓
  Cycle 2 généré avec 2 membres (A, B)
  - Shuffle aléatoire → [B, A]
  - Slot 0 : Demain+2, user=B
  - Slot 1 : Demain+3, user=A
          ↓
  [Le cycle 2 démarre]
```

### 7.2 Flux de soumission de question

```
[État : Membre a un slot scheduled]
          ↓
  Client : getMyNextSlot(groupId)
          ↓
  RPC : get_my_next_slot(p_group_id)
  - Chercher le prochain slot scheduled pour auth.uid()
  - Vérifier s'il existe une soumission
          ↓
  Réponse : { has_upcoming_slot: true, slot_id: "...", has_submission: false }
          ↓
  [Afficher <SubmitQuestionCard>]
          ↓
  Utilisateur remplit le formulaire :
  - Mode : "Ma question" ou "Banque auto"
  - Intensité : "Normal" ou "Épicé"
  - Question (si mode "Ma question") : "Qui est le plus drôle ?"
          ↓
  Utilisateur clique sur "Confirmer"
          ↓
  submitQuestion(slotId, groupId, questionText, { intensity, chooseBank })
          ↓
  INSERT INTO user_submissions (
    slot_id, group_id, submitted_by, question_text, choose_bank, intensity
  )
          ↓
  RLS vérifie :
  - submitted_by = auth.uid() ✓
  - is_member_of(group_id) ✓
  - EXISTS slot avec id=slot_id, assigned_user_id=auth.uid(), status='scheduled' ✓
          ↓
  Soumission enregistrée
          ↓
  [Modal de confirmation affiché]
  "Proposition envoyée"
  "Ta proposition est verrouillée jusqu'au prochain cycle."
          ↓
  [Client : fetchData() rafraîchit]
          ↓
  getMyNextSlot(groupId) retourne maintenant :
  { has_upcoming_slot: true, slot_id: "...", has_submission: true, submission: {...} }
          ↓
  [Le formulaire disparaît, remplacé par un message de confirmation]
```

### 7.3 Flux d'activation quotidienne

```
[Cron job exécute activate_daily_slots() toutes les 5 min]
          ↓
  Pour chaque groupe g :
          ↓
  Condition 1 : current_time >= g.question_time ✓
  Condition 2 : Le groupe a des membres ✓
  Condition 3 : Aucun slot live/revealed/fallback pour CURRENT_DATE ✓
          ↓
  SELECT slot FROM daily_slots
  WHERE group_id=g.id AND target_date=CURRENT_DATE AND status='scheduled'
  FOR UPDATE SKIP LOCKED;
          ↓
  [Slot trouvé : slot_id="abc", assigned_user_id=user_A, cycle_number=1]
          ↓
  Vérifier le guardrail :
  SELECT COUNT(*) FROM user_submissions us
  INNER JOIN daily_slots ds ON ds.id = us.slot_id
  WHERE ds.group_id = g.id AND ds.cycle_number = 1;
          ↓
  [Count = 3 → OK (>= 2)]
          ↓
  Chercher la soumission :
  SELECT * FROM user_submissions WHERE slot_id = "abc";
          ↓
  [Soumission trouvée : question_text="Qui est le plus sportif ?", choose_bank=false]
          ↓
  Utiliser la question de l'utilisateur :
  - v_question_text = "Qui est le plus sportif ?"
  - v_source_type = 'submission'
  - v_source_id = submission.id
          ↓
  UPDATE daily_slots SET
    status='live',
    final_question_text=v_question_text,
    source_type='submission',
    source_id=v_source_id,
    activated_at=now()
  WHERE id="abc";
          ↓
  INSERT INTO daily_questions (
    group_id, question, status='active', source_type='user', source_id
  ) RETURNING id;
          ↓
  [daily_question_id="xyz"]
          ↓
  UPDATE daily_slots SET daily_question_id="xyz" WHERE id="abc";
          ↓
  [La question est maintenant active et visible pour tous les membres]
```

### 7.4 Flux de vote et révélation

```
[Question active, status='active', slot status='live']
          ↓
  [Membres A, B, C voient la question]
  "Qui est le plus sportif ?"
          ↓
  [Membre A clique sur avatar de B]
          ↓
  [Modal de confirmation s'ouvre]
  - Champ optionnel "context_note" : "Il court tous les jours !"
          ↓
  [A confirme]
          ↓
  submitVote(questionId, targetUserId=B, contextNote="Il court tous les jours !")
          ↓
  INSERT INTO votes (question_id, voter_id=A, target_user_id=B, context_note="...")
          ↓
  [Vote enregistré]
          ↓
  [A voit maintenant un écran de confirmation avec countdown]
  "Tu as voté pour B"
  "Résultats dans 08:45:23"
          ↓
  [B et C votent également]
          ↓
  [À 20:00, reveal_due_questions() s'exécute]
          ↓
  UPDATE daily_questions SET status='revealed', revealed_at=now()
  WHERE group_id=g.id AND status='active' AND created_at::date=CURRENT_DATE
    AND current_time >= g.reveal_time;
          ↓
  UPDATE daily_slots SET status='revealed'
  WHERE daily_question_id IN (questions révélées);
          ↓
  [Les membres rafraîchissent et voient les résultats]
          ↓
  Client : getQuestionResults(questionId)
          ↓
  Agrégation des votes :
  - B : 5 votes (50%)
  - C : 3 votes (30%)
  - A : 2 votes (20%)
          ↓
  [Affichage du podium]
  1. B (5 votes)
  2. C (3 votes)
  3. A (2 votes)
          ↓
  [Les membres peuvent :
   - Voir le détail des votes
   - Partager le résultat
   - Soumettre leur question pour le prochain cycle si leur slot est arrivé]
```

### 7.5 Flux d'ajout de membre en cours de jeu

```
[Groupe en cours : Cycle 2, 3 membres (A, B, C)]
          ↓
  Slots actuels du cycle 2 :
  - 2026-02-20 : B (live)      ← Aujourd'hui
  - 2026-02-21 : C (scheduled)
  - 2026-02-22 : A (scheduled)
          ↓
  [Diana rejoint via join_group_by_code("ABC123")]
          ↓
  v_is_pregame = false (il existe des daily_questions)
          ↓
  Calculer cycle_eligible_at :
  SELECT MAX(target_date) + 1 FROM daily_slots
  WHERE group_id=g.id AND status='scheduled' AND target_date >= CURRENT_DATE;
  → MAX(2026-02-22) + 1 = 2026-02-23
          ↓
  INSERT INTO group_members (
    group_id, user_id=Diana, role='member', cycle_eligible_at='2026-02-23'
  );
          ↓
  [Diana est ajoutée mais PAS incluse dans le cycle actuel]
          ↓
  [Le 2026-02-22, le cycle 2 se termine]
          ↓
  [Le 2026-02-23 à 09:00, activate_daily_slots() cherche un slot pour aujourd'hui]
          ↓
  Aucun slot trouvé ET aucun slot futur
  → PERFORM generate_future_slots(g.id);
          ↓
  Sélection des membres éligibles :
  SELECT user_id FROM group_members
  WHERE group_id=g.id AND cycle_eligible_at <= '2026-02-23'
  ORDER BY joined_at, user_id;
  → [A, B, C, Diana] (Diana est maintenant éligible)
          ↓
  Cycle 3 généré avec 4 membres :
  - Shuffle → [Diana, B, A, C]
  - 2026-02-23 : Diana (scheduled)
  - 2026-02-24 : B (scheduled)
  - 2026-02-25 : A (scheduled)
  - 2026-02-26 : C (scheduled)
          ↓
  [Diana obtient son premier slot et peut soumettre sa question]
```

---

## 8. Règles métier et contraintes

### 8.1 Contraintes de base de données

#### UNIQUE constraints :
- `groups.invite_code` : Un seul groupe par code d'invitation
- `group_members(group_id, user_id)` : Un utilisateur ne peut rejoindre un groupe qu'une fois
- `daily_slots(group_id, target_date)` : Un seul slot par jour et par groupe
- `user_submissions.slot_id` : Une seule soumission par slot

#### CHECK constraints :
- `daily_slots.status` : IN ('scheduled', 'live', 'revealed', 'fallback')
- `user_submissions` : Logic de validation (question_text vs choose_bank)

#### Foreign key cascades :
- `daily_slots.group_id` → `groups(id)` ON DELETE CASCADE
- `user_submissions.slot_id` → `daily_slots(id)` ON DELETE CASCADE

### 8.2 Règles de gestion des slots

1. **Un slot par jour et par groupe** : Garantie par UNIQUE constraint
2. **Ordre déterministe** : Le shuffle est reproductible (même seed → même ordre)
3. **Dates consécutives** : Les slots d'un cycle ont des dates successives sans trous
4. **Statut unidirectionnel** : `scheduled` → `live` → `revealed` (pas de retour en arrière)
5. **Immutabilité après activation** : Une fois `live`, le slot ne change plus (sauf `admin_replace_question`)

### 8.3 Règles de soumission

1. **Une seule soumission par slot** : Relation 1-1 (UNIQUE constraint)
2. **Soumission avant activation** : RLS empêche la soumission si `status != 'scheduled'`
3. **Verrouillage post-soumission** : Pas de UPDATE/DELETE policy (immutable)
4. **Validation de taille** : 10-200 caractères pour les questions personnalisées

### 8.4 Règles d'activation

1. **Respect de l'horaire** : Activation uniquement si `current_time >= question_time`
2. **Guardrail 2 soumissions** : Minimum 2 soumissions dans le cycle avant activation
3. **Priorisation des soumissions** : User submission > Fallback (banque)
4. **Évitement des doublons** : Exclusion des questions utilisées dans les 30 derniers jours

### 8.5 Règles de cycles

1. **Fairness** : Chaque membre éligible apparaît exactement 1 fois par cycle
2. **Éligibilité progressive** : Nouveaux membres en "liste d'attente" (cycle_eligible_at)
3. **Cap à 12 membres** : Maximum 12 slots par cycle
4. **Génération automatique** : Nouveau cycle dès que le précédent est épuisé

### 8.6 Règles d'administration

1. **Remplacement limité** : 1 remplacement admin par jour et par groupe
2. **Remplacement uniquement sur questions actives** : Pas de remplacement sur questions révélées
3. **Exclusion des membres** : Possible mais ne régénère pas les cycles (slots orphelins traités en fallback)

---

## 9. Cas d'usage et scénarios

### 9.1 Scénario 1 : Démarrage d'un groupe

**Contexte** : Alice crée un groupe et invite Bob et Charlie.

**Étapes** :
1. Alice crée le groupe "Les amis" → Cycle 1 généré avec slot pour Alice demain
2. Alice soumet sa question "Qui est le plus drôle ?"
3. Bob rejoint (Pregame) → Obtient slot pour demain+1
4. Charlie rejoint (Pregame) → Obtient slot pour demain+2
5. Bob soumet sa question "Qui est le plus créatif ?"
6. Charlie soumet sa question "Qui est le plus sportif ?"
7. Demain à 09:00 → Question d'Alice activée
8. Alice, Bob, Charlie votent
9. À 20:00 → Résultats révélés
10. Demain+1 à 09:00 → Question de Bob activée
11. ...

**Observations** :
- Tous les membres en Pregame obtiennent des slots immédiatement
- L'ordre des slots = ordre d'arrivée en Pregame
- Le cycle 1 démarre dès que 2+ soumissions sont faites

### 9.2 Scénario 2 : Ajout tardif d'un membre

**Contexte** : Groupe de 3 membres en Cycle 2, Diana rejoint.

**Étapes** :
1. Cycle 2 en cours : [Bob (live), Alice (scheduled), Charlie (scheduled)]
2. Diana rejoint → cycle_eligible_at = après le dernier slot du Cycle 2
3. Diana ne participe PAS au Cycle 2
4. Fin du Cycle 2
5. Génération du Cycle 3 → Diana incluse (4 membres)
6. Cycle 3 : [Diana, Charlie, Bob, Alice] (ordre aléatoire)
7. Diana obtient son premier slot et peut soumettre

**Observations** :
- Pas de perturbation du cycle en cours
- Diana en "liste d'attente" jusqu'au prochain cycle
- Fairness préservée (tous les membres éligibles ont un slot au Cycle 3)

### 9.3 Scénario 3 : Guardrail 2 soumissions

**Contexte** : Groupe de 4 membres, seul 1 a soumis une question.

**Étapes** :
1. Cycle 1 généré : [Alice, Bob, Charlie, Diana]
2. Seule Alice soumet sa question
3. Demain à 09:00 → activate_daily_slots() s'exécute
4. Guardrail : COUNT(soumissions du Cycle 1) = 1 < 2
5. Activation ANNULÉE → Le slot reste `scheduled`
6. Bob soumet sa question 30 min plus tard
7. 09:05 → activate_daily_slots() réessaye
8. Guardrail : COUNT = 2 ≥ 2 → OK
9. Question d'Alice activée

**Observations** :
- Le système attend un minimum d'engagement avant de démarrer
- Évite les situations où un seul membre participe
- Le cron réessaye automatiquement toutes les 5 min

### 9.4 Scénario 4 : Fallback automatique

**Contexte** : Le membre assigné à un slot ne soumet pas de question.

**Étapes** :
1. Cycle 1 : [Alice (slot 0), Bob (slot 1), Charlie (slot 2)]
2. Alice soumet sa question
3. Bob ne soumet PAS de question
4. Charlie soumet sa question
5. Demain à 09:00 → Slot d'Alice activé (sa soumission)
6. Demain+1 à 09:00 → Slot de Bob activé
   - Aucune soumission trouvée
   - Fallback : SELECT question FROM question_bank WHERE ... ORDER BY random() LIMIT 1
   - UPDATE daily_slots SET status='fallback', source_type='bank'
7. Les membres votent sur la question de la banque

**Observations** :
- Pas de blocage si un membre ne soumet pas
- La banque de questions assure la continuité
- Le slot est marqué `fallback` pour traçabilité

### 9.5 Scénario 5 : Remplacement admin

**Contexte** : La question du jour est jugée inappropriée par l'admin.

**Étapes** :
1. Question activée à 09:00 : "Question controversée"
2. Admin voit le bouton "Remplacer" (visible seulement pour les admins)
3. Admin clique → Modal de confirmation
4. Confirmation → admin_replace_question(group_id, daily_question_id) RPC
5. Vérification : COUNT(admin_replaced_at aujourd'hui) < 1 ✓
6. Sélection d'une nouvelle question depuis question_bank (différente, pas de doublon 30j)
7. UPDATE daily_questions SET question=nouvelle_question, source_type='bank'
8. UPDATE daily_slots SET admin_replaced_at=now(), admin_replaced_by=admin_id
9. Les membres voient maintenant la nouvelle question
10. Admin ne peut plus remplacer aujourd'hui (limite atteinte)

**Observations** :
- Limite de 1 remplacement par jour et par groupe (évite les abus)
- Traçabilité complète (admin_replaced_at, admin_replaced_by)
- La nouvelle question vient toujours de la banque (pas de soumission utilisateur)

---

## 10. API et services

### 10.1 Services TypeScript

**Localisation** : `packages/core/src/services/`

#### `submissions.ts`

```typescript
createSubmissionsService(supabase: SupabaseClient) {
  // Obtenir le prochain slot de l'utilisateur
  async getMyNextSlot(groupId: string): Promise<MyNextSlotResponse>

  // Soumettre une question pour un slot
  async submitQuestion(
    slotId: string,
    groupId: string,
    questionText: string | null,
    options?: { intensity?, tagId?, chooseBank? }
  )

  // Admin : remplacer la question active
  async adminReplaceQuestion(groupId: string, dailyQuestionId: string)

  // Vérifier si admin a déjà remplacé aujourd'hui
  async hasAdminReplacedToday(groupId: string): Promise<boolean>
}
```

#### `groups.ts`

```typescript
createGroupsService(supabase: SupabaseClient) {
  // Créer un groupe
  async createGroup(name: string, options?: { maxMembers?, questionTime?, revealTime?, allowedIntensities? })

  // Rejoindre un groupe via code d'invitation
  async joinGroupByCode(inviteCode: string): Promise<string>

  // Obtenir mes groupes
  async getMyGroups(): Promise<GroupWithMemberCount[]>

  // Détails d'un groupe
  async getGroupDetail(groupId: string): Promise<{ group, members }>

  // Quitter un groupe
  async leaveGroup(groupId: string)

  // Exclure un membre (admin)
  async removeMember(groupId: string, userId: string)
}
```

#### `votes.ts`

```typescript
createVotesService(supabase: SupabaseClient) {
  // Obtenir la question du jour
  async getTodayQuestion(groupId: string): Promise<DailyQuestion | null>

  // Obtenir mon vote
  async getMyVote(questionId: string): Promise<Vote | null>

  // Soumettre un vote
  async submitVote(questionId: string, targetUserId: string, contextNote?: string): Promise<Vote>

  // Obtenir les résultats d'une question
  async getQuestionResults(questionId: string): Promise<QuestionWithResults>
}
```

### 10.2 Fonctions SQL (RPC)

#### `create_group(p_name, p_max_members, p_question_time, p_reveal_time, p_allowed_intensities)`
- **Responsabilité** : Créer un groupe et générer le premier cycle
- **Retour** : `public.groups`
- **Permissions** : authenticated

#### `join_group_by_code(p_invite_code)`
- **Responsabilité** : Rejoindre un groupe via code d'invitation
- **Retour** : `uuid` (group_id)
- **Permissions** : authenticated
- **Logique** : Calcul du cycle_eligible_at, ajout dans group_members, appel de ensure_member_scheduled_slot si Pregame

#### `generate_future_slots(p_group_id)`
- **Responsabilité** : Générer un cycle complet de slots
- **Retour** : `void`
- **Permissions** : SECURITY DEFINER (pas exposé directement aux clients)
- **Logique** : Shuffle Fisher-Yates, dates consécutives, incrément du cycle_number

#### `get_my_next_slot(p_group_id)`
- **Responsabilité** : Retourner le prochain slot scheduled de l'utilisateur
- **Retour** : `jsonb` (MyNextSlotResponse)
- **Permissions** : authenticated
- **Logique** : SELECT avec vérification de soumission

#### `admin_replace_question(p_group_id, p_daily_question_id)`
- **Responsabilité** : Remplacer une question active par une autre de la banque
- **Retour** : `void`
- **Permissions** : authenticated (vérifie is_group_admin)
- **Logique** : Vérification limite 1/jour, sélection banque, UPDATE in-place

#### `activate_daily_slots()`
- **Responsabilité** : Activer les slots dont l'heure est passée
- **Retour** : `void`
- **Permissions** : SECURITY DEFINER (exécuté par pg_cron)
- **Fréquence** : Toutes les 5 minutes
- **Logique** : Pour chaque groupe, vérifier guardrail, sélectionner question, activer slot, créer daily_question

#### `reveal_due_questions()`
- **Responsabilité** : Révéler les questions dont l'heure de révélation est passée
- **Retour** : `void`
- **Permissions** : SECURITY DEFINER (exécuté par pg_cron)
- **Fréquence** : Toutes les 5 minutes
- **Logique** : UPDATE daily_questions status='revealed', UPDATE daily_slots status='revealed'

### 10.3 Politiques RLS (Row Level Security)

#### `daily_slots`
- **SELECT** : `daily_slots_select_member` → Membres du groupe peuvent lire les slots
- **INSERT/UPDATE/DELETE** : Pas de politique directe (uniquement via RPC SECURITY DEFINER)

#### `user_submissions`
- **SELECT** : `user_submissions_select` → Auteur OU admin du groupe
- **INSERT** : `user_submissions_insert` → Auteur = auth.uid(), membre du groupe, slot assigné à l'utilisateur, slot en statut 'scheduled'
- **UPDATE/DELETE** : Aucune (immutabilité)

#### `daily_questions`
- **SELECT** : Membres du groupe (policy existante, non modifiée par les migrations 006-008)
- **INSERT/UPDATE/DELETE** : Via RPC SECURITY DEFINER uniquement

#### `votes`
- **SELECT** : Membres du groupe (policy existante)
- **INSERT** : Membre du groupe, 1 vote par question par utilisateur
- **UPDATE/DELETE** : Aucune (immutabilité)

---

## 11. Diagrammes d'états

### 11.1 État d'un slot (`daily_slots.status`)

```
   [Création]
       ↓
   scheduled ────────────┐
       ↓                 │
   [activate_daily_     │
    slots() exécute]    │
       ↓                 │
   ┌───────────┐         │
   │           │         │
   ↓           ↓         │
  live      fallback     │ (Si pas de soumission)
   │           │         │
   │           │         │
   ↓           ↓         │
  [reveal_due_          │
   questions()          │
   exécute]             │
   │           │         │
   ↓           ↓         │
  revealed ←───────────┘
```

### 11.2 État d'une question (`daily_questions.status`)

```
   [Création lors de activate_daily_slots()]
       ↓
    active
       ↓
   [reveal_due_questions() exécute à reveal_time]
       ↓
   revealed
```

### 11.3 Cycle de vie d'une soumission (`user_submissions`)

```
   [Utilisateur obtient un slot scheduled]
       ↓
   [Affichage du formulaire SubmitQuestionCard]
       ↓
   [Utilisateur remplit et soumet]
       ↓
   INSERT INTO user_submissions
       ↓
   [Soumission verrouillée et cachée]
       ↓
   [activate_daily_slots() sélectionne la soumission]
       ↓
   [Question affichée au groupe]
       ↓
   [Fin du cycle → nouvelle soumission possible dans le prochain cycle]
```

### 11.4 État d'un groupe (phases)

```
   [Création du groupe]
       ↓
    Pregame
    - Pas de daily_questions
    - Nouveaux membres éligibles immédiatement
    - Slots générés au fur et à mesure
       ↓
   [Première activation (guardrail 2 soumissions OK)]
       ↓
    En cours
    - Questions activées quotidiennement
    - Nouveaux membres en liste d'attente
    - Cycles générés automatiquement
       ↓
   [Groupe continue indéfiniment tant qu'il y a des membres actifs]
```

---

## 12. Points d'attention et optimisations

### 12.1 Performances

- **Index sur daily_slots** : `(group_id, target_date)`, `(assigned_user_id)`, `(status)`
- **Index sur user_submissions** : `(slot_id)`, `(group_id)`
- **FOR UPDATE SKIP LOCKED** : Évite les deadlocks lors de l'activation concurrente

### 12.2 Limites connues

- **Pas de réorganisation dynamique** : Si un membre quitte en cours de cycle, ses slots restent (fallback)
- **Pas de modification après soumission** : Les soumissions sont immutables (by design)
- **Cap de 12 membres par cycle** : Limitation intentionnelle pour garder des cycles raisonnables
- **Guardrail rigide** : Si moins de 2 soumissions dans un cycle, aucun slot ne s'active (peut bloquer le groupe)

### 12.3 Améliorations possibles

1. **Notifications push** : Alerter les membres quand leur slot approche
2. **Rappels automatiques** : Notifier les membres qui n'ont pas encore soumis
3. **Analytics** : Taux de participation par membre, questions les plus populaires
4. **Modération avancée** : File d'attente de validation pour les questions sensibles
5. **Slots flexibles** : Permettre aux membres d'échanger leurs slots
6. **Cycles variables** : Permettre des cycles de longueur différente (pas forcément tous les membres)

---

## Conclusion

Le système de cycles et de soumission de questions de Kiseki repose sur une architecture solide garantissant :

✅ **Fairness** : Chaque membre éligible a sa chance de proposer une question
✅ **Engagement** : Guardrail de 2 soumissions minimales pour démarrer
✅ **Continuité** : Fallback automatique si un membre ne soumet pas
✅ **Flexibilité** : Liste d'attente pour nouveaux membres en cours de jeu
✅ **Traçabilité** : Tous les événements (activation, remplacement admin) sont loggés
✅ **Sécurité** : RLS stricte, validation côté base de données

Le système est **déterministe** (même seed → même ordre), **résilient** (gestion des absences), et **scalable** (génération automatique de cycles).

---

**Document rédigé le 2026-02-16**
**Version du système : Migrations 006, 007, 008**
**Auteur : Analyse technique de Claude (Sonnet 4.5)**
