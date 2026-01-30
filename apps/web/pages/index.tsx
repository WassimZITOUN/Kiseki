import React from "react";
import { greet } from "@my-app/core";

export default function Home() {
  return (
    <main style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <h1>{greet("Next.js")}</h1>
    </main>
  );
}
