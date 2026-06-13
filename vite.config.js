// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(),tailwindcss()],
// })




import { defineConfig } from "vite";
import react     from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),   // Tailwind v4 — handled as a Vite plugin, no postcss.config needed
    react(),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target:      "http://localhost:5000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        ws:     true,
      },
    },
  },
});
