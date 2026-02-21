# 🚀 Guide d'Installation Complet - Tests E2E Kiseki

Ce guide vous accompagne pas à pas pour installer et exécuter la suite de tests E2E.

---

## 📋 Prérequis Système

Avant de commencer, vérifiez que vous avez :

- [x] **Node.js** ≥ 20.x installé
- [x] **npm** ≥ 10.x installé
- [ ] **Docker** installé et en cours d'exécution
- [ ] **Supabase CLI** installé

---

## 📦 Étape 1 : Installer Docker

### Sur Ubuntu/Debian

```bash
# Installer Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Démarrer Docker
sudo systemctl start docker
sudo systemctl enable docker

# Ajouter votre utilisateur au groupe docker (éviter sudo)
sudo usermod -aG docker $USER

# IMPORTANT : Redémarrer votre session (logout/login) ou exécuter :
newgrp docker

# Vérifier l'installation
docker --version
docker-compose --version
```

### Sur macOS

```bash
# Via Homebrew
brew install --cask docker

# Ouvrir Docker Desktop
open -a Docker

# Attendre que Docker démarre (icône dans la barre de menu)
```

### Sur Windows (WSL2)

```bash
# Installer Docker Desktop pour Windows
# https://docs.docker.com/desktop/install/windows-install/

# Dans WSL2, vérifier :
docker --version
```

---

## 🛠️ Étape 2 : Installer Supabase CLI

### Méthode 1 : Via npm (Recommandé)

```bash
npm install -g supabase
```

### Méthode 2 : Via Homebrew (macOS/Linux)

```bash
brew install supabase/tap/supabase
```

### Méthode 3 : Via script d'installation (Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/supabase/supabase/master/docker/supabase-cli.sh | bash
```

### Vérifier l'installation

```bash
supabase --version
# Sortie attendue : supabase version 1.x.x
```

---

## 🗄️ Étape 3 : Initialiser Supabase Local

### 3.1 Naviguer vers le projet

```bash
cd /home/wassim/Documents/Etudes/BTS_SIO2/Projet/template-monorepo-react
```

### 3.2 Vérifier si Supabase est déjà initialisé

```bash
ls -la supabase/
```

Si vous voyez un dossier `supabase/` avec un fichier `config.toml`, passez à l'étape 3.4.

### 3.3 Initialiser Supabase (si nécessaire)

```bash
supabase init
```

### 3.4 Démarrer Supabase Local

```bash
supabase start
```

**⏳ Première exécution** : Cela peut prendre 5-10 minutes (téléchargement des images Docker).

**Sortie attendue** :

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **Supabase est maintenant en cours d'exécution !**

### 3.5 Vérifier l'accès

```bash
curl http://127.0.0.1:54321/rest/v1/
```

**Sortie attendue** : Un message JSON (peut contenir une erreur, c'est normal).

---

## 🗃️ Étape 4 : Appliquer les Migrations

### 4.1 Vérifier les migrations existantes

```bash
ls supabase/migrations/
```

Vous devriez voir plusieurs fichiers SQL numérotés (001_, 002_, etc.).

### 4.2 Appliquer toutes les migrations

```bash
supabase db reset
```

**Attention** : Cela réinitialise la base de données locale et applique toutes les migrations.

**Sortie attendue** :

```
Applying migration 001_initial_schema.sql...
Applying migration 002_rls_hardening.sql...
Applying migration 003_rls_hardening_rollback.sql...
...
Database reset complete.
```

---

## 📚 Étape 5 : Peupler la Banque de Questions

Les tests utilisent le mécanisme de fallback qui nécessite des questions dans `question_bank`.

### 5.1 Ouvrir Supabase Studio

```bash
# Ouvrir dans le navigateur
open http://127.0.0.1:54323

# OU visiter manuellement : http://127.0.0.1:54323
```

### 5.2 Insérer des questions de test

Dans **SQL Editor**, exécuter :

```sql
INSERT INTO public.question_bank (question, category, intensity, is_active)
VALUES
  ('Qui est le plus sportif ?', 'default', 'normal', true),
  ('Qui est le plus bavard ?', 'default', 'normal', true),
  ('Qui est le plus organisé ?', 'default', 'normal', true),
  ('Qui est le plus aventureux ?', 'default', 'epice', true),
  ('Qui est le plus généreux ?', 'default', 'normal', true),
  ('Qui est le plus créatif ?', 'default', 'normal', true)
ON CONFLICT DO NOTHING;
```

**Vérifier** :

```sql
SELECT COUNT(*) FROM public.question_bank WHERE is_active = true;
```

**Résultat attendu** : Au moins 6 questions.

---

## 🧪 Étape 6 : Installer les Dépendances des Tests

```bash
cd packages/tests
npm install
```

**Sortie attendue** :

```
added 150 packages in 10s
```

---

## 🎯 Étape 7 : Injecter la Fonction Time-Travel (Optionnel)

La fonction sera automatiquement injectée lors du `beforeAll()` des tests, mais vous pouvez le faire manuellement pour éviter les warnings.

### 7.1 Ouvrir SQL Editor dans Supabase Studio

http://127.0.0.1:54323 → **SQL Editor**

### 7.2 Exécuter le SQL

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

**Vérifier** :

```sql
SELECT public.test_advance_time(0);
```

**Résultat attendu** : "Advanced time by 0 days" dans les logs.

---

## 🚀 Étape 8 : Lancer les Tests !

### Option 1 : Via npm

```bash
cd packages/tests
npm test
```

### Option 2 : Via le script shell (depuis la racine)

```bash
cd ../..
./run-e2e-tests.sh
```

### Option 3 : Mode UI (Interface graphique)

```bash
cd packages/tests
npm run test:ui
```

Puis ouvrir : http://localhost:51204/__vitest__/

---

## 📊 Résultat Attendu

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
   ✓ A5. Tentative d'activation avec 1 seule soumission → BLOQUÉ
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
   ✓ E4. Alice essaie de remplacer à nouveau → BLOQUÉ
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

PASS  Waiting for file changes...
```

---

## ✅ Checklist de Vérification

Après l'exécution, vérifiez :

- [ ] 30/30 tests passés
- [ ] Aucune erreur dans la console
- [ ] Durée d'exécution : 10-20 secondes
- [ ] Message "Cleanup terminé" affiché

---

## 🔧 Troubleshooting

### Erreur : "Connection refused 127.0.0.1:54321"

**Solution** :
```bash
supabase status
# Si "not running" :
supabase start
```

### Erreur : "Function test_advance_time does not exist"

**Solution** : Exécuter manuellement le SQL de l'étape 7.2.

### Erreur : "No questions available in question_bank"

**Solution** : Exécuter le SQL de l'étape 5.2.

### Tests qui échouent après une exécution précédente

**Solution** :
```bash
supabase db reset
# Puis réinsérer les questions (étape 5.2)
npm test
```

### Docker n'est pas en cours d'exécution

**Solution** :
```bash
sudo systemctl start docker
# OU sur macOS : ouvrir Docker Desktop
```

---

## 🎓 Commandes Utiles

```bash
# Vérifier Supabase
supabase status

# Arrêter Supabase
supabase stop

# Redémarrer Supabase
supabase stop && supabase start

# Réinitialiser la DB
supabase db reset

# Voir les logs
supabase db logs

# Ouvrir Studio
open http://127.0.0.1:54323
```

---

## 📚 Prochaines Étapes

Une fois les tests réussis, vous pouvez :

1. **Explorer les tests** : Lire `packages/tests/e2e/cycles.test.ts`
2. **Modifier les tests** : Ajouter de nouveaux scénarios
3. **Intégrer en CI/CD** : Ajouter dans GitHub Actions
4. **Mode watch** : `npm run test:watch` pour développement

---

**Bon courage ! 🚀**

Si vous rencontrez des problèmes, consultez `packages/tests/README.md` ou `TESTING.md`.
