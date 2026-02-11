import React from "react";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.4/mod.ts";

const CH = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

let fc: ArrayBuffer | null = null;
let tc: ArrayBuffer | null = null;
async function gf() {
  if (fc) return fc;
  const r = await fetch("https://fonts.gstatic.com/s/dmserifdisplay/v17/-nFnOHM81r4j6k0gjAW3mujVU2B2K_c.ttf");
  if (!r.ok) throw new Error("DM Serif Display fetch failed: " + r.status);
  fc = await r.arrayBuffer();
  return fc;
}
async function tf() {
  if (tc) return tc;
  const r = await fetch("https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf");
  if (!r.ok) return null;
  tc = await r.arrayBuffer();
  return tc;
}

async function fetchAvatarDataUri(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "image/png";
    const ab = await r.arrayBuffer();
    const bytes = new Uint8Array(ab);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode(...bytes.subarray(i, Math.min(i + 0x8000, bytes.length)));
    }
    return `data:${ct};base64,${btoa(bin)}`;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CH });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { "Content-Type": "application/json", ...CH } });
  }

  const question = String(body.question ?? "");
  const winnerName = String(body.winnerName ?? "");
  const winnerAvatarUri = String(body.winnerAvatarUri ?? "");
  const winnerVoteCount = Number(body.winnerVoteCount) || 0;
  const groupName = String(body.groupName ?? "");

  if (!question || !winnerName) {
    return new Response(JSON.stringify({ error: "Missing required fields: question, winnerName" }), { status: 400, headers: { "Content-Type": "application/json", ...CH } });
  }

  try {
    const fd = await gf();
    const td = await tf();
    const sansFamily = td ? "Roboto" : "sans-serif";
    const avatarDataUri = winnerAvatarUri ? await fetchAvatarDataUri(winnerAvatarUri) : null;
    const ini = winnerName.charAt(0).toUpperCase();
    const qSize = question.length <= 60 ? 46 : question.length <= 120 ? 42 : 36;
    const displayName = winnerName.length > 20 ? winnerName.slice(0, 18) + "\u2026" : winnerName;
    const displayGroup = groupName.length > 28 ? groupName.slice(0, 26) + "\u2026" : groupName;
    const footGroup = groupName.length > 24 ? groupName.slice(0, 22) + "\u2026" : groupName;
    const vs = winnerVoteCount + " vote" + (Number(winnerVoteCount) > 1 ? "s" : "");
    const foot = footGroup + " \u00b7 kiseki.app";
    const ir = new ImageResponse(
      (<div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", backgroundColor: "#120d26", color: "#fff", fontFamily: sansFamily }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 10%, rgba(149,114,207,0.45) 0%, rgba(18,13,38,0) 60%), radial-gradient(circle at 85% 20%, rgba(94,234,212,0.35) 0%, rgba(18,13,38,0) 60%), radial-gradient(circle at 60% 90%, rgba(236,72,153,0.35) 0%, rgba(18,13,38,0) 65%)" }} />
        <div style={{ position: "absolute", width: 720, height: 720, borderRadius: 999, background: "linear-gradient(135deg, rgba(149,114,207,0.4), rgba(94,234,212,0.25))", top: -180, left: -220 }} />
        <div style={{ position: "absolute", width: 540, height: 540, borderRadius: 999, background: "linear-gradient(135deg, rgba(236,72,153,0.38), rgba(139,92,246,0.25))", top: 220, right: -220 }} />
        <div style={{ position: "absolute", width: 760, height: 760, borderRadius: 999, background: "linear-gradient(135deg, rgba(34,211,238,0.25), rgba(16,185,129,0.2))", bottom: -260, right: 60 }} />
        <div style={{ position: "absolute", fontSize: 260, lineHeight: 1, color: "rgba(255,255,255,0.06)", top: 140, left: 110 }}>?</div>
        <div style={{ position: "absolute", fontSize: 320, lineHeight: 1, color: "rgba(255,255,255,0.04)", bottom: -20, right: 120 }}>?</div>

        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", width: "100%", height: "100%", justifyContent: "center" }}>
          <div style={{ marginBottom: 44, fontSize: 94, letterSpacing: 6, opacity: 0.92, fontFamily: "DM Serif Display" }}>KISEKI</div>

          <div style={{ display: "flex", flexDirection: "column", width: 940, height: 1280, padding: "68px 76px", borderRadius: 48, background: "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06))", border: "1px solid rgba(255,255,255,0.28)", boxShadow: "0 48px 110px rgba(0,0,0,0.45)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 160, background: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0))" }} />

            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              <div style={{ width: "100%", textAlign: "center", fontSize: qSize, lineHeight: 1.2, marginBottom: 28, overflow: "hidden", wordBreak: "break-word" }}>{question}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ display: "flex", padding: "14px 22px", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.16)", fontSize: 34, letterSpacing: 0.9, textTransform: "uppercase", opacity: 0.92, marginRight: 18 }}>Resultats</div>
                <div style={{ fontSize: 34, opacity: 0.85 }}>{vs}</div>
              </div>
            </div>

            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: 20, flex: 1, width: "100%" }}>
              <div style={{ width: 308, height: 308, borderRadius: 154, border: "6px solid rgba(149,114,207,0.9)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: -5, marginBottom: 26 }}>
                {avatarDataUri ? (
                  <img src={avatarDataUri} width={280} height={280} style={{ borderRadius: 140, border: "5px solid rgba(255,255,255,0.9)" }} />
                ) : (
                  <div style={{ display: "flex", width: 280, height: 280, borderRadius: 140, border: "5px solid rgba(255,255,255,0.9)", backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", fontSize: 104 }}>{ini}</div>
                )}
              </div>
              <div style={{ fontSize: 64, fontWeight: 600, marginBottom: 8, marginTop: -15, textAlign: "center", maxWidth: 788, overflow: "hidden" }}>{displayName}</div>
            </div>

            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", opacity: 0.55 }}>
                <div style={{ width: 72, height: 1, backgroundColor: "rgba(255,255,255,0.25)" }} />
                <div style={{ fontSize: 36, marginLeft: 18 }}>{displayGroup}</div>
              </div>
            </div>
          </div>

          <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, opacity: 0.7 }}>{foot}</div>
        </div>
      </div>),
      { width: 1080, height: 1920, fonts: [
        { name: "DM Serif Display", data: fd, style: "normal" as const },
        ...(td ? [{ name: "Roboto", data: td, style: "normal" as const }] : []),
      ] }
    );
    const ab = await ir.arrayBuffer();
    const by = new Uint8Array(ab);
    let bn = "";
    for (let i = 0; i < by.length; i += 0x8000) { bn += String.fromCharCode(...by.subarray(i, Math.min(i + 0x8000, by.length))); }
    return new Response(JSON.stringify({ image: btoa(bn) }), { headers: { "Content-Type": "application/json", ...CH } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...CH } });
  }
});
