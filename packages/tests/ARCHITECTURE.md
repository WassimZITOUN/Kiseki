# Architecture des Tests E2E - Kiseki

## Vue d'ensemble

Cette suite de tests E2E simule un environnement complet d'exécution de l'application Kiseki, en utilisant une base de données Supabase locale et une "machine à voyager dans le temps" pour simuler le passage des jours.

## Structure du projet

```
packages/tests/
├── e2e/
│   └── cycles.test.ts          # Suite de tests E2E complète
├── utils/
│   ├── supabase-test-client.ts # Gestion des clients Supabase (service_role, anon)
│   ├── time-travel.ts           # Fonction de voyage dans le temps
│   └── test-helpers.ts          # Helpers pour les opérations courantes
├── sql/
│   └── time-travel-function.sql # Fonction SQL time-travel (backup manuel)
├── vitest.config.ts             # Configuration Vitest
├── tsconfig.json                # Configuration TypeScript
├── package.json                 # Dépendances du package
└── README.md                    # Documentation utilisateur

```

## Composants principaux

### 1. Clients Supabase (`utils/supabase-test-client.ts`)

**Responsabilité** : Gérer les clients Supabase avec différents niveaux d'autorisation.

#### `getServiceRoleClient()`
- **Usage** : Opérations d'administration (setup, cleanup, time-travel)
- **Clé** : `SUPABASE_SERVICE_ROLE_KEY`
- **Bypass RLS** : Oui
- **Exemple** :
  ```typescript
  const adminClient = getServiceRoleClient();
  await adminClient.from("daily_slots").delete().neq("id", "...");
  ```

#### `getAnonClient()`
- **Usage** : Base pour créer des clients utilisateurs authentifiés
- **Clé** : `SUPABASE_ANON_KEY`
- **Bypass RLS** : Non

#### `createTestUser(email, password)`
- **Usage** : Créer un utilisateur de test et retourner un client authentifié
- **Étapes** :
  1. Créer l'utilisateur via Auth Admin API (service_role)
  2. Créer le profil associé dans `profiles`
  3. Authentifier l'utilisateur via `signInWithPassword`
  4. Retourner `{ client, userId }`
- **Exemple** :
  ```typescript
  const userA = await createTestUser("alice@test.com", "password123");
  await submitQuestion(userA.client, slotId, groupId, "Ma question");
  ```

#### `cleanupTestData()`
- **Usage** : Nettoyer toutes les données de test après une suite
- **Ordre de suppression** : votes → user_submissions → daily_questions → daily_slots → group_members → groups → auth.users

### 2. Time-Travel (`utils/time-travel.ts`)

**Responsabilité** : Simuler le passage du temps en modifiant les timestamps dans la base de données.

#### `setupTimeTravel(client)`
- **Usage** : Injecter la fonction SQL `test_advance_time(days int)` dans la DB
- **Appelé dans** : `beforeAll()` de la suite de tests

#### `advanceTime(client, days)`
- **Usage** : Avancer le temps de N jours
- **Effet** : Modifie les colonnes suivantes :
  - `daily_slots.target_date`
  - `group_members.cycle_eligible_at`
  - `daily_questions.created_at` et `revealed_at`
  - `daily_slots.activated_at` et `admin_replaced_at`
- **Exemple** :
  ```typescript
  await advanceTime(serviceClient, 1); // Avancer de 1 jour
  ```

#### `cleanupTimeTravel(client)`
- **Usage** : Supprimer la fonction `test_advance_time()` après les tests
- **Appelé dans** : `afterAll()` de la suite de tests

### 3. Test Helpers (`utils/test-helpers.ts`)

**Responsabilité** : Fournir des wrappers autour des opérations courantes pour simplifier les tests.

#### Opérations de groupe
- `createTestGroup(client, name, options)` : Créer un groupe via RPC `create_group`
- `joinGroupByCode(client, inviteCode)` : Rejoindre un groupe via RPC `join_group_by_code`
- `getGroupDetails(client, groupId)` : Obtenir les détails d'un groupe
- `getGroupSlots(client, groupId)` : Obtenir tous les slots d'un groupe

#### Opérations de soumission
- `getMyNextSlot(client, groupId)` : Obtenir le prochain slot de l'utilisateur via RPC `get_my_next_slot`
- `submitQuestion(client, slotId, groupId, questionText, options)` : Soumettre une question pour un slot
- `getCycleSubmissions(client, groupId, cycleNumber)` : Obtenir toutes les soumissions d'un cycle

#### Opérations de question et vote
- `getTodayQuestion(client, groupId)` : Obtenir la question du jour
- `submitVote(client, questionId, targetUserId, contextNote)` : Voter pour un membre

#### Opérations de cron (simulation)
- `activateDailySlots(client)` : Simuler le cron `activate_daily_slots()`
- `revealDueQuestions(client)` : Simuler le cron `reveal_due_questions()`

#### Opérations d'administration
- `adminReplaceQuestion(client, groupId, dailyQuestionId)` : Remplacer une question via RPC `admin_replace_question`

## Flux de test typique

### Phase 1 : Setup (`beforeAll`)

```typescript
beforeAll(async () => {
  // 1. Obtenir le client service_role
  serviceClient = getServiceRoleClient();

  // 2. Nettoyer les données existantes
  await cleanupTestData();

  // 3. Injecter la fonction time-travel
  await setupTimeTravel(serviceClient);

  // 4. Créer les utilisateurs de test
  userA = await createTestUser("alice@test.com", "pass123");
  userB = await createTestUser("bob@test.com", "pass123");
  // ...
});
```

### Phase 2 : Exécution des tests

```typescript
test("Scénario X", async () => {
  // 1. Setup : Créer un groupe
  const groupId = await createTestGroup(userA.client, "Test Group");

  // 2. Action : Soumettre une question
  const slotInfo = await getMyNextSlot(userA.client, groupId);
  await submitQuestion(userA.client, slotInfo.slot_id, groupId, "Question");

  // 3. Vérification : Assertion
  const updatedSlot = await getMyNextSlot(userA.client, groupId);
  expect(updatedSlot.has_submission).toBe(true);

  // 4. Time-Travel : Avancer au lendemain
  await advanceTime(serviceClient, 1);

  // 5. Simulation cron : Activer les slots
  await activateDailySlots(serviceClient);

  // 6. Vérification : Question active
  const todayQuestion = await getTodayQuestion(serviceClient, groupId);
  expect(todayQuestion.status).toBe("active");
});
```

### Phase 3 : Cleanup (`afterAll`)

```typescript
afterAll(async () => {
  // 1. Supprimer la fonction time-travel
  await cleanupTimeTravel(serviceClient);

  // 2. Nettoyer toutes les données
  await cleanupTestData();
});
```

## Patterns de test

### Pattern 1 : Guardrail Testing

**Objectif** : Vérifier qu'une action est bloquée tant qu'une condition n'est pas remplie.

```typescript
// Étape 1 : 1 seule soumission
await submitQuestion(userA.client, slotA, groupId, "Question A");

// Étape 2 : Tenter d'activer → Doit échouer silencieusement
await activateDailySlots(serviceClient);
expect(await getTodayQuestion(serviceClient, groupId)).toBeNull();

// Étape 3 : 2e soumission → Guardrail satisfait
await submitQuestion(userB.client, slotB, groupId, "Question B");

// Étape 4 : Activer → Doit réussir
await activateDailySlots(serviceClient);
expect(await getTodayQuestion(serviceClient, groupId)).not.toBeNull();
```

### Pattern 2 : Fallback Testing

**Objectif** : Vérifier que le système gère gracieusement l'absence de soumission.

```typescript
// Étape 1 : Avancer au tour d'un membre qui n'a pas soumis
await advanceTime(serviceClient, 1);

// Étape 2 : Activer → Fallback vers la banque de questions
await activateDailySlots(serviceClient);

// Étape 3 : Vérifier le statut 'fallback'
const todayQuestion = await getTodayQuestion(serviceClient, groupId);
expect(todayQuestion.source_type).toBe("bank");

const slots = await getGroupSlots(serviceClient, groupId);
const fallbackSlot = slots.find(s => s.status === "fallback");
expect(fallbackSlot).toBeDefined();
```

### Pattern 3 : Waitlist Testing

**Objectif** : Vérifier que les nouveaux membres sont mis en liste d'attente.

```typescript
// Étape 1 : Diana rejoint pendant un cycle actif
await joinGroupByCode(userD.client, inviteCode);

// Étape 2 : Vérifier cycle_eligible_at futur
const { data: member } = await serviceClient
  .from("group_members")
  .select("cycle_eligible_at")
  .eq("user_id", userD.userId)
  .single();

const eligibleDate = new Date(member.cycle_eligible_at);
expect(eligibleDate.getTime()).toBeGreaterThan(new Date().getTime());

// Étape 3 : Vérifier pas de slot dans le cycle actuel
const slotInfo = await getMyNextSlot(userD.client, groupId);
expect(slotInfo.has_upcoming_slot).toBe(false);

// Étape 4 : Avancer jusqu'au prochain cycle
await advanceTime(serviceClient, 4); // Fin du cycle actuel
await activateDailySlots(serviceClient); // Génère le nouveau cycle

// Étape 5 : Diana obtient maintenant un slot
const newSlotInfo = await getMyNextSlot(userD.client, groupId);
expect(newSlotInfo.has_upcoming_slot).toBe(true);
```

### Pattern 4 : RLS Testing

**Objectif** : Vérifier que les politiques de sécurité empêchent les actions non autorisées.

```typescript
// Scénario 1 : User A ne peut pas soumettre pour le slot de User B
const slotB = await getMyNextSlot(userB.client, groupId);
await expect(
  submitQuestion(userA.client, slotB.slot_id, groupId, "Pirate")
).rejects.toThrow();

// Scénario 2 : User ne peut pas voter 2 fois
await submitVote(userA.client, questionId, userB.userId);
await expect(
  submitVote(userA.client, questionId, userC.userId)
).rejects.toThrow();

// Scénario 3 : Non-admin ne peut pas remplacer une question
await expect(
  adminReplaceQuestion(userB.client, groupId, questionId)
).rejects.toThrow();
```

## Débogage

### Activer les logs SQL

Dans Supabase Studio, ouvrir la console SQL et activer les logs :

```sql
SET log_statement = 'all';
SET log_duration = on;
```

### Inspecter l'état de la DB pendant les tests

Utilisez `console.log()` ou `debugger` pour mettre en pause les tests et inspecter :

```typescript
test("Debug", async () => {
  const slots = await getGroupSlots(serviceClient, groupId);
  console.table(slots); // Afficher les slots dans la console

  debugger; // Pause ici pour inspecter dans Supabase Studio
});
```

### Désactiver le cleanup

Commentez temporairement `afterAll()` pour conserver les données après les tests :

```typescript
// afterAll(async () => {
//   await cleanupTimeTravel(serviceClient);
//   await cleanupTestData();
// });
```

## Limitations connues

1. **Time-travel imparfait** : La fonction ne modifie que les timestamps existants, pas `CURRENT_DATE` ou `now()` dans les triggers/fonctions SQL. Cela signifie que les comparaisons avec `CURRENT_DATE` dans les fonctions SQL ne seront pas affectées.

2. **Pas de simulation d'heures** : Seuls les jours peuvent être avancés. Les tests supposent que `question_time` et `reveal_time` sont déjà passés lors de l'activation.

3. **Banque de questions requise** : Les tests de fallback nécessitent que `question_bank` contienne au moins quelques questions.

4. **Pas de rollback** : Le time-travel est unidirectionnel (pas de retour en arrière possible).

## Maintenance

### Ajouter un nouveau scénario de test

1. Créer une nouvelle section `describe()` dans `e2e/cycles.test.ts`
2. Suivre la convention de nommage : `X. Nom du scénario`
3. Numéroter les tests : `X1, X2, X3...`
4. Ajouter des logs explicites : `console.log(\`  ✓ Action réussie\`)`
5. Documenter les assertions critiques

### Mettre à jour après modification de la DB

Si le schéma de la base de données change :

1. **Mettre à jour `time-travel-function.sql`** : Ajouter les nouvelles colonnes timestamp
2. **Mettre à jour `test-helpers.ts`** : Adapter les wrappers si les RPCs changent
3. **Mettre à jour `cycles.test.ts`** : Adapter les assertions si les types changent

---

**Maintenu par** : Équipe QA - Kiseki
**Dernière mise à jour** : 2026-02-16
