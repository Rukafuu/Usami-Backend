import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import RubyPlugin from "vite-plugin-ruby"

export default defineConfig({
  plugins: [react(), RubyPlugin()],
  build: {
    // Keep fonts and images as real files so the CSP never needs `data:` sources.
    assetsInlineLimit: 0,
  },
})
