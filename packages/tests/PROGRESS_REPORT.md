# 📊 Test Suite Progress Report

**Statut actuel** : ~18/35 tests réussis (51% - estimation basée sur la dernière exécution partielle)

**Dernier test réussi** : 2026-02-16 19:45 UTC

---

## ✅ Problèmes Résolus

### 1. Création de Profils (Contrainte de Clé Dupliquée)
**Problème** : Le trigger `on_auth_user_created` créait automatiquement un profil, causant un conflit lors de l'INSERT manuel.

**Solution** : Modifié `createTestUser()` pour :
- Vérifier et supprimer les utilisateurs existants avant création
- Utiliser `UPSERT` au lieu d'`UPDATE` pour garantir l'existence du profil
- Augmenté le délai d'attente de 100ms à 300ms pour le trigger

**Fichier** : `packages/tests/utils/supabase-test-client.ts:35-75`

### 2. Time-Travel - Contrainte Unique (group_id, target_date)
**Problème** : Lors du déplacement des dates avec `UPDATE SET target_date = target_date + interval`, les dates intermédiaires créaient des collisions sur la contrainte unique.

**Solution** : Technique du "double décalage" :
```sql
-- Déplacer temporairement dans le futur lointain (+10000 jours)
UPDATE public.daily_slots SET target_date = target_date + interval '10000 days';
-- Puis ramener à la date cible
UPDATE public.daily_slots SET target_date = target_date - interval '10000 days' + v_interval;
```

**Fichiers** :
- `packages/tests/sql/time-travel-function.sql:36-40`
- `packages/tests/utils/time-travel.ts:22-27`

### 3. RLS Bloquant les UPDATE de Time-Travel
**Problème** : Les politiques RLS exigeaient des clauses WHERE, bloquant les UPDATE globaux.

**Solution** : Désactivation temporaire de RLS pendant l'exécution de `test_advance_time()` :
```sql
ALTER TABLE public.daily_slots DISABLE ROW LEVEL SECURITY;
-- ... opérations ...
ALTER TABLE public.daily_slots ENABLE ROW LEVEL SECURITY;
```

**Fichier** : `packages/tests/sql/time-travel-function.sql:32-70`

### 4. Activation de Questions - Décalage de Dates
**Problème Fondamental** :
- `generate_future_slots()` génère toujours des slots à partir de `CURRENT_DATE + 1` (demain)
- `activate_daily_slots()` cherche des slots avec `target_date = CURRENT_DATE` (aujourd'hui)
- Impossible de faire correspondre les dates car `CURRENT_DATE` PostgreSQL est fixe

**Solution** : Repositionnement manuel des slots avant activation dans le test :
```typescript
// Récupérer tous les slots du cycle
const { data: slots } = await serviceClient
  .from("daily_slots")
  .select("id, slot_order")
  .eq("group_id", groupId)
  .eq("cycle_number", 1);

// Repositionner chaque slot pour que le premier soit aujourd'hui
for (const slot of slots) {
  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() + slot.slot_order);
  await serviceClient
    .from("daily_slots")
    .update({ target_date: targetDate.toISOString().split('T')[0] })
    .eq("id", slot.id);
}
```

**Fichier** : `packages/tests/e2e/cycles.test.ts:246-268`

---

## ✅ Tests Réussis (Section A & B)

### Section A : Setup & Guardrail
- ✅ A1. Alice crée un groupe et obtient un slot immédiatement
- ✅ A2. Alice soumet sa question
- ✅ A3. Bob rejoint le groupe (Pregame) et obtient un slot
- ✅ A4. Charlie rejoint le groupe (Pregame) et obtient un slot
- ✅ A5. Tentative d'activation avec 1 seule soumission → BLOQUÉ
- ✅ A6. Bob soumet sa question → Guardrail satisfait (2+ soumissions)
- ✅ A7. Activation réussie → La question d'Alice devient active

### Section B : Déroulement Normal
- ✅ B1. Récupérer la question active
- ✅ B2. Alice vote pour Bob
- ✅ B3. Bob vote pour Alice
- ⚠️ B4-B8. Tests de vote et révélation (en cours de vérification)

---

## ⚠️ Problèmes Restants

### 1. Section C : Time-Travel & Fallback
**Problème** : Les tests utilisent `advanceTime()` qui déplace les dates vers le futur, mais `CURRENT_DATE` reste fixe.

**Impact** :
- C2. ❌ Avancer de 1 jour ne rend pas le slot de Bob activable
- C3. ❌ L'activation ne trouve pas de slot pour aujourd'hui
- C5. ❌ Le fallback ne se déclenche pas

**Solution Proposée** : Appliquer la même technique de repositionnement que pour A7 dans chaque test qui avance le temps.

### 2. Section D : Waitlist
**Problème** : `cycle_eligible_at` n'est pas correctement avancé par `advanceTime()` ou les tests attendent des comportements différents.

**Tests Affectés** :
- D2. ❌ Vérification de `cycle_eligible_at` futur
- D3. ❌ Diana ne devrait pas obtenir de slot dans Cycle 1
- D4-D6. ❌ Génération du Cycle 2 avec Diana

### 3. Section E : Modération (admin_replace_question)
**Problème Critique** : `admin_replace_question` n'est pas dans le cache de schéma Supabase.

**Erreur** :
```
Could not find the function public.admin_replace_question(p_group_id) in the schema cache
```

**Cause** : Migration 006-008 appliquées manuellement via `psql` au lieu de `supabase db reset`. Supabase n'a pas rafraîchi son cache de schéma.

**Solution** : Exécuter `npx supabase db reset` pour forcer le rechargement du schéma.

### 4. Section F : RLS Sécurité
**Tests Partiellement Réussis** :
- ✅ F1. Alice ne peut pas soumettre pour le slot de Bob
- ⚠️ F2. Skipped (pas de question active pour tester)
- ✅ F3. Diana ne peut pas accéder aux slots d'un autre groupe

---

## 📝 Actions Recommandées (Par Ordre de Priorité)

### Priorité 1 : Fixer le Schema Cache (Section E)
```bash
cd /home/wassim/Documents/Etudes/BTS_SIO2/Projet/template-monorepo-react
npx supabase db reset
```
Puis réinsérer les questions dans `question_bank` (voir `INSTALLATION_GUIDE.md` étape 5.2).

### Priorité 2 : Généraliser la Solution de Repositionnement des Slots
Créer une fonction helper `repositionSlotsToToday(groupId, cycleNumber)` et l'appliquer avant chaque test qui nécessite l'activation :
- Avant C3 (Activation du slot de Bob)
- Avant C5 (Activation fallback de Charlie)
- Avant D4 (Fin du Cycle 1)
- Avant E1 (Récupérer question active Cycle 2)

### Priorité 3 : Revoir la Logique Waitlist (Section D)
Vérifier si le test attend le bon comportement ou si l'implémentation de `cycle_eligible_at` a des bugs.

### Priorité 4 : Tests Optionnels
Vérifier et corriger les tests "optionnels" comme B6 (vote pour soi-même).

---

## 🎯 Objectif Final

**Cible** : 35/35 tests réussis (100%)

**Chemin Critique** :
1. Fixer schema cache → Débloque Section E (5 tests)
2. Généraliser repositionnement → Débloque Section C (6 tests)
3. Revoir Waitlist → Débloque Section D (6 tests)
4. Affiner RLS → Débloque Section F (3 tests)

**Estimation** : ~4-6 heures de travail supplémentaire pour atteindre 35/35.

---

## 📚 Ressources Techniques

### Fichiers Clés Modifiés
- `packages/tests/utils/supabase-test-client.ts` (profil upsert + cleanup)
- `packages/tests/sql/time-travel-function.sql` (double offset + RLS)
- `packages/tests/utils/time-travel.ts` (double offset + RLS)
- `packages/tests/e2e/cycles.test.ts` (repositionnement slots A7)

### Documentation Connexe
- `INSTALLATION_GUIDE.md` - Installation complète
- `TESTING.md` - Architecture des tests
- `DOCUMENTATION_SYSTEME_CYCLES.md` - Explication du système Round-Robin

### Commandes Utiles
```bash
# Réinitialiser Supabase local
npx supabase db reset

# Supprimer et recréer time-travel
docker exec supabase_db_template-monorepo-react psql -U postgres -d postgres -c "DROP FUNCTION IF EXISTS public.test_advance_time(int);"
cat packages/tests/sql/time-travel-function.sql | docker exec -i supabase_db_template-monorepo-react psql -U postgres -d postgres

# Vérifier les slots
docker exec supabase_db_template-monorepo-react psql -U postgres -d postgres -c "SELECT id, target_date, status FROM public.daily_slots ORDER BY target_date LIMIT 5;"
```

---

**Rapport généré le** : 2026-02-16 19:50 UTC
**Par** : Claude Sonnet 4.5 (Assistant QA)
