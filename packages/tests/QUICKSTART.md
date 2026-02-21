# ⚡ Quick Start - Tests E2E Kiseki

Guide ultra-rapide pour lancer les tests E2E en moins de 5 minutes.

---

## 🎯 Checklist Prérequis

Avant de commencer, vérifiez que vous avez :

- [ ] Supabase CLI installé (`npm install -g supabase`)
- [ ] Instance Supabase locale démarrée (`supabase start`)
- [ ] Migrations appliquées (`supabase db reset`)
- [ ] Au moins 3-4 questions dans `question_bank`

---

## 🚀 Installation en 3 étapes

### 1. Installer les dépendances

```bash
cd packages/tests
npm install
```

### 2. Injecter la fonction time-travel (si nécessaire)

Ouvrir Supabase Studio : `http://127.0.0.1:54323`

Aller dans **SQL Editor** et exécuter :

```sql
CREATE OR REPLACE FUNCTION public.test_advance_time(days int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_interval interval;
BEGIN
  v_interval := days || ' days';
  UPDATE public.daily_slots SET target_date = target_date + v_interval::interval;
  UPDATE public.group_members SET cycle_eligible_at = cycle_eligible_at + v_interval::interval;
  UPDATE public.daily_questions SET created_at = created_at + v_interval::interval,
    revealed_at = CASE WHEN revealed_at IS NOT NULL THEN revealed_at + v_interval::interval ELSE NULL END;
  UPDATE public.daily_slots SET activated_at = CASE WHEN activated_at IS NOT NULL THEN activated_at + v_interval::interval ELSE NULL END,
    admin_replaced_at = CASE WHEN admin_replaced_at IS NOT NULL THEN admin_replaced_at + v_interval::interval ELSE NULL END;
  RAISE NOTICE 'Advanced time by % days', days;
END;
$$;
GRANT EXECUTE ON FUNCTION public.test_advance_time(int) TO authenticated, service_role;
```

**Note** : La fonction sera aussi tentée d'être injectée automatiquement lors du `beforeAll()`.

### 3. Lancer les tests

```bash
npm test
```

---

## 📊 Sortie Attendue

```
🔧 Setup: Initialisation de l'environnement de test...

✅ Fonction time-travel injectée

👤 Création des utilisateurs de test...
  ✓ Alice créée
  ✓ Bob créé
  ✓ Charlie créé
  ✓ Diana créée

 ✓ e2e/cycles.test.ts (30 tests) 12345ms

 A. Setup & Guardrail (Minimum 2 soumissions)
   ✓ A1. Alice crée un groupe et obtient un slot immédiatement
   ✓ A2. Alice soumet sa question
   ✓ A3. Bob rejoint le groupe (Pregame) et obtient un slot
   ✓ A4. Charlie rejoint le groupe (Pregame) et obtient un slot
   ✓ A5. Tentative d'activation avec 1 seule soumission → BLOQUÉ par guardrail
   ✓ A6. Bob soumet sa question → Guardrail satisfait
   ✓ A7. Activation réussie → La question d'Alice devient active

 B. Déroulement Normal (Votes & Reveal)
   ✓ B1. Récupérer la question active
   ✓ B2. Alice vote pour Bob
   ✓ B3. Bob vote pour Alice
   ✓ B4. Charlie vote pour Bob
   ✓ B5. RLS : Alice ne peut pas voter une 2e fois
   ✓ B6. RLS : Alice a voté exactement 1 fois
   ✓ B7. Révélation de la question → status passe à 'revealed'
   ✓ B8. Vérifier les résultats du vote

 C. Time-Travel & Fallback (Oubli de soumission)
   ✓ C1. Charlie ne soumet PAS de question
   ✓ C2. Avancer le temps de 1 jour (Time-Travel)
   ✓ C3. Activation du slot de Bob (Jour 2) → Sa question apparaît
   ✓ C4. Avancer le temps de 1 jour (Jour 3 → Tour de Charlie)
   ✓ C5. Activation → Fallback car Charlie n'a pas soumis
   ✓ C6. Les membres peuvent voter malgré le fallback

 D. Waitlist (Ajout de membre en cours de cycle)
   ✓ D1. Diana rejoint le groupe pendant le Cycle 1
   ✓ D2. Diana est en liste d'attente (cycle_eligible_at futur)
   ✓ D3. Diana ne peut PAS obtenir de slot dans le Cycle 1
   ✓ D4. Fin du Cycle 1 → Génération du Cycle 2 avec Diana
   ✓ D5. Diana obtient maintenant un slot dans le Cycle 2
   ✓ D6. Vérifier que les 4 membres ont des slots dans le Cycle 2

 E. Modération (Remplacement admin, limite 1/jour)
   ✓ E1. Récupérer la question active du Cycle 2
   ✓ E2. Alice (admin) remplace la question
   ✓ E3. Vérifier que le slot a été marqué (admin_replaced_at)
   ✓ E4. Alice essaie de remplacer à nouveau → BLOQUÉ (limite 1/jour)
   ✓ E5. Bob (non-admin) ne peut PAS remplacer la question

 F. Tests de Sécurité RLS
   ✓ F1. Alice ne peut pas soumettre pour le slot de Bob
   ✓ F2. RLS : Votes accessibles (contrôle UI pour le reveal)
   ✓ F3. RLS : Diana ne peut pas accéder aux slots d'un autre groupe

🧹 Cleanup: Nettoyage de l'environnement de test...

✅ Cleanup terminé

Test Files  1 passed (1)
     Tests  30 passed (30)
  Start at  10:30:45
  Duration  12.34s
```

---

## 🐛 En cas d'erreur

### Erreur : "Function test_advance_time does not exist"

**Solution** : Exécuter manuellement le SQL de la fonction (étape 2 ci-dessus).

### Erreur : "Connection refused 127.0.0.1:54321"

**Solution** : Vérifier que Supabase local est démarré :

```bash
supabase status
```

Si pas démarré :

```bash
supabase start
```

### Erreur : "No questions available in question_bank"

**Solution** : Insérer des questions de test :

```sql
INSERT INTO public.question_bank (question, category, intensity, is_active)
VALUES
  ('Qui est le plus sportif ?', 'default', 'normal', true),
  ('Qui est le plus bavard ?', 'default', 'normal', true),
  ('Qui est le plus organisé ?', 'default', 'normal', true);
```

### Tests qui échouent après une exécution précédente

**Solution** : Nettoyer manuellement la base de données :

```bash
supabase db reset
```

Puis relancer :

```bash
npm test
```

---

## 🎨 Options avancées

### Mode UI (interface graphique)

```bash
npm run test:ui
```

Ouvrir : `http://localhost:51204/__vitest__/`

### Mode watch (re-exécution automatique)

```bash
npm run test:watch
```

### Filtrer les tests

```bash
npm test -- --grep "Guardrail"        # Exécuter seulement les tests de guardrail
npm test -- --grep "Waitlist"         # Exécuter seulement les tests de waitlist
```

### Rapport de couverture

```bash
npm test -- --coverage
```

Ouvrir : `coverage/index.html`

---

## 📚 Documentation complète

Pour plus de détails :

- **README.md** : Documentation utilisateur complète
- **ARCHITECTURE.md** : Architecture interne et patterns
- **DOCUMENTATION_SYSTEME_CYCLES.md** : Documentation du système de cycles (racine du projet)

---

## ✅ Checklist Post-Exécution

Après avoir lancé les tests, vérifiez :

- [ ] Tous les tests sont passés (30/30 ✓)
- [ ] Aucune erreur dans la console
- [ ] Le cleanup a été exécuté (message "Cleanup terminé")
- [ ] La fonction `test_advance_time` a été supprimée (optionnel : vérifier dans Supabase Studio)

---

## 🆘 Support

En cas de problème persistant :

1. Vérifier les logs détaillés dans la console
2. Inspecter la base de données dans Supabase Studio (`http://127.0.0.1:54323`)
3. Consulter `ARCHITECTURE.md` pour comprendre le fonctionnement interne
4. Ajouter des `console.log()` dans les tests pour déboguer

---

**Prêt à tester !** 🚀

Temps estimé pour la première exécution : **~12-15 secondes**
