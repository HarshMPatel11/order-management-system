import path from "path";
import { defineConfig } from "vitest/config";

const aliases = {
  "@": path.resolve(import.meta.dirname, "client", "src"),
  "@shared": path.resolve(import.meta.dirname, "shared"),
};

export default defineConfig({
  test: {
    alias: aliases,
    projects: [
      {
        test: {
          name: "client",
          include: ["client/src/**/*.test.ts", "client/src/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["./client/src/test/setup.ts"],
        },
      },
      {
        test: {
          name: "server",
          include: ["server/**/*.test.ts"],
          environment: "node",
          setupFiles: ["./server/__tests__/setup.ts"],
        },
      },
    ],
  },
});
