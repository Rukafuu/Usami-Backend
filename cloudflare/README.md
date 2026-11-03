# Deploy: Cloudflare (free plan)

```
Visitor -> Cloudflare static files (the whole site, rendered by Rails)       <- almost everything
        -> Worker (worker/)  only for: "/" (language), POST /:locale/assistant, POST /:locale/consentimento
```

- `rails static:export` renders every page in four languages, the OS data (`os.json`), sitemap, robots, a 404 and the
  security headers (`_headers`) into `site/`. Rails stays the single place where the content lives.
- The Worker is the assistant (Usami, via NVIDIA, streaming), its limits (per visitor per minute/hour and a daily cap, kept
  in a Durable Object with SQLite storage) and saving the cookie choice. Nothing the visitor writes is stored or logged.
- Free plan: static files are free and unlimited; the Worker has 100,000 requests/day; Durable Objects (SQLite) are
  available on the free plan. No Docker, no card.

## One-time
1. `cd cloudflare` then `npm install`.
2. `npx wrangler login` (opens the browser).

## Every deploy
```powershell
# 1. Build the site. For the first deploy use the local address; afterwards use the real one (see "The address" below).
powershell -File script\build_static.ps1 -SiteUrl https://usami.<your-subdomain>.workers.dev

# 2. Deploy files + Worker
cd cloudflare
npx wrangler deploy

# 3. The AI key, once (and whenever it changes)
cd ..
powershell -File script\deploy_secrets.ps1      # writes cloudflare\.env.deploy (value is not printed)
cd cloudflare
npx wrangler secret bulk .env.deploy
Remove-Item .env.deploy
```

### The address
`wrangler deploy` prints `https://usami.<your-subdomain>.workers.dev`. The pages contain that address (canonical links,
hreflang, sitemap, share images), so after the first deploy run step 1 again with the real address and deploy again.
If you later attach your own domain, repeat with that domain.

## Try it locally (no login needed)
```powershell
powershell -File script\build_static.ps1            # defaults to http://localhost:8787
cd cloudflare
# put NVIDIA_API_KEY=... in cloudflare\.dev.vars (never committed)
npx wrangler dev --local                             # http://localhost:8787
```

## Tests and checks
- Worker logic: `npx vitest run --config cloudflare/vitest.config.ts` (from the Rails folder).
- Export: `ruby bin/rails test test/models/static_site_test.rb`.
- Types: `cd cloudflare; npx wrangler types; npx tsc --noEmit --ignoreConfig --target es2022 --module esnext --moduleResolution bundler --resolveJsonModule --skipLibCheck --strict worker/index.ts worker-configuration.d.ts`.

## Notes
- The `Dockerfile` in the Rails folder is not used by this deploy (it builds the Rails app as a container, for a host that
  runs containers). Keep or delete it as you like.
- Page links that are still being built elsewhere (FAQ, llms.txt) are exported as soon as they answer; the export prints
  which ones it skipped.