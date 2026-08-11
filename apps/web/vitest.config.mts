import { defineConfig } from "vitest/config";
import path from "node:path";

const rootDir = import.meta.dirname;

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Any code path under test that falls through to the real
    // getDatabase() singleton (rather than creating its own :memory: db
    // directly) should still never touch the filesystem.
    env: { DATABASE_PATH: ":memory:" },
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
      "@financeapp/shared-types": path.resolve(rootDir, "../../packages/shared-types/index.ts"),
    },
  },
});
