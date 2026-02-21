# 🧪 Guide de Tests - Kiseki

Ce document centralise toute la documentation liée aux tests du projet Kiseki.

---

## 📚 Documentation Principale

### 1. [DOCUMENTATION_SYSTEME_CYCLES.md](./DOCUMENTATION_SYSTEME_CYCLES.md)
**📖 Documentation Système Complète (~800 lignes)**

Documentation exhaustive du système de cycles Round-Robin :
- Architecture des données (tables, relations)
- Algorithmes détaillés (Round-Robin, Fisher-Yates shuffle)
- Flux complets avec diagrammes
- Règles métier et contraintes
- Cas d'usage et scénarios

**👉 À lire en premier pour comprendre le système**

---

### 2. [TEST_SUITE_DELIVERY.md](./TEST_SUITE_DELIVERY.md)
**📦 Document de Livraison de la Suite de Tests**

Récapitulatif complet de la livraison :
- Objectifs et couverture
- Structure des fichiers livrés
- Métriques et statistiques
- Technologies utilisées
- Checklist de livraison

**👉 À lire pour avoir une vue d'ensemble de la suite de tests**

---

## 🧪 Suite de Tests E2E

📂 **Localisation** : `packages/tests/`

### Documentation des Tests

1. **[packages/tests/README.md](./packages/tests/README.md)** ⭐
   - Guide complet d'utilisation
   - Prérequis et installation
   - Instructions d'exécution
   - Débogage et troubleshooting

2. **[packages/tests/QUICKSTART.md](./packages/tests/QUICKSTART.md)** ⚡
   - Guide express (5 minutes)
   - Installation en 3 étapes
   - Commandes essentielles
   - Résolution rapide des erreurs

3. **[packages/tests/ARCHITECTURE.md](./packages/tests/ARCHITECTURE.md)** 🏗️
   - Architecture technique interne
   - Patterns de test (Guardrail, Fallback, Waitlist, RLS)
   - Guide de maintenance

4. **[packages/tests/VISUAL_ARCHITECTURE.md](./packages/tests/VISUAL_ARCHITECTURE.md)** 🎨
   - Diagrammes ASCII de l'architecture
   - Flux visuels des tests
   - State machines
   - Matrices de couverture

---

## 🚀 Quick Start

### Option 1 : Script Shell (Recommandé)

```bash
# À la racine du projet
./run-e2e-tests.sh              # Exécution standard
./run-e2e-tests.sh --ui         # Interface graphique
./run-e2e-tests.sh --watch      # Mode watch
./run-e2e-tests.sh --coverage   # Avec couverture
```

### Option 2 : Commandes npm

```bash
cd packages/tests
npm install
npm test
```

### Prérequis

1. **Supabase local en cours d'exécution**
   ```bash
   supabase start
   ```

2. **Migrations appliquées**
   ```bash
   supabase db reset
   ```

3. **Banque de questions peuplée**
   ```sql
   INSERT INTO question_bank (question, category, intensity, is_active)
   VALUES ('Qui est le plus drôle ?', 'default', 'normal', true);
   ```

---

## 📊 Couverture

La suite de tests couvre **6 sections principales** avec **30 tests** :

| Section | Tests | Couverture |
|---------|-------|------------|
| A. Setup & Guardrail | 7 | Création groupe, guardrail 2 soumissions |
| B. Déroulement Normal | 8 | Votes, reveal, RLS |
| C. Time-Travel & Fallback | 6 | Simulation temps, fallback auto |
| D. Waitlist | 6 | Ajout membre, éligibilité, cycle 2 |
| E. Modération | 5 | Remplacement admin, limite 1/jour |
| F. Sécurité RLS | 3 | Isolation slots, groupes, votes |

**Total** : 30 tests • Durée : ~12-15s

---

## 🛠️ Structure du Projet de Tests

```
packages/tests/
├── e2e/
│   └── cycles.test.ts                    # Suite complète (30 tests)
│
├── utils/
│   ├── supabase-test-client.ts          # Clients Supabase
│   ├── time-travel.ts                    # Machine à voyager dans le temps
│   └── test-helpers.ts                   # Helpers pour opérations courantes
│
├── sql/
│   └── time-travel-function.sql          # Fonction SQL (backup manuel)
│
├── vitest.config.ts                      # Configuration Vitest
├── package.json                          # Dépendances
│
└── Documentation/
    ├── README.md                         # Guide principal
    ├── QUICKSTART.md                     # Guide express
    ├── ARCHITECTURE.md                   # Architecture technique
    └── VISUAL_ARCHITECTURE.md            # Diagrammes visuels
```

---

## 🔍 Tests Clés

### Test du Guardrail

```typescript
// Activation bloquée avec 1 seule soumission
await submitQuestion(userA.client, slotA, groupId, "Question A");
await activateDailySlots(serviceClient);
expect(await getTodayQuestion(groupId)).toBeNull(); // ❌ Bloqué

// Activation réussie avec 2+ soumissions
await submitQuestion(userB.client, slotB, groupId, "Question B");
await activateDailySlots(serviceClient);
expect(await getTodayQuestion(groupId)).not.toBeNull(); // ✅ OK
```

### Test Time-Travel & Fallback

```typescript
// Charlie n'a pas soumis de question
await advanceTime(serviceClient, 1); // Avancer de 1 jour
await activateDailySlots(serviceClient);

const question = await getTodayQuestion(groupId);
expect(question.source_type).toBe("bank"); // ✅ Fallback activé

const slots = await getGroupSlots(groupId);
const fallbackSlot = slots.find(s => s.status === "fallback");
expect(fallbackSlot).toBeDefined(); // ✅ Slot marqué
```

### Test Waitlist

```typescript
// Diana rejoint pendant le Cycle 1
await joinGroupByCode(userD.client, inviteCode);

// Vérifier qu'elle est en waitlist
const slotInfo = await getMyNextSlot(userD.client, groupId);
expect(slotInfo.has_upcoming_slot).toBe(false); // ❌ Pas de slot (Cycle 1)

// Avancer au Cycle 2
await advanceTime(serviceClient, 4);
await activateDailySlots(serviceClient);

const newSlotInfo = await getMyNextSlot(userD.client, groupId);
expect(newSlotInfo.has_upcoming_slot).toBe(true); // ✅ Slot obtenu (Cycle 2)
```

---

## 🔒 Sécurité

⚠️ **ATTENTION** : Ces tests sont conçus EXCLUSIVEMENT pour Supabase LOCAL.

### Protections en place

- ✅ Variables d'environnement codées pour `127.0.0.1:54321`
- ✅ Package marqué `"private": true`
- ✅ Cleanup automatique après chaque exécution
- ✅ Fonction time-travel supprimée après les tests

### ❌ NE JAMAIS

- Exécuter contre une base de données de production
- Déployer le package `@kiseki/tests` en production
- Utiliser la fonction `test_advance_time` en dehors des tests
- Commiter les clés Supabase réelles dans les fichiers

---

## 📈 Métriques

| Métrique | Valeur |
|----------|--------|
| **Fichiers de test** | 12 |
| **Lignes de code** | ~2500 |
| **Documentation** | ~4000 lignes |
| **Tests totaux** | 30 |
| **Durée d'exécution** | 12-15s |
| **Utilisateurs simulés** | 4 |
| **Cycles testés** | 2 |
| **RPCs appelés** | ~30 |

---

## 🤝 Contribution

Pour ajouter de nouveaux tests :

1. Lire `packages/tests/ARCHITECTURE.md` pour comprendre les patterns
2. Créer une nouvelle section `describe()` dans `cycles.test.ts`
3. Utiliser les helpers de `utils/test-helpers.ts`
4. Ajouter des assertions `expect()` claires
5. Documenter les nouveaux scénarios

---

## 🆘 Support

### Documentation

- **Usage** : `packages/tests/README.md`
- **Quick Start** : `packages/tests/QUICKSTART.md`
- **Architecture** : `packages/tests/ARCHITECTURE.md`
- **Système** : `DOCUMENTATION_SYSTEME_CYCLES.md`

### Commandes utiles

```bash
# Vérifier Supabase
supabase status

# Réinitialiser la base de données
supabase db reset

# Ouvrir Supabase Studio
# http://127.0.0.1:54323

# Voir les logs SQL
# Dans Studio: SQL Editor → "Show logs"
```

### En cas d'erreur

1. **Vérifier Supabase** : `supabase status`
2. **Réinitialiser la DB** : `supabase db reset`
3. **Vérifier la banque** : S'assurer qu'il y a des questions
4. **Consulter les logs** : Inspecter la sortie de la console
5. **Mode debug** : Ajouter `console.log()` dans les tests

---

## 🎓 Ressources

### Liens externes

- [Vitest Documentation](https://vitest.dev/)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Supabase Testing Guide](https://supabase.com/docs/guides/getting-started/testing)

### Documentation interne

- [Architecture des données](./DOCUMENTATION_SYSTEME_CYCLES.md#2-architecture-des-données)
- [Système de cycles](./DOCUMENTATION_SYSTEME_CYCLES.md#3-système-de-cycles-round-robin)
- [Soumission de questions](./DOCUMENTATION_SYSTEME_CYCLES.md#4-soumission-de-questions-par-les-utilisateurs)
- [Gestion des membres](./DOCUMENTATION_SYSTEME_CYCLES.md#6-gestion-des-membres-et-de-léligibilité)

---

**Maintenu par** : Équipe QA - Kiseki
**Version** : 1.0.0
**Dernière mise à jour** : 2026-02-16
