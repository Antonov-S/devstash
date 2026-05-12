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
    clearMocks: true,
    restoreMocks: true
  }
});
