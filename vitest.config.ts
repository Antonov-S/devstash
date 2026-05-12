import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true
  },
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/__tests__/**/*.test.ts", "src/**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "src/**/*.test.tsx"
    ],
    // Vitest 4's parallel workers share a module-resolution cache, and
    // next-auth's `next/server` bare-specifier import fails under Node ESM
    // resolution. The failure in one worker poisons sibling workers. Running
    // files sequentially keeps each test file's resolution isolated. The
    // suite is small enough that the perf cost is negligible.
    fileParallelism: false,
    clearMocks: true,
    restoreMocks: true
  }
});
