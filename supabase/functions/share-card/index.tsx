import React from "react";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.4/mod.ts";

const CH = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

let fc: ArrayBuffer | null = null;
async function gf() {
  if (fc) return fc;
  const r = await fetch("https://fonts.gstatic.com/s/dmserifdisplay/v17/-nFnOHM81r4j6k0gjAW3mujVU2B2K_c.ttf");
  fc = await r.arrayBuffer();
  return fc;
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
  try {
    const { question = "", winnerName = "", winnerAvatarUri = "", winnerVoteCount = 0, groupName = "" } = await req.json();
    const fd = await gf();
    const avatarDataUri = winnerAvatarUri ? await fetchAvatarDataUri(winnerAvatarUri) : null;
    const ini = winnerName.charAt(0).toUpperCase();
    const q = question.length > 100 ? question.slice(0, 97) + "..." : question;
    const vs = winnerVoteCount + " vote" + (Number(winnerVoteCount) > 1 ? "s" : "");
    const foot = groupName + " \u00b7 kiseki.app";
    const ir = new ImageResponse(
      (<div style={{ height: "100%", width: "100%", display: "flex", position: "relative", overflow: "hidden", backgroundColor: "#120d26", color: "#fff", fontFamily: "DM Serif Display" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(1200px 800px at 20% 10%, rgba(149,114,207,0.45) 0%, rgba(18,13,38,0) 60%), radial-gradient(900px 700px at 85% 20%, rgba(94,234,212,0.35) 0%, rgba(18,13,38,0) 60%), radial-gradient(1000px 900px at 60% 90%, rgba(236,72,153,0.35) 0%, rgba(18,13,38,0) 65%)" }} />
        <div style={{ position: "absolute", width: 620, height: 620, borderRadius: 999, background: "linear-gradient(135deg, rgba(149,114,207,0.35), rgba(94,234,212,0.25))", top: -160, left: -180 }} />
        <div style={{ position: "absolute", width: 460, height: 460, borderRadius: 999, background: "linear-gradient(135deg, rgba(236,72,153,0.35), rgba(139,92,246,0.25))", top: 140, right: -180 }} />
        <div style={{ position: "absolute", width: 620, height: 620, borderRadius: 999, background: "linear-gradient(135deg, rgba(34,211,238,0.25), rgba(16,185,129,0.2))", bottom: -220, right: 80 }} />
        <div style={{ position: "absolute", fontSize: 260, lineHeight: 1, color: "rgba(255,255,255,0.06)", top: 120, left: 100 }}>?</div>
        <div style={{ position: "absolute", fontSize: 320, lineHeight: 1, color: "rgba(255,255,255,0.04)", bottom: -40, right: 120 }}>?</div>

        <div style={{ position: "relative", display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "64px 64px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ fontSize: 20, letterSpacing: 1, opacity: 0.6 }}>Kiseki</div>
            <div style={{ display: "flex", opacity: 0.5 }}>
              <div style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.5)", marginRight: 8 }} />
              <div style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.35)", marginRight: 8 }} />
              <div style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)" }} />
            </div>
          </div>

          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", padding: "40px 42px", borderRadius: 32, background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.06))", border: "1px solid rgba(255,255,255,0.28)", boxShadow: "0 32px 80px rgba(0,0,0,0.38)" }}>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
                <div style={{ fontSize: 38, lineHeight: 1.25, marginBottom: 18 }}>{q}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ display: "flex", padding: "6px 12px", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)", fontSize: 14, letterSpacing: 0.6, textTransform: "uppercase", opacity: 0.8, marginRight: 12 }}>Resultats</div>
                  <div style={{ fontSize: 14, opacity: 0.7 }}>{vs}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: 28 }}>
                {avatarDataUri ? (
                  <img src={avatarDataUri} width={160} height={160} style={{ borderRadius: 80, border: "3px solid rgba(255,255,255,0.75)", marginBottom: 16 }} />
                ) : (
                  <div style={{ display: "flex", width: 160, height: 160, borderRadius: 80, border: "3px solid rgba(255,255,255,0.75)", backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", fontSize: 64, marginBottom: 16 }}>{ini}</div>
                )}
                <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 6, textAlign: "center" }}>{winnerName}</div>
                <div style={{ fontSize: 14, opacity: 0.7 }}>Gagnant du jour</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", opacity: 0.5 }}>
              <div style={{ width: 42, height: 1, backgroundColor: "rgba(255,255,255,0.25)" }} />
              <div style={{ fontSize: 14, marginLeft: 10 }}>{groupName}</div>
            </div>
            <div style={{ fontSize: 14, opacity: 0.4 }}>{foot}</div>
          </div>
        </div>
      </div>),
      { width: 1080, height: 1920, fonts: [{ name: "DM Serif Display", data: fd, style: "normal" as const }] }
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
