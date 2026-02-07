# TODO — Kiseki

## Backend / Supabase

- [x] **Cron reveal des questions** : pg_cron job `reveal-expired-questions` tourne chaque minute. Fonction `reveal_expired_questions()` passe les `daily_questions` de `"active"` a `"revealed"` quand `CURRENT_TIME >= group.reveal_time`.

- [x] **Service `getQuestionResults()`** : Methode implementee dans `packages/core/src/services/votes.ts`. Fetch les votes avec profils voter/target, agrege par target, inclut les `context_notes` comme commentaires. Le State D de `group-detail-screen.tsx` utilise les vrais resultats.

- [x] **nbJoueursMax** : `max_members` defaut 12 en base + contrainte CHECK `BETWEEN 1 AND 12` + defaut 12 dans `createGroup()`. La RPC `join_group_by_code` verifie deja la limite avant insertion.

- [ ] **execo** : Gérer l'égalité dans les votes.

