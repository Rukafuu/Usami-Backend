import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["app/frontend/test/setup.ts"],
    include: ["app/frontend/**/*.test.{ts,tsx}"],
    css: false,
  },
})
