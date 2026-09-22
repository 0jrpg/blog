import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ---------------------------------------------------------------------------
// IMPORTANTE: se você for publicar em https://<usuario>.github.io/<repo>/
// troque "/liquid-blog/" pelo nome exato do seu repositório (com as barras).
// Se for publicar em https://<usuario>.github.io/ (repo de usuário) ou em
// domínio próprio, use base: "/".
// ---------------------------------------------------------------------------
export default defineConfig({
  base: "/liquid-blog/",
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
