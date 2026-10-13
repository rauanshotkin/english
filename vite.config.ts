import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => {
  const staticHosting = process.env.GITHUB_PAGES === "true" || mode === "pages";
  return {
    base: staticHosting ? "/english/" : "/",
    define: { __STATIC_HOSTING__: JSON.stringify(staticHosting) },
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": { target: "http://127.0.0.1:3001", changeOrigin: false },
      },
    },
  };
});
