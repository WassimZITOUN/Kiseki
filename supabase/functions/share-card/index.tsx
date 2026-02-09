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
      (<div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative", backgroundColor: "#120d26", color: "#fff", fontFamily: "DM Serif Display", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(circle at 30% 40%, rgba(149,114,207,0.35) 0%, transparent 40%), radial-gradient(circle at 85% 20%, rgba(94,234,212,0.25) 0%, transparent 40%), radial-gradient(circle at 15% 85%, rgba(236,72,153,0.2) 0%, transparent 35%)" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: 200, background: "rgba(149, 114, 207, 0.08)", top: "10%", left: "-5%" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: 150, background: "rgba(94, 234, 212, 0.06)", bottom: "15%", right: "-3%" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 10, marginBottom: 40 }}>
          <div style={{ fontSize: 120, fontWeight: "bold", color: "#9572CF", lineHeight: 1 }}>Kiseki</div>
          <div style={{ display: "flex", flexDirection: "column", width: 880, height: 1173, padding: "60px", background: "linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))", border: "2px solid rgba(255, 255, 255, 0.2)", borderRadius: 40, boxShadow: "0 30px 80px rgba(0, 0, 0, 0.4)", justifyContent: "flex-start", marginTop: 40 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 42, lineHeight: 1.2, marginBottom: 20 }}>{q}</div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <div style={{ fontSize: 14, fontWeight: "600", marginRight: 12, background: "linear-gradient(135deg, #9572CF, #7B61B8)", padding: "8px 14px", borderRadius: 20 }}>🏆 Résultats</div>
                <div style={{ fontSize: 16 }}>{vs}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
              {avatarDataUri ? (
                <img src={avatarDataUri} width={200} height={200} style={{ borderRadius: 100, border: "5px solid rgba(255,255,255,0.8)", marginBottom: 24 }} />
              ) : (
                <div style={{ display: "flex", width: 200, height: 200, borderRadius: 100, border: "5px solid rgba(255,255,255,0.8)", background: "rgba(149, 114, 207, 0.25)", alignItems: "center", justifyContent: "center", fontSize: 72, fontWeight: "bold", marginBottom: 24 }}>{ini}</div>
              )}
              <div style={{ fontSize: 36, fontWeight: "bold", marginBottom: 8, textAlign: "center" }}>{winnerName}</div>
              <div style={{ fontSize: 14, opacity: 0.75 }}>Gagnant du jour</div>
            </div>
            <div style={{ textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 20, marginTop: "auto" }}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{groupName}</div>
            </div>
          </div>
          <div style={{ marginTop: 40, fontSize: 14, opacity: 0.5 }}>kiseki.app</div>
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
