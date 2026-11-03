import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// The Worker's logic is plain TypeScript (no Cloudflare runtime), so it is tested in Node.
export default defineConfig({
  test: { environment: "node", include: ["worker/**/*.test.ts"], root: fileURLToPath(new URL(".", import.meta.url)) },
})