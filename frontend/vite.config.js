import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Listen on all network interfaces (0.0.0.0)
    port: 5173,
    cors: true,
  },
  preview: {
    host: true,
    port: 5173,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "lucide-react",
      "axios",
      "framer-motion",
      "recharts",
      "react-hot-toast",
    ],
  },
  build: {
    target: "esnext",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts")) return "charts";
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("framer-motion")) return "animations";
            return "vendor";
          }
        },
      },
    },
  },
});
