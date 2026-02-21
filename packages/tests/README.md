# 🧪 Kiseki E2E Tests - Suite de Tests d'Intégration

Suite complète de tests E2E pour le système de cycles Round-Robin de Kiseki.

## ⚠️ ATTENTION

**Ces tests sont conçus EXCLUSIVEMENT pour une instance Supabase LOCALE.**

🚨 **NE JAMAIS exécuter ces tests contre une base de données de production !**

Les tests modifient directement les timestamps dans la base de données pour simuler le passage du temps et peuvent corrompre les données.

---

## 📋 Prérequis

### 1. Supabase Local

Assurez-vous que Supabase CLI est installé et qu'une instance locale est en cours d'exécution :

```bash
# Installer Supabase CLI (si pas déjà fait)
npm install -g supabase

# Démarrer Supabase local
cd /chemin/vers/le/projet
supabase start
```

Votre instance locale devrait être accessible à : `http://127.0.0.1:54321`

### 2. Migrations appliquées

Assurez-vous que toutes les migrations sont appliquées :

```bash
supabase db reset
```

### 3. Banque de questions

Les tests utilisent le mécanisme de fallback qui nécessite une banque de questions. Assurez-vous que la table `question_bank` contient au moins quelques questions :

```sql
-- Exemple : insérer des questions de test
INSERT INTO public.question_bank (question, category, intensity, is_active)
VALUES
  ('Qui est le plus sportif ?', 'default', 'normal', true),
  ('Qui est le plus bavard ?', 'default', 'normal', true),
  ('Qui est le plus organisé ?', 'default', 'normal', true),
  ('Qui est le plus aventureux ?', 'default', 'epice', true);
```

---

## 🚀 Installation

Installer les dépendances du package de tests :

```bash
cd packages/tests
npm install
```

---

## 🛠️ Configuration

### Variables d'environnement

Les variables sont déjà configurées dans `vitest.config.ts` avec les valeurs par défaut de Supabase local :

- `SUPABASE_URL` : `http://127.0.0.1:54321`
- `SUPABASE_ANON_KEY` : Clé anon par défaut de Supabase local
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service_role par défaut de Supabase local

Si votre configuration locale est différente, créez un fichier `.env.test` :

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=votre_clé_anon
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role
```

### Fonction Time-Travel

La fonction `test_advance_time()` sera automatiquement injectée lors du setup des tests.

**Si l'injection automatique échoue**, vous devez l'injecter manuellement via le SQL Editor de Supabase Studio (`http://127.0.0.1:54323`) :

```sql
CREATE OR REPLACE FUNCTION public.test_advance_time(days int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_interval interval;
BEGIN
  -- Calculer l'intervalle
  v_interval := days || ' days';

  -- Avancer target_date dans daily_slots
  UPDATE public.daily_slots
  SET target_date = target_date + v_interval::interval;

  -- Avancer cycle_eligible_at dans group_members
  UPDATE public.group_members
  SET cycle_eligible_at = cycle_eligible_at + v_interval::interval;

  -- Avancer created_at dans daily_questions
  UPDATE public.daily_questions
  SET created_at = created_at + v_interval::interval,
      revealed_at = CASE
        WHEN revealed_at IS NOT NULL THEN revealed_at + v_interval::interval
        ELSE NULL
      END;

  -- Avancer activated_at dans daily_slots
  UPDATE public.daily_slots
  SET activated_at = CASE
        WHEN activated_at IS NOT NULL THEN activated_at + v_interval::interval
        ELSE NULL
      END,
      admin_replaced_at = CASE
        WHEN admin_replaced_at IS NOT NULL THEN admin_replaced_at + v_interval::interval
        ELSE NULL
      END;

  -- Log pour débogage
  RAISE NOTICE 'Advanced time by % days', days;
END;
$$;

GRANT EXECUTE ON FUNCTION public.test_advance_time(int) TO authenticated, service_role;
```

---

## 🧪 Lancer les tests

### Tous les tests

```bash
npm test
```

### Tests E2E uniquement

```bash
npm run test:e2e
```

### Mode watch (re-exécution automatique)

```bash
npm run test:watch
```

### Interface UI Vitest

```bash
npm run test:ui
```

Puis ouvrir : `http://localhost:51204/__vitest__/`

---

## 📊 Structure des tests

Le fichier `e2e/cycles.test.ts` couvre **6 sections principales** :

### A. Setup & Guardrail (Minimum 2 soumissions)

- ✅ Création du groupe par Alice
- ✅ Soumission de question par Alice
- ✅ Bob et Charlie rejoignent (Pregame)
- ✅ Guardrail : activation bloquée avec 1 seule soumission
- ✅ Bob soumet sa question → Guardrail satisfait
- ✅ Activation réussie

### B. Déroulement Normal (Votes & Reveal)

- ✅ Alice, Bob, Charlie votent
- ✅ RLS : Alice ne peut pas voter 2 fois
- ✅ Révélation de la question
- ✅ Vérification des résultats

### C. Time-Travel & Fallback (Oubli de soumission)

- ✅ Charlie ne soumet pas de question
- ✅ Avancer le temps de 1 jour (time-travel)
- ✅ Activation du slot de Bob (Jour 2)
- ✅ Avancer au Jour 3 (tour de Charlie)
- ✅ Fallback activé : question de la banque
- ✅ Les membres peuvent voter malgré le fallback

### D. Waitlist (Ajout de membre en cours de cycle)

- ✅ Diana rejoint pendant le Cycle 1
- ✅ Diana en liste d'attente (`cycle_eligible_at` futur)
- ✅ Diana ne peut PAS obtenir de slot dans le Cycle 1
- ✅ Fin du Cycle 1 → Génération du Cycle 2
- ✅ Diana obtient un slot dans le Cycle 2
- ✅ Vérification : 4 membres dans le Cycle 2

### E. Modération (Remplacement admin, limite 1/jour)

- ✅ Alice (admin) remplace la question active
- ✅ Vérification : `admin_replaced_at` et `admin_replaced_by`
- ✅ Alice essaie de remplacer à nouveau → BLOQUÉ (limite 1/jour)
- ✅ Bob (non-admin) ne peut PAS remplacer

### F. Tests de Sécurité RLS

- ✅ Alice ne peut pas soumettre pour le slot de Bob
- ✅ Diana ne peut pas accéder aux données d'un autre groupe

---

## 🔍 Assertions clés

Chaque test utilise des assertions `expect()` rigoureuses :

```typescript
// Exemple : Guardrail
expect(todayQuestion).toBeNull(); // Pas de question si < 2 soumissions

// Exemple : Fallback
expect(todayQuestion.source_type).toBe("bank");
expect(fallbackSlot.status).toBe("fallback");

// Exemple : Waitlist
expect(slotInfo.has_upcoming_slot).toBe(false); // Diana en waitlist
expect(eligibleDate.getTime()).toBeGreaterThan(today.getTime());

// Exemple : RLS
await expect(submitQuestion(...)).rejects.toThrow();
```

---

## 🧹 Cleanup

Les tests nettoient automatiquement les données après chaque exécution :

- **`beforeAll`** : Setup de l'environnement, création des utilisateurs
- **`afterAll`** : Suppression de la fonction time-travel, nettoyage des données

Si les tests échouent et que le cleanup n'est pas exécuté, vous pouvez nettoyer manuellement :

```sql
-- Supprimer la fonction time-travel
DROP FUNCTION IF EXISTS public.test_advance_time(int);

-- Supprimer les données de test
DELETE FROM public.votes WHERE voter_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test-%'
);
DELETE FROM public.user_submissions WHERE submitted_by IN (
  SELECT id FROM auth.users WHERE email LIKE 'test-%'
);
DELETE FROM public.daily_questions;
DELETE FROM public.daily_slots;
DELETE FROM public.group_members;
DELETE FROM public.groups;

-- Supprimer les utilisateurs de test
-- Via Supabase Studio ou API Admin
```

---

## 📈 Couverture de code

Pour générer un rapport de couverture :

```bash
npm test -- --coverage
```

Le rapport HTML sera généré dans `coverage/index.html`.

---

## 🐛 Débogage

### Logs détaillés

Les tests affichent des logs détaillés dans la console :

```
🔧 Setup: Initialisation de l'environnement de test...
✅ Fonction time-travel injectée

👤 Création des utilisateurs de test...
  ✓ Alice créée
  ✓ Bob créé
  ✓ Charlie créé
  ✓ Diana créée

A. Setup & Guardrail (Minimum 2 soumissions)
  ✓ Groupe créé : 123e4567-...
  ✓ Code d'invitation : ABC123
  ✓ Alice a obtenu un slot : 987f6543-...
  ...
```

### Inspecter la base de données

Pendant les tests, vous pouvez ouvrir Supabase Studio (`http://127.0.0.1:54323`) pour inspecter les données en temps réel.

### Mode watch avec breakpoints

Utilisez `npm run test:watch` et ajoutez des `console.log()` ou `debugger` dans le code de test pour investiguer.

---

## 🔗 Liens utiles

- [Vitest Documentation](https://vitest.dev/)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Kiseki Architecture Documentation](../../DOCUMENTATION_SYSTEME_CYCLES.md)

---

## 📝 Ajouter de nouveaux tests

Pour ajouter de nouveaux scénarios, suivez la structure existante :

1. Créez une nouvelle section `describe()`
2. Utilisez les helpers dans `utils/test-helpers.ts`
3. Ajoutez des assertions `expect()` claires
4. Documentez les cas de test avec des commentaires

Exemple :

```typescript
describe("G. Nouveau scénario", () => {
  test("G1. Description du test", async () => {
    // Setup
    const slotInfo = await getMyNextSlot(userA.client, groupId);

    // Action
    await submitQuestion(userA.client, slotInfo.slot_id, groupId, "Question test");

    // Assertion
    const updatedSlotInfo = await getMyNextSlot(userA.client, groupId);
    expect(updatedSlotInfo.has_submission).toBe(true);

    console.log(`  ✓ Test réussi`);
  });
});
```

---

## 🤝 Contribution

Ces tests sont conçus pour être maintenus par l'équipe QA. Avant de modifier :

1. Assurez-vous que tous les tests existants passent
2. Documentez les nouvelles assertions
3. Respectez la structure des sections A-F
4. Ajoutez des logs explicites pour le débogage

---

**Auteur** : Ingénieur QA Senior - Kiseki
**Version** : 1.0.0
**Date** : 2026-02-16
