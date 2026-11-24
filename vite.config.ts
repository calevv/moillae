import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 새 버전을 배포하면 다음에 열 때 자동으로 바뀜
      registerType: "autoUpdate",
      // 서비스 워커 등록 코드를 index.html에 자동으로 넣어 줌
      injectRegister: "auto",
      // manifest는 public/manifest.webmanifest를 직접 만들어 둬서 플러그인이 새로 만들지 않게
      manifest: false,
      workbox: {
        // 빌드된 화면 파일만 저장. Supabase 요청은 저장하지 않음
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
        // /home, /calendar 같은 주소도 index.html로 (SPA 라우팅)
        navigateFallback: "/index.html",
        // 예전 버전 캐시는 지우기
        cleanupOutdatedCaches: true,
        // 푸시 처리 파일을 서비스 워커에 덧붙이기
        importScripts: ["push-sw.js"],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
});
