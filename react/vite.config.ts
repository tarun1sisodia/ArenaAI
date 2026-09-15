import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

function normalizeBase(value: string | undefined): string {
  const base = (value || "/").trim();
  if (base === "/") return "/";
  return `/${base.replace(/^\/+|\/+$/g, "")}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = normalizeBase(env.VITE_BASE_PATH || env.SITE_BASE);

  return {
    root: fileURLToPath(new URL(".", import.meta.url)),
    base,
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: false,
      // Preview/sandbox hosts (e.g. *.e2b.app) are not localhost, so Vite's
      // host allowlist must be opened for the dev server to be reachable.
      allowedHosts: true,
    },
    preview: {
      host: "0.0.0.0",
      port: 4174,
      strictPort: false,
      allowedHosts: true,
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
