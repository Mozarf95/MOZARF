import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const anthropicKey = env.ANTHROPIC_API_KEY || "";

  return {
    plugins: [react()],
    root: ".",
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: false,
      open: true,
      proxy: {
        "/anthropic-api": {
          target: "https://api.anthropic.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/anthropic-api/, ""),
          configure(proxy) {
            proxy.on("proxyReq", (proxyReq) => {
              if (anthropicKey) {
                proxyReq.setHeader("x-api-key", anthropicKey);
                proxyReq.setHeader("anthropic-version", "2023-06-01");
              }
            });
          },
        },
      },
    },
    preview: {
      host: "127.0.0.1",
      port: 4173,
      strictPort: false,
      open: true,
    },
  };
});
