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
    const ir = new ImageResponse(
      (<div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative", overflow: "hidden", backgroundColor: "#120d26", color: "#fff", fontFamily: "DM Serif Display" }}>
        {/* Aurora background - radial gradients */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(149,114,207,0.5) 0%, rgba(18,13,38,0) 60%), radial-gradient(circle at 85% 20%, rgba(94,234,212,0.4) 0%, rgba(18,13,38,0) 60%), radial-gradient(circle at 60% 90%, rgba(236,72,153,0.4) 0%, rgba(18,13,38,0) 65%)" }} />

        {/* Decorative gradient circles */}
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: 999, background: "linear-gradient(135deg, rgba(149,114,207,0.45), rgba(94,234,212,0.28))", top: "50%", left: "50%", transform: "translate(-80%, -60%)" }} />
        <div style={{ position: "absolute", width: 520, height: 520, borderRadius: 999, background: "linear-gradient(135deg, rgba(236,72,153,0.42), rgba(139,92,246,0.28))", top: "50%", right: "50%", transform: "translate(60%, 10%)" }} />
        <div style={{ position: "absolute", width: 720, height: 720, borderRadius: 999, background: "linear-gradient(135deg, rgba(34,211,238,0.3), rgba(16,185,129,0.22))", bottom: "50%", right: "50%", transform: "translate(20%, 60%)" }} />

        {/* Decorative question marks */}
        <div style={{ position: "absolute", fontSize: 260, lineHeight: 1, color: "rgba(255,255,255,0.08)", top: 140, left: 110 }}>?</div>
        <div style={{ position: "absolute", fontSize: 320, lineHeight: 1, color: "rgba(255,255,255,0.05)", bottom: -20, right: 120 }}>?</div>

        {/* Main content flex container - centers all children */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 10 }}>
          {/* Kiseki Logo */}
          <div style={{ fontSize: 72, fontWeight: 700, background: "linear-gradient(135deg, #9572CF, #5EEBD4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12, textAlign: "center", letterSpacing: -1 }}>Kiseki</div>
          <div style={{ fontSize: 18, opacity: 0.75, marginBottom: 80, letterSpacing: 0.5 }}>Choisit pour toi</div>

          {/* Premium Glass Card */}
          <div style={{ display: "flex", flexDirection: "column", width: 900, height: 1280, padding: "60px", borderRadius: 48, background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08))", border: "2px solid rgba(255,255,255,0.35)", boxShadow: "0 60px 120px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)" }}>
            {/* Question section */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ fontSize: 48, lineHeight: 1.3, marginBottom: 28, maxWidth: 780 }}>{q}</div>

              {/* Results badge redesigned */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", padding: "10px 18px", borderRadius: 999, background: "linear-gradient(135deg, #9572CF, #7B61B8)", border: "1px solid rgba(255,255,255,0.25)", fontSize: 16, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", marginRight: 16 }}>
                  🏆 Résultats
                </div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{vs}</div>
              </div>
            </div>

            {/* Winner avatar and name section */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: 60, flex: 1, width: "100%" }}>
              {avatarDataUri ? (
                <img src={avatarDataUri} width={240} height={240} style={{ borderRadius: 120, border: "6px solid rgba(255,255,255,0.9)", marginBottom: 28, boxShadow: "0 20px 60px rgba(149,114,207,0.6)" }} />
              ) : (
                <div style={{ display: "flex", width: 240, height: 240, borderRadius: 120, border: "6px solid rgba(255,255,255,0.9)", background: "linear-gradient(135deg, rgba(149,114,207,0.3), rgba(94,234,212,0.2))", alignItems: "center", justifyContent: "center", fontSize: 80, fontWeight: 700, marginBottom: 28, boxShadow: "0 20px 60px rgba(149,114,207,0.6)" }}>{ini}</div>
              )}

              {/* Winner name with gradient */}
              <div style={{ fontSize: 42, fontWeight: 700, marginBottom: 12, textAlign: "center", background: "linear-gradient(135deg, #9572CF, #5EEBD4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{winnerName}</div>
              <div style={{ fontSize: 18, opacity: 0.8, letterSpacing: 0.3 }}>Gagnant du jour</div>
            </div>

            {/* Group separator */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: 40, paddingTop: 28 }}>
              <div style={{ width: 100, height: "2px", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(149,114,207,0.5), rgba(255,255,255,0))", marginBottom: 16 }} />
              <div style={{ fontSize: 18, opacity: 0.75, letterSpacing: 0.3 }}>{groupName}</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 18, opacity: 0.5, letterSpacing: 0.3 }}>kiseki.app</div>
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
