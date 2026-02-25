// ============================================================
// Kiseki — Edge Function : send-notifications
// Dispatche les notifications push vers l'API Expo.
// Appelee par pg_cron (cron jobs) et pg_net (triggers SQL).
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_API = "https://exp.host/--/api/v2/push/send";
const EXPO_BATCH_SIZE = 100; // Limite Expo : 100 tokens max par requete

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Type interne — etend NotificationType avec 'vote' (social proof, trigger-only)
type InternalNotificationType =
  | "daily_question"
  | "vote_reminder"
  | "results_reveal"
  | "member_joined"
  | "vote";

type RequestBody = {
  type: InternalNotificationType;
  group_id?: string;
  question_id?: string;
  target_user_id?: string;
  new_user_id?: string;
  joiner_name?: string;
  group_name?: string;
};

type ExpoPushMessage = {
  to: string;
  title?: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
  badge?: number;
};

type ExpoPushTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

// Decoupe un tableau en sous-tableaux de taille max `size`
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Envoie un batch de messages a l'API Expo Push
async function sendExpoBatch(
  messages: ExpoPushMessage[]
): Promise<ExpoPushTicket[]> {
  const res = await fetch(EXPO_PUSH_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(messages),
  });

  if (!res.ok) {
    console.error("Expo API error:", res.status, await res.text());
    return [];
  }

  const json = await res.json();
  return json.data ?? [];
}

// Fan-out : envoie les notifications a tous les tokens donnes.
// Gere le chunking (limite Expo de 100) et le nettoyage des tokens invalides.
// DeviceNotRegistered = app desintallee → on supprime le token de la DB.
async function fanOut(
  supabase: ReturnType<typeof createClient>,
  tokens: string[],
  buildMessage: (token: string) => ExpoPushMessage
): Promise<void> {
  // Filtre les tokens Expo valides uniquement
  const validTokens = tokens.filter(
    (t) =>
      t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken[")
  );

  if (validTokens.length === 0) return;

  const batches = chunk(validTokens, EXPO_BATCH_SIZE);

  for (const batch of batches) {
    const messages = batch.map(buildMessage);
    const tickets = await sendExpoBatch(messages);

    // Nettoyage des tokens obsoletes — essentiel pour ne pas gaspiller
    // le quota Expo et eviter le rate limiting
    const staleTokens: string[] = [];
    tickets.forEach((ticket, idx) => {
      if (
        ticket.status === "error" &&
        ticket.details?.error === "DeviceNotRegistered"
      ) {
        staleTokens.push(batch[idx]!);
      }
    });

    if (staleTokens.length > 0) {
      await supabase
        .from("profiles")
        .update({ expo_push_token: null })
        .in("expo_push_token", staleTokens);
    }
  }
}

// Helper : recupere les tokens push de tous les membres d'un groupe
async function getGroupMemberTokens(
  supabase: ReturnType<typeof createClient>,
  groupId: string,
  excludeUserId?: string
): Promise<string[]> {
  let query = supabase
    .from("group_members")
    .select("user_id, profiles(expo_push_token)")
    .eq("group_id", groupId);

  if (excludeUserId) {
    query = query.neq("user_id", excludeUserId);
  }

  const { data: members } = await query;

  return (members ?? [])
    .map((m: any) => m.profiles?.expo_push_token)
    .filter(Boolean);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // Verification : seul le service_role_key autorise l'appel.
  // pg_cron et pg_net passent ce header via la migration SQL.
  const authHeader = req.headers.get("Authorization") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  // Client admin (service role) — bypass RLS pour lire tous les tokens
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey,
    { auth: { persistSession: false } }
  );

  const today = new Date().toISOString().split("T")[0];

  try {
    switch (body.type) {
      // ─────────────────────────────────────────────────────
      // CASE 1 : Question du matin — rituel quotidien
      // "Le tribunal est ouvert" → tous les membres des groupes actifs
      // ─────────────────────────────────────────────────────
      case "daily_question": {
        const { data: questions } = await supabase
          .from("daily_questions")
          .select("id, group_id")
          .eq("status", "active")
          .gte("created_at", today);

        if (!questions || questions.length === 0) break;

        for (const question of questions) {
          // Nom du groupe pour personnaliser le message
          const { data: group } = await supabase
            .from("groups")
            .select("name")
            .eq("id", question.group_id)
            .single();

          const groupName = group?.name ?? "ton groupe";

          const tokens = await getGroupMemberTokens(
            supabase,
            question.group_id
          );

          await fanOut(supabase, tokens, (token) => ({
            to: token,
            title: "Kiseki",
            body: `Le tribunal est ouvert \u2696\uFE0F Une nouvelle question t'attend dans ${groupName}.`,
            sound: "default",
            data: {
              type: "daily_question",
              group_id: question.group_id,
              question_id: question.id,
              screen: "vote",
            },
          }));
        }
        break;
      }

      // ─────────────────────────────────────────────────────
      // CASE 2 : Rappel "Derniere chance" — urgence (19h, 1h avant reveal)
      // Cible uniquement ceux qui n'ont PAS encore vote (scarcity)
      // ─────────────────────────────────────────────────────
      case "vote_reminder": {
        const { data: questions } = await supabase
          .from("daily_questions")
          .select("id, group_id")
          .eq("status", "active")
          .gte("created_at", today);

        if (!questions || questions.length === 0) break;

        for (const question of questions) {
          const { data: group } = await supabase
            .from("groups")
            .select("name")
            .eq("id", question.group_id)
            .single();

          const groupName = group?.name ?? "ton groupe";

          // Tous les membres du groupe
          const { data: allMembers } = await supabase
            .from("group_members")
            .select("user_id, profiles(expo_push_token)")
            .eq("group_id", question.group_id);

          // Ceux qui ont DEJA vote
          const { data: voters } = await supabase
            .from("votes")
            .select("voter_id")
            .eq("question_id", question.id);

          const voterIds = new Set(
            (voters ?? []).map((v: any) => v.voter_id)
          );

          // Filtre : tokens des non-votants seulement
          // Le principe de scarcity pousse les retardataires a agir
          const tokens: string[] = (allMembers ?? [])
            .filter((m: any) => !voterIds.has(m.user_id))
            .map((m: any) => m.profiles?.expo_push_token)
            .filter(Boolean);

          await fanOut(supabase, tokens, (token) => ({
            to: token,
            title: "Kiseki",
            body: `Tic tac \u23F3 Plus qu'une heure pour balancer tes potes dans ${groupName} !`,
            sound: "default",
            data: {
              type: "vote_reminder",
              group_id: question.group_id,
              question_id: question.id,
              screen: "vote",
            },
          }));
        }
        break;
      }

      // ─────────────────────────────────────────────────────
      // CASE 3 : Reveal — recompense / climax (20h)
      // "Les masques tombent" → deep link vers les resultats
      // ─────────────────────────────────────────────────────
      case "results_reveal": {
        // A 20h, reveal_due_questions() tourne toutes les 5 min.
        // On requete les questions du jour (actives OU revealed) pour etre
        // robuste face a la race condition. L'utilisateur verra l'etat reel
        // en ouvrant l'app — quelques secondes de delai acceptable.
        const { data: questions } = await supabase
          .from("daily_questions")
          .select("id, group_id")
          .in("status", ["active", "revealed"])
          .gte("created_at", today);

        if (!questions || questions.length === 0) break;

        for (const question of questions) {
          const { data: group } = await supabase
            .from("groups")
            .select("name")
            .eq("id", question.group_id)
            .single();

          const groupName = group?.name ?? "ton groupe";

          const tokens = await getGroupMemberTokens(
            supabase,
            question.group_id
          );

          await fanOut(supabase, tokens, (token) => ({
            to: token,
            title: "Kiseki",
            body: `Les masques tombent \uD83C\uDFAD Viens voir quelle amitie a ete ruinee dans ${groupName} !`,
            sound: "default",
            data: {
              type: "results_reveal",
              group_id: question.group_id,
              question_id: question.id,
              screen: "results",
            },
          }));
        }
        break;
      }

      // ─────────────────────────────────────────────────────
      // CASE 4 : Social Proof — FOMO / curiosite
      // Notifie UNIQUEMENT la personne qui a recu un vote.
      // On ne revele JAMAIS qui a vote — le mystere pousse a revenir a 20h.
      // C'est la mecanique la plus puissante (cf. BeReal, Slay, NGL).
      // ─────────────────────────────────────────────────────
      case "vote": {
        if (!body.target_user_id || !body.group_id) break;

        const { data: profile } = await supabase
          .from("profiles")
          .select("expo_push_token")
          .eq("id", body.target_user_id)
          .single();

        if (!profile?.expo_push_token) break;

        const { data: group } = await supabase
          .from("groups")
          .select("name")
          .eq("id", body.group_id)
          .single();

        const groupName = group?.name ?? "ton groupe";

        await fanOut(supabase, [profile.expo_push_token], (token) => ({
          to: token,
          title: "Kiseki",
          // Critique : aucune mention de l'identite du votant
          body: `Quelqu'un vient de voter pour toi dans ${groupName} \uD83D\uDC40 Connecte-toi pour le decouvrir ce soir !`,
          sound: "default",
          data: {
            type: "daily_question",
            group_id: body.group_id,
            question_id: body.question_id,
            screen: "vote",
          },
        }));
        break;
      }

      // ─────────────────────────────────────────────────────
      // CASE 5 : Nouveau membre — validation sociale
      // "Fresh meat" → tous les membres SAUF le nouvel arrivant
      // Montre que le groupe est vivant et cree de l'anticipation
      // ─────────────────────────────────────────────────────
      case "member_joined": {
        if (!body.group_id || !body.new_user_id) break;

        const groupName = body.group_name ?? "ton groupe";
        const joinerName = body.joiner_name ?? "Quelqu'un";

        const tokens = await getGroupMemberTokens(
          supabase,
          body.group_id,
          body.new_user_id // exclut le nouvel arrivant
        );

        await fanOut(supabase, tokens, (token) => ({
          to: token,
          title: "Kiseki",
          body: `Fresh meat \uD83E\uDD69 ${joinerName} vient de rejoindre ${groupName}. Preparez les dossiers.`,
          sound: "default",
          data: {
            type: "member_joined",
            group_id: body.group_id,
            screen: "group",
          },
        }));
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown type: ${(body as any).type}` }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS },
          }
        );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err: any) {
    console.error("send-notifications error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
