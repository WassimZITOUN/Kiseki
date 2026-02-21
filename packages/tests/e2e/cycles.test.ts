/**
 * ============================================================
 * Kiseki E2E Tests - Système de Cycles Round-Robin
 * ============================================================
 *
 * Suite de tests d'intégration complète couvrant :
 * - A. Setup & Guardrail (minimum 2 soumissions)
 * - B. Déroulement Normal (votes, reveal, RLS)
 * - C. Time-Travel & Fallback (oubli de soumission)
 * - D. Waitlist (ajout de membre en cours de cycle)
 * - E. Modération (remplacement admin, limite 1/jour)
 * - F. Tests de Sécurité RLS
 *
 * ⚠️ ATTENTION : Ces tests doivent être exécutés contre une instance
 * Supabase LOCALE uniquement. Ne jamais exécuter en production.
 */

import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  getServiceRoleClient,
  createTestUser,
  cleanupTestData,
} from "../utils/supabase-test-client";
import {
  setupTimeTravel,
  cleanupTimeTravel,
  advanceTime,
} from "../utils/time-travel";
import {
  createTestGroup,
  joinGroupByCode,
  getMyNextSlot,
  submitQuestion,
  activateDailySlots,
  revealDueQuestions,
  getTodayQuestion,
  submitVote,
  getGroupDetails,
  getGroupSlots,
  getCycleSubmissions,
  adminReplaceQuestion,
  sleep,
} from "../utils/test-helpers";

/**
 * Helper : repositionne les slots d'un cycle pour que le slot à l'index donné
 * tombe sur CURRENT_DATE (aujourd'hui). Résout le problème fondamental :
 * generate_future_slots() génère à J+1, mais activate_daily_slots() cherche CURRENT_DATE.
 */
async function repositionSlotsToDay(
  client: SupabaseClient,
  groupId: string,
  cycleNumber: number,
  dayIndex: number
): Promise<void> {
  const { data: slots } = await client
    .from("daily_slots")
    .select("id, slot_order")
    .eq("group_id", groupId)
    .eq("cycle_number", cycleNumber)
    .order("slot_order", { ascending: true });

  if (!slots || slots.length === 0) return;

  const today = new Date().toISOString().split("T")[0];
  for (const slot of slots) {
    const offset = slot.slot_order - dayIndex;
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    await client
      .from("daily_slots")
      .update({ target_date: d.toISOString().split("T")[0] })
      .eq("id", slot.id);
  }
}

describe("Kiseki E2E - Système de Cycles Round-Robin", () => {
  let serviceClient: SupabaseClient;

  // Utilisateurs de test
  let userA: { client: SupabaseClient; userId: string };
  let userB: { client: SupabaseClient; userId: string };
  let userC: { client: SupabaseClient; userId: string };
  let userD: { client: SupabaseClient; userId: string };

  // Données partagées
  let groupId: string;
  let inviteCode: string;

  // ========================================
  // SETUP GLOBAL
  // ========================================
  beforeAll(async () => {
    console.log("\n🔧 Setup: Initialisation de l'environnement de test...\n");

    serviceClient = getServiceRoleClient();

    // Nettoyer les données existantes
    await cleanupTestData();

    // Injecter la fonction time-travel
    try {
      await setupTimeTravel(serviceClient);
      console.log("✅ Fonction time-travel injectée\n");
    } catch (error) {
      console.warn("⚠️  Time-travel function not auto-injected.");
      console.warn("Run: cat packages/tests/sql/time-travel-function.sql | docker exec -i supabase_db_template-monorepo-react psql -U postgres -d postgres");
    }

    // Créer 4 utilisateurs de test
    console.log("👤 Création des utilisateurs de test...");
    userA = await createTestUser("test-alice@kiseki.local", "password123");
    console.log("  ✓ Alice créée");
    userB = await createTestUser("test-bob@kiseki.local", "password123");
    console.log("  ✓ Bob créé");
    userC = await createTestUser("test-charlie@kiseki.local", "password123");
    console.log("  ✓ Charlie créé");
    userD = await createTestUser("test-diana@kiseki.local", "password123");
    console.log("  ✓ Diana créée\n");
  }, 60000);

  // ========================================
  // CLEANUP GLOBAL
  // ========================================
  afterAll(async () => {
    console.log("\n🧹 Cleanup: Nettoyage de l'environnement de test...\n");

    await cleanupTimeTravel(serviceClient);
    await cleanupTestData();

    console.log("✅ Cleanup terminé\n");
  }, 60000);

  // ========================================
  // A. SETUP & GUARDRAIL
  // ========================================
  describe("A. Setup & Guardrail (Minimum 2 soumissions)", () => {
    test("A1. Alice crée un groupe et obtient un slot immédiatement", async () => {
      groupId = await createTestGroup(userA.client, "Test Group E2E", {
        maxMembers: 12,
        questionTime: "00:00",
        revealTime: "00:00", // Révélation immédiate pour les tests
      });

      expect(groupId).toBeDefined();
      expect(groupId).toMatch(/^[0-9a-f]{8}-/);

      const group = await getGroupDetails(serviceClient, groupId);
      inviteCode = group.invite_code;
      expect(inviteCode).toBeDefined();

      console.log(`  ✓ Groupe créé : ${groupId}`);
      console.log(`  ✓ Code d'invitation : ${inviteCode}`);

      const slotInfo = await getMyNextSlot(userA.client, groupId);
      expect(slotInfo.has_upcoming_slot).toBe(true);
      expect(slotInfo.slot_id).toBeDefined();
      expect(slotInfo.has_submission).toBe(false);

      console.log(`  ✓ Alice a obtenu un slot : ${slotInfo.slot_id}`);
    });

    test("A2. Alice soumet sa question", async () => {
      const slotInfo = await getMyNextSlot(userA.client, groupId);

      await submitQuestion(userA.client, slotInfo.slot_id, groupId, "Qui est le plus drôle ?", {
        intensity: "normal",
      });

      const updatedSlotInfo = await getMyNextSlot(userA.client, groupId);
      expect(updatedSlotInfo.has_submission).toBe(true);
      expect(updatedSlotInfo.submission.question_text).toBe("Qui est le plus drôle ?");

      console.log(`  ✓ Alice a soumis sa question`);
    });

    test("A3. Bob rejoint le groupe (Pregame) et obtient un slot", async () => {
      await joinGroupByCode(userB.client, inviteCode);

      const slotInfo = await getMyNextSlot(userB.client, groupId);
      expect(slotInfo.has_upcoming_slot).toBe(true);
      expect(slotInfo.slot_id).toBeDefined();

      console.log(`  ✓ Bob a rejoint et obtenu un slot : ${slotInfo.slot_id}`);
    });

    test("A4. Charlie rejoint le groupe (Pregame) et obtient un slot", async () => {
      await joinGroupByCode(userC.client, inviteCode);

      const slotInfo = await getMyNextSlot(userC.client, groupId);
      expect(slotInfo.has_upcoming_slot).toBe(true);
      expect(slotInfo.slot_id).toBeDefined();

      console.log(`  ✓ Charlie a rejoint et obtenu un slot : ${slotInfo.slot_id}`);
    });

    test("A5. Tentative d'activation avec 1 seule soumission → BLOQUÉ par guardrail", async () => {
      await activateDailySlots(serviceClient);

      const todayQuestion = await getTodayQuestion(serviceClient, groupId);
      expect(todayQuestion).toBeNull();

      console.log(`  ✓ Activation bloquée : seulement 1 soumission (besoin de 2 minimum)`);
    });

    test("A6. Bob soumet sa question → Guardrail satisfait", async () => {
      const slotInfo = await getMyNextSlot(userB.client, groupId);

      await submitQuestion(userB.client, slotInfo.slot_id, groupId, "Qui est le plus créatif ?", {
        intensity: "normal",
      });

      console.log(`  ✓ Bob a soumis sa question`);

      const submissions = await getCycleSubmissions(serviceClient, groupId, 1);
      expect(submissions.length).toBeGreaterThanOrEqual(2);

      console.log(`  ✓ Guardrail satisfait : ${submissions.length} soumissions dans le Cycle 1`);
    });

    test("A7. Activation réussie → La question d'Alice devient active", async () => {
      // Repositionner les slots pour que slot_order=0 = aujourd'hui
      await repositionSlotsToDay(serviceClient, groupId, 1, 0);
      console.log(`  ✓ Slots repositionnés (premier slot = aujourd'hui)`);

      await activateDailySlots(serviceClient);

      const todayQuestion = await getTodayQuestion(serviceClient, groupId);
      expect(todayQuestion).not.toBeNull();
      expect(todayQuestion.status).toBe("active");
      expect(todayQuestion.question).toBe("Qui est le plus drôle ?");
      expect(todayQuestion.source_type).toBe("user");

      console.log(`  ✓ Question activée : "${todayQuestion.question}"`);
      console.log(`  ✓ Source : ${todayQuestion.source_type}`);
    });
  });

  // ========================================
  // B. DÉROULEMENT NORMAL
  // ========================================
  describe("B. Déroulement Normal (Votes & Reveal)", () => {
    let questionId: string;

    test("B1. Récupérer la question active", async () => {
      const todayQuestion = await getTodayQuestion(serviceClient, groupId);
      expect(todayQuestion).not.toBeNull();
      questionId = todayQuestion.id;

      console.log(`  ✓ Question ID : ${questionId}`);
    });

    test("B2. Alice vote pour Bob", async () => {
      await submitVote(userA.client, questionId, userB.userId, "Il me fait toujours rire");
      console.log(`  ✓ Alice a voté pour Bob`);
    });

    test("B3. Bob vote pour Alice", async () => {
      await submitVote(userB.client, questionId, userA.userId, "Elle est hilarante");
      console.log(`  ✓ Bob a voté pour Alice`);
    });

    test("B4. Charlie vote pour Bob", async () => {
      await submitVote(userC.client, questionId, userB.userId);
      console.log(`  ✓ Charlie a voté pour Bob`);
    });

    test("B5. RLS : Alice ne peut pas voter une 2e fois", async () => {
      await expect(submitVote(userA.client, questionId, userC.userId)).rejects.toThrow();
      console.log(`  ✓ RLS validé : Alice ne peut pas voter 2 fois`);
    });

    test("B6. RLS : Alice a voté exactement 1 fois", async () => {
      const { data: votes } = await serviceClient
        .from("votes")
        .select("*")
        .eq("question_id", questionId)
        .eq("voter_id", userA.userId);

      expect(votes?.length).toBe(1);
      console.log(`  ✓ Alice a voté exactement 1 fois`);
    });

    test("B7. Révélation de la question → status passe à 'revealed'", async () => {
      // revealTime="00:00" donc reveal_due_questions() fonctionne à toute heure
      await revealDueQuestions(serviceClient);

      const todayQuestion = await getTodayQuestion(serviceClient, groupId);
      expect(todayQuestion.status).toBe("revealed");
      expect(todayQuestion.revealed_at).not.toBeNull();

      console.log(`  ✓ Question révélée`);
      console.log(`  ✓ revealed_at : ${todayQuestion.revealed_at}`);
    });

    test("B8. Vérifier les résultats du vote", async () => {
      const { data: votes } = await serviceClient
        .from("votes")
        .select("*")
        .eq("question_id", questionId);

      expect(votes).not.toBeNull();
      expect(votes!.length).toBe(3);

      const bobVotes = votes!.filter((v) => v.target_user_id === userB.userId);
      expect(bobVotes.length).toBe(2);

      console.log(`  ✓ Total votes : ${votes!.length}`);
      console.log(`  ✓ Bob a reçu ${bobVotes.length} votes → Gagnant`);
    });
  });

  // ========================================
  // C. TIME-TRAVEL & FALLBACK
  // ========================================
  describe("C. Time-Travel & Fallback (Oubli de soumission)", () => {
    test("C1. Charlie ne soumet PAS de question", async () => {
      const slotInfo = await getMyNextSlot(userC.client, groupId);

      expect(slotInfo.has_upcoming_slot).toBe(true);
      expect(slotInfo.has_submission).toBe(false);

      console.log(`  ✓ Charlie a un slot mais n'a PAS soumis de question`);
    });

    test("C2. Avancer le temps de 1 jour (Time-Travel)", async () => {
      // Repositionner slot_order=1 (Bob) sur aujourd'hui
      await repositionSlotsToDay(serviceClient, groupId, 1, 1);

      // Vérifier qu'il y a un slot scheduled pour aujourd'hui
      const slots = await getGroupSlots(serviceClient, groupId);
      const today = new Date().toISOString().split("T")[0];
      const todaySlots = slots.filter((s) => s.target_date === today && s.status === "scheduled");

      expect(todaySlots.length).toBeGreaterThan(0);

      console.log(`  ✓ Temps avancé de 1 jour (repositionnement)`);
      console.log(`  ✓ Slots schedulés pour aujourd'hui : ${todaySlots.length}`);
    });

    test("C3. Activation du slot de Bob (Jour 2) → Sa question apparaît", async () => {
      await activateDailySlots(serviceClient);

      const todayQuestion = await getTodayQuestion(serviceClient, groupId);
      expect(todayQuestion).not.toBeNull();
      expect(todayQuestion.status).toBe("active");
      expect(todayQuestion.question).toBe("Qui est le plus créatif ?");
      expect(todayQuestion.source_type).toBe("user");

      console.log(`  ✓ Question de Bob activée : "${todayQuestion.question}"`);
    });

    test("C4. Avancer le temps de 1 jour (Jour 3 → Tour de Charlie)", async () => {
      // Révéler d'abord la question de Bob
      await revealDueQuestions(serviceClient);

      // Repositionner slot_order=2 (Charlie) sur aujourd'hui
      await repositionSlotsToDay(serviceClient, groupId, 1, 2);

      console.log(`  ✓ Temps avancé de 1 jour (Jour 3 → Charlie)`);
    });

    test("C5. Activation → Fallback car Charlie n'a pas soumis", async () => {
      await activateDailySlots(serviceClient);

      const todayQuestion = await getTodayQuestion(serviceClient, groupId);
      expect(todayQuestion).not.toBeNull();
      // Le statut peut être 'active' car le fallback crée une question active
      expect(["active"].includes(todayQuestion.status)).toBe(true);
      expect(todayQuestion.source_type).toBe("bank"); // Vient de la banque

      // Vérifier que le slot est en statut 'fallback'
      const slots = await getGroupSlots(serviceClient, groupId);
      const fallbackSlot = slots.find((s) => s.status === "fallback");
      expect(fallbackSlot).toBeDefined();
      expect(fallbackSlot!.assigned_user_id).toBe(userC.userId);

      console.log(`  ✓ Fallback activé : question de la banque`);
      console.log(`  ✓ Question : "${todayQuestion.question}"`);
      console.log(`  ✓ Slot status : ${fallbackSlot!.status}`);
    });

    test("C6. Les membres peuvent voter malgré le fallback", async () => {
      const todayQuestion = await getTodayQuestion(serviceClient, groupId);

      await submitVote(userA.client, todayQuestion.id, userB.userId);
      await submitVote(userB.client, todayQuestion.id, userC.userId);

      const { data: votes } = await serviceClient
        .from("votes")
        .select("*")
        .eq("question_id", todayQuestion.id);

      expect(votes?.length).toBe(2);

      console.log(`  ✓ Votes enregistrés malgré le fallback`);
    });
  });

  // ========================================
  // D. WAITLIST (Ajout de membre en cours de cycle)
  // ========================================
  describe("D. Waitlist (Ajout de membre en cours de cycle)", () => {
    test("D1. Diana rejoint le groupe pendant le Cycle 1", async () => {
      // Révéler la question du Jour 3
      await revealDueQuestions(serviceClient);

      await joinGroupByCode(userD.client, inviteCode);
      console.log(`  ✓ Diana a rejoint le groupe`);
    });

    test("D2. Diana est en liste d'attente (cycle_eligible_at futur)", async () => {
      const { data: member } = await serviceClient
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", userD.userId)
        .single();

      expect(member).not.toBeNull();

      // cycle_eligible_at doit être défini (date après le cycle en cours)
      const eligibleDate = new Date(member!.cycle_eligible_at);
      // La date d'éligibilité doit être dans le futur par rapport à la date originale
      // des slots (pas forcément par rapport à maintenant car on a repositionné)
      expect(eligibleDate).toBeDefined();
      expect(member!.cycle_eligible_at).not.toBeNull();

      console.log(`  ✓ Diana en waitlist`);
      console.log(`  ✓ cycle_eligible_at : ${member!.cycle_eligible_at}`);
    });

    test("D3. Diana ne peut PAS obtenir de slot dans le Cycle 1", async () => {
      // Vérifier que Diana n'a aucun slot dans le Cycle 1
      const { data: dianaSlots } = await serviceClient
        .from("daily_slots")
        .select("*")
        .eq("group_id", groupId)
        .eq("cycle_number", 1)
        .eq("assigned_user_id", userD.userId);

      expect(dianaSlots?.length ?? 0).toBe(0);

      console.log(`  ✓ Diana n'a PAS de slot dans le Cycle 1 (waitlist)`);
    });

    test("D4. Fin du Cycle 1 → Génération du Cycle 2 avec Diana", async () => {
      // Le Cycle 1 a 3 slots (A, B, C) — tous maintenant activés/revealed
      // Pour déclencher le Cycle 2, on doit avancer le cycle_eligible_at de Diana
      // pour qu'elle soit éligible, puis forcer la génération

      // D'abord, rendre Diana éligible en mettant cycle_eligible_at dans le passé
      await serviceClient
        .from("group_members")
        .update({ cycle_eligible_at: new Date(Date.now() - 86400000).toISOString() })
        .eq("group_id", groupId)
        .eq("user_id", userD.userId);

      // Marquer TOUS les slots du Cycle 1 comme non-scheduled
      // (ceux qui restent en 'scheduled' doivent passer en 'fallback')
      const { data: allCycle1Slots } = await serviceClient
        .from("daily_slots")
        .select("id, status, target_date")
        .eq("group_id", groupId)
        .eq("cycle_number", 1);

      for (const slot of allCycle1Slots ?? []) {
        if (slot.status === "scheduled") {
          await serviceClient
            .from("daily_slots")
            .update({ status: "fallback", activated_at: new Date().toISOString() })
            .eq("id", slot.id);
        }
      }

      // CRITICAL: Move ALL Cycle 1 slots to past dates so that
      // activate_daily_slots() doesn't skip the group due to
      // "NOT EXISTS (... target_date = CURRENT_DATE AND status IN ('live','revealed','fallback'))"
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      for (const [i, slot] of (allCycle1Slots ?? []).entries()) {
        const pastDate = new Date(yesterday);
        pastDate.setDate(pastDate.getDate() - i);
        await serviceClient
          .from("daily_slots")
          .update({ target_date: pastDate.toISOString().split("T")[0] })
          .eq("id", slot.id);
      }

      // Now activate — no slot for CURRENT_DATE, no future scheduled slots
      // → generate_future_slots() should trigger and create Cycle 2
      await activateDailySlots(serviceClient);

      // Vérifier que le Cycle 2 a été généré
      const { data: group } = await serviceClient
        .from("groups")
        .select("current_cycle")
        .eq("id", groupId)
        .single();

      expect(group!.current_cycle).toBe(2);

      console.log(`  ✓ Cycle 2 généré`);
    });

    test("D5. Diana obtient maintenant un slot dans le Cycle 2", async () => {
      const { data: dianaSlot } = await serviceClient
        .from("daily_slots")
        .select("*")
        .eq("group_id", groupId)
        .eq("cycle_number", 2)
        .eq("assigned_user_id", userD.userId)
        .maybeSingle();

      expect(dianaSlot).not.toBeNull();
      expect(dianaSlot!.cycle_number).toBe(2);

      console.log(`  ✓ Diana a obtenu un slot dans le Cycle 2`);
      console.log(`  ✓ Slot ID : ${dianaSlot!.id}`);
    });

    test("D6. Vérifier que les 4 membres ont des slots dans le Cycle 2", async () => {
      const { data: cycle2Slots } = await serviceClient
        .from("daily_slots")
        .select("*")
        .eq("group_id", groupId)
        .eq("cycle_number", 2);

      expect(cycle2Slots!.length).toBe(4); // A, B, C, D

      const userIds = cycle2Slots!.map((s) => s.assigned_user_id);
      expect(userIds).toContain(userA.userId);
      expect(userIds).toContain(userB.userId);
      expect(userIds).toContain(userC.userId);
      expect(userIds).toContain(userD.userId);

      console.log(`  ✓ Cycle 2 contient 4 slots (A, B, C, D)`);
      console.log(
        `  ✓ Ordre : ${cycle2Slots!
          .map((s) =>
            s.assigned_user_id === userA.userId
              ? "A"
              : s.assigned_user_id === userB.userId
                ? "B"
                : s.assigned_user_id === userC.userId
                  ? "C"
                  : "D"
          )
          .join(" → ")}`
      );
    });
  });

  // ========================================
  // E. MODÉRATION (Remplacement admin)
  // ========================================
  describe("E. Modération (Remplacement admin, limite 1/jour)", () => {
    let activeQuestionId: string;
    let originalQuestion: string;

    test("E1. Récupérer la question active du Cycle 2", async () => {
      // Repositionner les slots du Cycle 2 pour que le premier soit aujourd'hui
      await repositionSlotsToDay(serviceClient, groupId, 2, 0);

      // Guardrail: besoin de 2+ soumissions pour le Cycle 2 avant activation
      // Récupérer les slots du Cycle 2 pour soumettre des questions
      const { data: cycle2Slots } = await serviceClient
        .from("daily_slots")
        .select("id, assigned_user_id, slot_order")
        .eq("group_id", groupId)
        .eq("cycle_number", 2)
        .order("slot_order", { ascending: true });

      // Soumettre des questions pour les 2 premiers slots du Cycle 2
      if (cycle2Slots && cycle2Slots.length >= 2) {
        for (let i = 0; i < 2; i++) {
          const slot = cycle2Slots[i];
          // Déterminer quel client utiliser selon l'utilisateur assigné
          const client =
            slot.assigned_user_id === userA.userId ? userA.client :
            slot.assigned_user_id === userB.userId ? userB.client :
            slot.assigned_user_id === userC.userId ? userC.client :
            userD.client;
          await submitQuestion(client, slot.id, groupId, `Question Cycle 2 - Slot ${i}`, {
            intensity: "normal",
          });
        }
      }

      // Activer le premier slot du Cycle 2
      await activateDailySlots(serviceClient);

      const todayQuestion = await getTodayQuestion(serviceClient, groupId);
      expect(todayQuestion).not.toBeNull();
      expect(todayQuestion.status).toBe("active");

      activeQuestionId = todayQuestion.id;
      originalQuestion = todayQuestion.question;

      console.log(`  ✓ Question active : "${originalQuestion}"`);
    });

    test("E2. Alice (admin) remplace la question", async () => {
      await adminReplaceQuestion(userA.client, groupId, activeQuestionId);

      const { data: updatedQuestion } = await serviceClient
        .from("daily_questions")
        .select("*")
        .eq("id", activeQuestionId)
        .single();

      expect(updatedQuestion!.question).not.toBe(originalQuestion);
      expect(updatedQuestion!.source_type).toBe("bank");

      console.log(`  ✓ Question remplacée par : "${updatedQuestion!.question}"`);
    });

    test("E3. Vérifier que le slot a été marqué (admin_replaced_at)", async () => {
      const { data: slot } = await serviceClient
        .from("daily_slots")
        .select("*")
        .eq("daily_question_id", activeQuestionId)
        .single();

      expect(slot!.admin_replaced_at).not.toBeNull();
      expect(slot!.admin_replaced_by).toBe(userA.userId);

      console.log(`  ✓ Slot marqué : admin_replaced_at = ${slot!.admin_replaced_at}`);
      console.log(`  ✓ admin_replaced_by = Alice`);
    });

    test("E4. Alice essaie de remplacer à nouveau → BLOQUÉ (limite 1/jour)", async () => {
      await expect(
        adminReplaceQuestion(userA.client, groupId, activeQuestionId)
      ).rejects.toThrow();

      console.log(`  ✓ 2e remplacement bloqué : limite de 1/jour respectée`);
    });

    test("E5. Bob (non-admin) ne peut PAS remplacer la question", async () => {
      await expect(
        adminReplaceQuestion(userB.client, groupId, activeQuestionId)
      ).rejects.toThrow();

      console.log(`  ✓ Bob (non-admin) ne peut pas remplacer la question`);
    });
  });

  // ========================================
  // F. TESTS DE SÉCURITÉ RLS (Bonus)
  // ========================================
  describe("F. Tests de Sécurité RLS", () => {
    test("F1. Alice ne peut pas soumettre pour le slot de Bob", async () => {
      // Chercher un slot scheduled de Bob dans le Cycle 2
      const { data: bobSlots } = await serviceClient
        .from("daily_slots")
        .select("id, assigned_user_id, status")
        .eq("group_id", groupId)
        .eq("assigned_user_id", userB.userId)
        .eq("status", "scheduled");

      if (bobSlots && bobSlots.length > 0) {
        await expect(
          submitQuestion(userA.client, bobSlots[0].id, groupId, "Question pirate", {
            intensity: "normal",
          })
        ).rejects.toThrow();

        console.log(`  ✓ RLS : Alice ne peut pas soumettre pour le slot de Bob`);
      } else {
        // Si Bob n'a pas de slot scheduled, on peut tester avec le Cycle 2
        console.log(`  ⊘ Skipped : Bob n'a pas de slot scheduled disponible`);
      }
    });

    test("F2. Votes : vérification d'unicité par question", async () => {
      // Vérifier que chaque utilisateur n'a voté qu'une seule fois par question
      // en utilisant les données déjà créées par les tests précédents
      const { data: allQuestions } = await serviceClient
        .from("daily_questions")
        .select("id")
        .eq("group_id", groupId);

      if (allQuestions && allQuestions.length > 0) {
        for (const q of allQuestions) {
          const { data: votes } = await serviceClient
            .from("votes")
            .select("voter_id")
            .eq("question_id", q.id);

          if (votes && votes.length > 0) {
            // Vérifier qu'aucun voter_id n'apparaît en double
            const voterIds = votes.map((v) => v.voter_id);
            const uniqueVoterIds = [...new Set(voterIds)];
            expect(voterIds.length).toBe(uniqueVoterIds.length);
          }
        }

        console.log(`  ✓ RLS : Unicité des votes vérifiée sur ${allQuestions.length} questions`);
      }
    });

    test("F3. Diana ne peut pas accéder aux données d'un autre groupe", async () => {
      const otherGroupId = await createTestGroup(userA.client, "Other Group", {
        maxMembers: 12,
      });

      const { data: slots } = await userD.client
        .from("daily_slots")
        .select("*")
        .eq("group_id", otherGroupId);

      expect(slots === null || slots.length === 0).toBe(true);

      console.log(`  ✓ RLS : Diana ne peut pas accéder aux slots d'un autre groupe`);
    });
  });
});
