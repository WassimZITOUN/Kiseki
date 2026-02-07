import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import React from "https://esm.sh/react@18.2.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.6/mod.ts";

// Try to fetch the custom font, with a fallback
let fontData: ArrayBuffer | undefined;
try {
  const fontResponse = await fetch(
    "https://fonts.gstatic.com/s/dmserifdisplay/v17/-nFnOHM81r4j6k0gjAW3mujVU2B2K_c.ttf"
  );
  if (!fontResponse.ok) {
    console.error(`Failed to fetch font: ${fontResponse.statusText}`);
    // Fallback to a generic sans-serif if font fails
    fontData = undefined;
  } else {
    fontData = await fontResponse.arrayBuffer();
    console.log("Custom font loaded successfully.");
  }
} catch (e) {
  console.error("Error fetching custom font:", e);
  // Fallback to a generic sans-serif
  fontData = undefined;
}

serve(async (req) => {
  console.log("Edge Function received request.");
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request.");
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
      },
    });
  }

  try {
    const {
      question = "Quelle est la personne la plus susceptible de...",
      winnerName = "Wassim",
      winnerAvatarUri,
      groupName = "Kiseki",
      winnerVoteCount = 0,
    } = await req.json();
    console.log("Request body parsed:", { question, winnerName, winnerAvatarUri, groupName, winnerVoteCount });

    const response = new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#030014",
            color: "#fff",
            fontFamily: fontData ? '"DM Serif Display"' : "sans-serif", // Use fallback if font not loaded
            padding: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 24, margin: 0, color: "#a29bfe" }}>
              {groupName}
            </p>
            <h1 style={{ fontSize: 48, margin: "20px 0", fontWeight: "600" }}>
              {question}
            </h1>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "20px",
              }}
            >
              {winnerAvatarUri && (
                <img
                  src={winnerAvatarUri}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    marginRight: "20px",
                    border: "4px solid #a29bfe",
                  }}
                />
              )}
              <div
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}
              >
                <p style={{ fontSize: 36, margin: 0, fontWeight: "bold" }}>
                  {winnerName}
                </p>
                <p style={{ fontSize: 24, margin: "5px 0 0", color: "#e0e0e0" }}>
                  {winnerVoteCount} vote{winnerVoteCount > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                bottom: "20px",
                right: "40px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <p style={{ fontSize: 20, fontStyle: "italic" }}>
                Généré par Kiseki
              </p>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: fontData ? [{ name: "DM Serif Display", data: fontData, style: "normal" }] : [],
        headers: {
          "Content-Type": "image/png",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "content-type",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      }
    );
    console.log("ImageResponse generated successfully.");
    return response;
  } catch (e) {
    console.error("Error during Edge Function execution:", e);
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
});
