import { defineConfig } from "vitest/config";

export default defineConfig({
  // base "./" permite hospedar a versão final em qualquer subpasta de servidor estático.
  base: "./",
  build: {
    target: "es2019",
    // Falha o build se o pacote inicial passar de ~200 KB (limite do requisito de 3G).
    chunkSizeWarningLimit: 200,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
