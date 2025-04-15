import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  assetsInclude: ["src/*.html"],
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
    }),
  ],
});
