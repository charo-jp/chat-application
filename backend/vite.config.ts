import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__test__/**/*.test.ts"],
    // Load env vars before tests run. Vitest sets NODE_ENV to "test",
    // so the loader reads .env.test (if present) then falls back to .env.
    setupFiles: ["./load-env.ts"],
  },
});
