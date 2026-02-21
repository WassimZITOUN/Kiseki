import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Environnement Node.js pour les tests E2E
    environment: "node",

    // Timeout élevé pour les opérations Supabase
    testTimeout: 30000,
    hookTimeout: 30000,

    // Exécution séquentielle pour éviter les conflits DB
    sequence: {
      concurrent: false,
    },

    // Variables d'environnement pour Supabase local
    env: {
      SUPABASE_URL: "http://127.0.0.1:54321",
      SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
      SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
    },

    // Reporters
    reporters: ["verbose"],

    // Couverture de code (optionnel)
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["e2e/**/*.ts"],
    },
  },
});
