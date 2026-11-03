namespace :static do
  desc "Render the site to cloudflare/site (set SITE_URL to the public address; defaults to the local wrangler dev address)"
  task export: :environment do
    origin = ENV.fetch("SITE_URL", "http://localhost:8787")
    site = StaticSite.new(out: Rails.root.join("cloudflare/site"), origin: origin, prompts_path: Rails.root.join("cloudflare/worker/prompts.generated.json")).build
    puts "Wrote #{site.written.size} files to cloudflare/site for #{origin}"
    puts "Not published yet: #{site.skipped.join(", ")}" if site.skipped.any?
  end
end
