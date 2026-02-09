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
      (<div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #5B21B6 0%, #8B5CF6 100%)", color: "#fff", fontFamily: "DM Serif Display", padding: "48px" }}>
        <div style={{ display: "flex", alignSelf: "flex-start", fontSize: 18, opacity: 0.5 }}>Kiseki</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 34, lineHeight: 1.3, textAlign: "center", marginBottom: 28, maxWidth: 560 }}>{q}</div>
          {avatarDataUri ? (
            <img src={avatarDataUri} width={108} height={108} style={{ borderRadius: 54, border: "3px solid #FFD700", marginBottom: 12 }} />
          ) : (
            <div style={{ display: "flex", width: 108, height: 108, borderRadius: 54, border: "3px solid #FFD700", backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", fontSize: 44, marginBottom: 12 }}>{ini}</div>
          )}
          <div style={{ display: "flex", fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{winnerName}</div>
          <div style={{ display: "flex", fontSize: 16, opacity: 0.7 }}>{vs}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", width: 60, height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 12 }} />
          <div style={{ display: "flex", fontSize: 14, opacity: 0.4 }}>{foot}</div>
        </div>
      </div>),
      { width: 680, height: 680, fonts: [{ name: "DM Serif Display", data: fd, style: "normal" as const }] }
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
